const db = require('../config/db');
const whatsappManager = require('../utils/whatsappManager');
const { MessageMedia } = require('whatsapp-web.js');
const pdfGenerator = require('../utils/pdfGenerator');

// Helper to format phone number to standard E.164 (without + or spaces)
const formatPhone = (phone) => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  return cleaned;
};

// Generic Real WhatsApp Gateway Dispatcher
exports.processWhatsAppDispatch = async ({ garageId, recipientPhone, messageType, messageText, mediaBase64 = null, documentName = 'Document.pdf' }) => {
  const garageRes = await db.query(
    `SELECT id, name, phone, whatsapp_credit_balance, whatsapp_cost_per_msg, 
            whatsapp_provider, whatsapp_api_token, whatsapp_phone_number_id, whatsapp_api_url, 
            feature_whatsapp, feature_whatsapp_utility, feature_whatsapp_marketing, feature_whatsapp_costing
     FROM garages WHERE id = $1`,
    [garageId]
  );

  if (garageRes.rows.length === 0) {
    throw new Error('Garage account not found');
  }

  const garage = garageRes.rows[0];

  if (!garage.feature_whatsapp) {
    throw new Error('WhatsApp messaging feature is disabled globally for your garage account. Contact Cipra Infotech support.');
  }

  if (messageType === 'marketing') {
    if (garage.feature_whatsapp_marketing === false) {
      throw new Error('Marketing broadcast messaging is disabled for your account by your Super Admin.');
    }
  } else {
    // invoice, jobsheet, reminder, ledger etc. are utility
    if (garage.feature_whatsapp_utility === false) {
      throw new Error('Utility transactional messaging is disabled for your account by your Super Admin.');
    }
  }

  const balance = parseFloat(garage.whatsapp_credit_balance || 0);
  const costPerMsg = parseFloat(garage.whatsapp_cost_per_msg || 0.15);
  const isCostingEnabled = garage.feature_whatsapp_costing;

  if (isCostingEnabled && balance < costPerMsg) {
    const errorMsg = `Insufficient WhatsApp Balance (Required: ₹${costPerMsg.toFixed(2)}, Available: ₹${balance.toFixed(2)}). Please recharge credits via Cipra Infotech Admin.`;
    
    await db.query(
      `INSERT INTO whatsapp_logs (garage_id, recipient_phone, message_type, cost_deducted, balance_after, status, error_message)
       VALUES ($1, $2, $3, 0, $4, 'blocked_insufficient_funds', $5)`,
      [garageId, recipientPhone, messageType, balance, errorMsg]
    );

    throw { code: 'INSUFFICIENT_FUNDS', message: errorMsg, balance, costPerMsg };
  }

  const formattedRecipient = formatPhone(recipientPhone);
  let gatewayMsgId = null;
  let apiError = null;

  try {
    const provider = (garage.whatsapp_provider || 'whatsapp-web').toLowerCase();
    
    if (provider === 'whatsapp-web') {
      const client = whatsappManager.getClient(garageId);
      if (!client) {
        throw new Error('WhatsApp is not connected. Please scan the QR code in settings.');
      }
      const chatId = `${formattedRecipient}@c.us`;
      
      try {
         // Warm up the contact cache to prevent "No LID for user" errors, without using getNumberId which breaks media uploads
         await client.getContactById(chatId);
      } catch (e) {
         console.log(`[WhatsApp] Contact warm up skipped for ${chatId}`);
      }
      
      let response;
      if (mediaBase64) {
         let finalMimeType = 'application/pdf';
         let finalBase64 = mediaBase64;
         let finalFilename = documentName;

         // Handle Data URIs from frontend uploads (e.g., data:image/jpeg;base64,...)
         if (mediaBase64.startsWith('data:')) {
            const matches = mediaBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
               finalMimeType = matches[1];
               finalBase64 = matches[2];
               if (finalMimeType.startsWith('image/')) {
                  finalFilename = 'poster.' + finalMimeType.split('/')[1];
               }
            }
         }

         const media = new MessageMedia(finalMimeType, finalBase64, finalFilename);
         console.log(`[WhatsApp] Dispatching media: ${finalFilename} (${finalMimeType}), Length: ${finalBase64.length}`);
         response = await client.sendMessage(chatId, messageText, { media });
      } else {
         response = await client.sendMessage(chatId, messageText);
      }
      
      gatewayMsgId = response?.id?._serialized || response?.id?.id || `WWEBJS_${Date.now()}`;
    } else {
      // Fallback or old providers
      gatewayMsgId = `MOCK_ID_${Date.now()}`;
    }
  } catch (err) {
    // Log to DB
    await db.query(
      `INSERT INTO whatsapp_logs (garage_id, recipient_phone, message_type, cost_deducted, balance_after, status, error_message)
       VALUES ($1, $2, $3, 0, $4, 'failed', $5)`,
      [garageId, formattedRecipient, messageType, balance, err.message]
    );

    if (err.message && err.message.includes('not registered on WhatsApp')) {
       // Clean log without stack trace for expected validation errors
       console.log(`[WhatsApp] Dispatch skipped: ${err.message}`);
       throw new Error(err.message);
    } else {
       console.error("WhatsApp Gateway Network Exception:", err);
       throw new Error(`WhatsApp API Dispatch Error: ${err.message}`);
    }
  }

  let newBalance = balance;
  let deducted = 0;

  if (isCostingEnabled) {
    newBalance = balance - costPerMsg;
    deducted = costPerMsg;

    await db.query(
      `UPDATE garages SET whatsapp_credit_balance = $1, updated_at = NOW() WHERE id = $2`,
      [newBalance, garageId]
    );
  }

  await db.query(
    `INSERT INTO whatsapp_logs (garage_id, recipient_phone, message_type, gateway_msg_id, cost_deducted, balance_after, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'sent')`,
    [garageId, formattedRecipient, messageType, gatewayMsgId, deducted, newBalance]
  );

  return { success: true, costDeducted: deducted, remainingBalance: newBalance, gatewayMsgId };
};

// Controllers
exports.sendInvoiceWhatsApp = async (req, res) => {
  try {
    const garageId = req.garageId;
    const { invoiceId } = req.body;

    const invRes = await db.query(
      `SELECT i.*, 
              c.name AS customer_name, c.phone AS customer_phone, c.address AS customer_address,
              v.car_number AS vehicle_car_number, 
              mk.name AS vehicle_make, md.name AS vehicle_model,
              js.job_sheet_number,
              g.name AS garage_name, g.phone AS garage_phone,
              g.logo_url AS garage_logo_url, g.address AS garage_address,
              g.gst_number AS garage_gst_number, g.bank_name AS garage_bank_name,
              g.bank_account_no AS garage_bank_account_no, g.bank_ifsc AS garage_bank_ifsc,
              g.terms_and_conditions AS garage_terms
       FROM invoices i
       JOIN customers c ON i.customer_id = c.id
       JOIN vehicles v ON i.vehicle_id = v.id
       JOIN makes mk ON v.make_id = mk.id
       JOIN models md ON v.model_id = md.id
       JOIN garages g ON i.garage_id = g.id
       LEFT JOIN job_sheets js ON i.job_sheet_id = js.id
       WHERE i.id = $1 AND i.garage_id = $2`,
      [invoiceId, garageId]
    );

    if (invRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const inv = invRes.rows[0];
    if (!inv.customer_phone) {
      return res.status(400).json({ success: false, message: 'Customer phone number is missing' });
    }

    // Generate PDF in memory
    const itemsRes = await db.query(
      `SELECT item.*, mi.part_no, mi.name, (item.unit_price * item.quantity) AS line_parts_calculated
       FROM invoice_items item
       JOIN master_items mi ON item.master_item_id = mi.id
       WHERE item.invoice_id = $1`,
      [invoiceId]
    );
    const items = itemsRes.rows;
    
    let pdfBase64 = null;
    try {
       const garageData = {
           name: inv.garage_name, 
           phone: inv.garage_phone, 
           address: inv.garage_address, 
           gst_number: inv.garage_gst_number,
           logo_url: inv.garage_logo_url,
           bank_name: inv.garage_bank_name,
           bank_account_no: inv.garage_bank_account_no,
           bank_ifsc: inv.garage_bank_ifsc,
           terms_and_conditions: inv.garage_terms
       };
       pdfBase64 = await pdfGenerator.generateInvoicePDF(inv, garageData, items);
    } catch (pdfErr) {
       console.error("PDF Generation failed", pdfErr);
       // We can continue without PDF or throw, better to throw for professional requirement
       return res.status(500).json({ success: false, message: 'Failed to generate PDF attachment' });
    }

    const totalAmt = parseFloat(inv.grand_total || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
    const message = `Hello *${inv.customer_name}* 🚗,\n\nThank you for choosing us for your vehicle service! Please find your detailed invoice attached to this message.\n\n📄 *Summary:*\n  Invoice No: *${inv.invoice_number}*\n  Vehicle No: *${inv.vehicle_car_number || inv.car_number || 'N/A'}*\n  Total Amount: *${totalAmt}*\n\nIf you have any questions, feel free to reply to this message or call us at ${inv.garage_phone || ''}.\n\nBest regards,\n*${inv.garage_name}*`;

    const result = await processWhatsAppDispatch({
      garageId,
      recipientPhone: inv.customer_phone,
      messageType: 'invoice',
      messageText: message,
      mediaBase64: pdfBase64,
      documentName: `${inv.invoice_number}.pdf`
    });

    res.json({
      success: true,
      message: `Invoice WhatsApp sent successfully!`,
      remainingBalance: result.remainingBalance
    });
  } catch (error) {
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return res.status(402).json({ success: false, code: 'INSUFFICIENT_FUNDS', message: error.message });
    }
    
    if (error.message && error.message.includes('not registered on WhatsApp')) {
       return res.status(400).json({ success: false, message: error.message });
    }
    
    console.error('Error sending invoice WhatsApp:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to send WhatsApp message' });
  }
};

exports.sendJobSheetWhatsApp = async (req, res) => {
  try {
    const garageId = req.garageId;
    const { jobSheetId } = req.body;

    const jsRes = await db.query(
      `SELECT js.*, c.name AS customer_name, c.phone AS customer_phone, v.car_number, g.name AS garage_name, g.phone AS garage_phone
       FROM job_sheets js
       JOIN customers c ON js.customer_id = c.id
       JOIN vehicles v ON js.vehicle_id = v.id
       JOIN garages g ON js.garage_id = g.id
       WHERE js.id = $1 AND js.garage_id = $2`,
      [jobSheetId, garageId]
    );

    if (jsRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Job Sheet not found' });
    }

    const js = jsRes.rows[0];
    const message = `Hello *${js.customer_name}* 👋,\n\nUpdate from *${js.garage_name}*:\n\n📋 *Job Sheet ${js.job_sheet_number}*\n• Vehicle: *${js.car_number}*\n• Status: *${js.status.toUpperCase()}*\n\nThank you!`;

    const result = await processWhatsAppDispatch({
      garageId,
      recipientPhone: js.customer_phone,
      messageType: 'jobsheet',
      messageText: message
    });

    res.json({
      success: true,
      message: `Job Sheet status WhatsApp sent!`,
      remainingBalance: result.remainingBalance
    });
  } catch (error) {
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return res.status(402).json({ success: false, code: 'INSUFFICIENT_FUNDS', message: error.message });
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to send WhatsApp message' });
  }
};

exports.sendReminderWhatsApp = async (req, res) => {
  try {
    const garageId = req.garageId;
    const { phone, customerName, carNumber, type, invoiceNumber, amountDue, invoiceDate, invoiceCount, totalDue } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Customer phone number is required' });
    }

    const garageRes = await db.query('SELECT name, phone FROM garages WHERE id = $1', [garageId]);
    const garagePhone = garageRes.rows[0]?.phone || '';

    let message = '';
    
    if (type === 'single_invoice') {
        const formattedAmt = parseFloat(amountDue || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
        // Format date to DD-MM-YYYY
        const formattedDate = new Date(invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
        message = `Hello *${customerName || 'Valued Customer'}* 👋,\n\nThis is a payment reminder for your vehicle *${carNumber || 'N/A'}*.\n\n📄 *Invoice Details:*\n  Invoice No: *${invoiceNumber}*\n  Date: *${formattedDate}*\n  Amount Due: *${formattedAmt}*\n\nPlease arrange for the payment at your earliest convenience. Contact us at ${garagePhone} for any queries.`;
    } else if (type === 'general_reminder') {
        const formattedTotal = parseFloat(totalDue || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
        message = `Hello *${customerName || 'Valued Customer'}* 👋,\n\nThis is a general payment reminder for your pending invoices.\n\n📄 *Pending Summary:*\n  Total Invoices: *${invoiceCount}*\n  Total Amount Due: *${formattedTotal}*\n\nPlease arrange for the payment at your earliest convenience. Contact us at ${garagePhone} for any queries.`;
    } else {
        message = `Hello *${customerName || 'Valued Customer'}* 👋,\n\nThis is a reminder from our garage regarding your vehicle *${carNumber || ''}*.\n\nPlease contact us at ${garagePhone} to schedule your visit.`;
    }

    const result = await processWhatsAppDispatch({
      garageId,
      recipientPhone: phone,
      messageType: 'reminder',
      messageText: message
    });

    res.json({
      success: true,
      message: `Reminder WhatsApp sent!`,
      remainingBalance: result.remainingBalance
    });
  } catch (error) {
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return res.status(402).json({ success: false, code: 'INSUFFICIENT_FUNDS', message: error.message });
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to send WhatsApp message' });
  }
};

exports.getWhatsAppBalance = async (req, res) => {
  try {
    const garageId = req.garageId;
    const { rows } = await db.query(
      'SELECT whatsapp_credit_balance, whatsapp_cost_per_msg, feature_whatsapp, feature_whatsapp_costing, whatsapp_provider, whatsapp_api_url, whatsapp_phone_number_id FROM garages WHERE id = $1',
      [garageId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Garage not found' });
    }

    res.json({
      success: true,
      balance: parseFloat(rows[0].whatsapp_credit_balance || 0),
      costPerMsg: parseFloat(rows[0].whatsapp_cost_per_msg || 0.15),
      featureEnabled: rows[0].feature_whatsapp,
      costingEnabled: rows[0].feature_whatsapp_costing,
      provider: rows[0].whatsapp_provider || 'ultramsg',
      apiUrl: rows[0].whatsapp_api_url || '',
      phoneNumberId: rows[0].whatsapp_phone_number_id || ''
    });
  } catch (error) {
    console.error('Error getting WhatsApp balance:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch WhatsApp balance' });
  }
};

exports.getWhatsAppLogs = async (req, res) => {
  try {
    const garageId = req.garageId;
    const { rows } = await db.query(
      `SELECT id, recipient_phone, message_type, gateway_msg_id, cost_deducted, balance_after, status, error_message, created_at
       FROM whatsapp_logs
       WHERE garage_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [garageId]
    );
    res.json({ success: true, logs: rows });
  } catch (error) {
    console.error('Error fetching WhatsApp logs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch logs' });
  }
};

exports.sendMarketingWhatsApp = async (req, res) => {
  try {
    const garageId = req.garageId;
    const { phone, message, poster } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ success: false, message: 'Phone number and message are required' });
    }

    const result = await processWhatsAppDispatch({
      garageId,
      recipientPhone: phone,
      messageType: 'marketing',
      messageText: message,
      mediaBase64: poster
    });

    res.json({
      success: true,
      message: `Marketing WhatsApp sent! (₹${result.costDeducted.toFixed(2)} deducted)`,
      remainingBalance: result.remainingBalance
    });
  } catch (error) {
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return res.status(402).json({ success: false, code: 'INSUFFICIENT_FUNDS', message: error.message });
    }
    
    if (error.message && error.message.includes('not registered on WhatsApp')) {
       return res.status(400).json({ success: false, message: error.message });
    }

    console.error('Error sending marketing WhatsApp:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to send WhatsApp message' });
  }
};

// --- Meta Embedded Signup Endpoints ---

exports.getWhatsAppStatus = async (req, res) => {
  try {
    const garageId = req.garageId;
    const { rows } = await db.query(
      `SELECT whatsapp_status, whatsapp_phone_number, whatsapp_waba_id, whatsapp_provider, plan_id 
       FROM garages WHERE id = $1`,
      [garageId]
    );

    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Garage not found' });
    
    // Quick mock for Plan name, normally join with plans table
    let planName = 'Basic';
    if (rows[0].plan_id) planName = 'Professional'; // simple mock

    // Check actual memory client status
    const client = whatsappManager.getClient(garageId);
    let realStatus = rows[0].whatsapp_status;
    let phoneNumber = rows[0].whatsapp_phone_number;

    if (client) {
      const state = await client.getState().catch(() => null);
      if (state === 'CONNECTED') {
        realStatus = 'connected';
        phoneNumber = client.info?.wid?.user || phoneNumber;
        
        // Auto-update DB if it says disconnected but we are connected
        if (rows[0].whatsapp_status !== 'connected') {
            await db.query(`UPDATE garages SET whatsapp_status = 'connected', whatsapp_provider = 'whatsapp-web', whatsapp_phone_number = $1 WHERE id = $2`, [phoneNumber, garageId]);
        }
      } else {
        // Client in memory but not in CONNECTED state (e.g. disconnected, or invalid session)
        if (realStatus === 'connected') {
          realStatus = 'disconnected';
          await db.query(`UPDATE garages SET whatsapp_status = 'disconnected' WHERE id = $1`, [garageId]);
        }
      }
    } else {
      if (realStatus === 'connected') {
        // DB says connected, but no client in memory.
        // It's genuinely disconnected or failed to restore. Let's sync the DB to reflect reality.
        realStatus = 'disconnected';
        await db.query(`UPDATE garages SET whatsapp_status = 'disconnected' WHERE id = $1`, [garageId]);
      }
    }

    res.json({
      success: true,
      status: realStatus || 'disconnected',
      phoneNumber: phoneNumber,
      provider: 'whatsapp-web',
      plan: planName
    });
  } catch (error) {
    console.error('Error fetching WhatsApp status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getWhatsAppQR = async (req, res) => {
  try {
    const garageId = req.garageId;
    
    // We don't wait for the callback inside the response, 
    // because generating QR takes a few seconds and the client is async.
    // Instead, we will initiate it, and use Server-Sent Events or long-polling.
    // For simplicity, we can wrap it in a Promise for a basic HTTP response if we know it generates fast, 
    // or just let the frontend poll /status. 
    // Best simple approach for HTTP request: Wait for first QR.
    
    // Set a timeout to prevent hanging
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for QR')), 25000));
    
    const qrPromise = new Promise((resolve) => {
      whatsappManager.initializeClient(
        garageId,
        async (qrDataUrl) => {
          resolve(qrDataUrl);
        },
        async () => {
          // On Ready
          await db.query(`UPDATE garages SET whatsapp_status = 'connected', whatsapp_provider = 'whatsapp-web' WHERE id = $1`, [garageId]);
        },
        async (reason) => {
          // On Disconnected
          await db.query(`UPDATE garages SET whatsapp_status = 'disconnected' WHERE id = $1`, [garageId]);
        }
      );
    });

    try {
      const qrDataUrl = await Promise.race([qrPromise, timeout]);
      res.json({ success: true, qrCode: qrDataUrl });
    } catch (e) {
      const client = whatsappManager.getClient(garageId);
      const state = client ? await client.getState().catch(() => null) : null;
      if (state === 'CONNECTED') {
         res.json({ success: true, message: 'Already connected', status: 'connected' });
      } else {
         res.status(500).json({ success: false, message: 'Failed to generate QR or already connected. Try again.' });
      }
    }

  } catch (error) {
    console.error('Error in getWhatsAppQR:', error);
    res.status(500).json({ success: false, message: 'Server error generating QR' });
  }
};

exports.connectWhatsApp = async (req, res) => {
  try {
    const garageId = req.garageId;
    const { accessToken, wabaId, phoneNumberId, phoneNumber } = req.body;

    if (!accessToken || !wabaId || !phoneNumberId) {
      return res.status(400).json({ success: false, message: 'Missing Meta tokens' });
    }

    // Update the database with the official Meta API tokens
    await db.query(
      `UPDATE garages 
       SET whatsapp_provider = 'meta',
           whatsapp_api_token = $1,
           whatsapp_waba_id = $2,
           whatsapp_phone_number_id = $3,
           whatsapp_phone_number = $4,
           whatsapp_api_url = $5,
           whatsapp_status = 'connected',
           feature_whatsapp = true,
           updated_at = NOW()
       WHERE id = $6`,
      [
        accessToken, 
        wabaId, 
        phoneNumberId, 
        phoneNumber || 'Unknown', 
        `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, 
        garageId
      ]
    );

    res.json({ success: true, message: 'WhatsApp officially connected via Meta!' });
  } catch (error) {
    console.error('Error connecting WhatsApp:', error);
    res.status(500).json({ success: false, message: 'Server error during Meta connection' });
  }
};

exports.disconnectWhatsApp = async (req, res) => {
  try {
    const garageId = req.garageId;
    
    await whatsappManager.logoutClient(garageId);

    await db.query(
      `UPDATE garages 
       SET whatsapp_status = 'disconnected',
           whatsapp_api_token = NULL,
           whatsapp_waba_id = NULL,
           whatsapp_phone_number_id = NULL,
           whatsapp_phone_number = NULL,
           whatsapp_provider = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [garageId]
    );

    res.json({ success: true, message: 'WhatsApp disconnected successfully.' });
  } catch (error) {
    console.error('Error disconnecting WhatsApp:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.sendLedgerWhatsApp = async (req, res) => {
  try {
    const garageId = req.garageId;
    const { phone, customerName, transactions, totalBilled, totalPaid, totalDue, periodText = 'All Transactions' } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Customer phone number is required' });
    }

    const garageRes = await db.query('SELECT name, phone, address, gst_number, logo_url FROM garages WHERE id = $1', [garageId]);
    const garageData = garageRes.rows[0] || {};
    const garageName = garageData.name || 'Our Garage';

    // Generate PDF
    const pdfBase64 = await pdfGenerator.generateLedgerPDF(customerName, transactions, totalBilled, totalPaid, totalDue, garageData, phone, periodText);

    const formattedTotal = parseFloat(totalDue || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
    const message = `Hello *${customerName || 'Valued Customer'}* 👋,\n\nPlease find attached your complete Ledger Statement from *${garageName}* for *${periodText}*.\n\n📄 *Summary:*\n  Total Billed: *${parseFloat(totalBilled || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}*\n  Total Paid: *${parseFloat(totalPaid || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}*\n  Current Balance Due: *${formattedTotal}*\n\nIf you have any questions, feel free to reply to this message or call us at ${garageData.phone || ''}.`;

    const cleanPeriodText = periodText.replace(/[^a-zA-Z0-9]/g, '_');
    const result = await processWhatsAppDispatch({
      garageId,
      recipientPhone: phone,
      messageType: 'invoice', // We use invoice type so it charges properly and handles attachments
      messageText: message,
      mediaBase64: pdfBase64,
      documentName: `${customerName.replace(/\s+/g, '_')}_Ledger_${cleanPeriodText}.pdf`
    });

    res.json({
      success: true,
      message: `Ledger PDF WhatsApp sent!`,
      remainingBalance: result.remainingBalance
    });
  } catch (error) {
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return res.status(402).json({ success: false, code: 'INSUFFICIENT_FUNDS', message: error.message });
    }
    console.error('Error sending Ledger WhatsApp:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to send WhatsApp message' });
  }
};
