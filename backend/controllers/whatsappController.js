const db = require('../config/db');
const whatsappManager = require('../utils/whatsappManager');
const { MessageMedia } = require('whatsapp-web.js');
const pdfGenerator = require('../utils/pdfGenerator');
const jwt = require('jsonwebtoken');

// Secret for signing one-time agent-script download tokens (never exposed to client)
const AGENT_SCRIPT_SECRET = process.env.AGENT_SCRIPT_SECRET || process.env.JWT_SECRET || 'cipra_agent_script_secret_2026';

// Helper to format phone number to standard E.164 (without + or spaces)
const formatPhone = (phone) => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  return cleaned;
};

// Helper to send message via Meta WhatsApp Cloud API
const sendMetaWhatsAppCloudMessage = async ({ phoneNumberId, systemToken, recipientPhone, messageText, mediaBase64, documentName }) => {
  const metaUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  if (mediaBase64) {
    let finalMimeType = 'application/pdf';
    let rawBase64 = mediaBase64;
    let filename = documentName || 'Document.pdf';

    if (mediaBase64.startsWith('data:')) {
      const matches = mediaBase64.match(/^data:([a-zA-Z0-9-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        finalMimeType = matches[1];
        rawBase64 = matches[2];
      }
    }

    const mediaBuffer = Buffer.from(rawBase64, 'base64');
    
    // Upload media to Meta Media endpoint first
    const formData = new FormData();
    const mediaBlob = new Blob([mediaBuffer], { type: finalMimeType });
    formData.append('file', mediaBlob, filename);
    formData.append('messaging_product', 'whatsapp');

    const mediaUploadRes = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${systemToken}`
      },
      body: formData
    });

    const mediaUploadData = await mediaUploadRes.json();
    if (!mediaUploadRes.ok || !mediaUploadData.id) {
      throw new Error(mediaUploadData.error?.message || 'Failed to upload media to Meta Cloud API');
    }

    const mediaId = mediaUploadData.id;
    const isImage = finalMimeType.startsWith('image/');

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientPhone,
      type: isImage ? 'image' : 'document',
      [isImage ? 'image' : 'document']: {
        id: mediaId,
        caption: messageText,
        filename: filename
      }
    };

    const res = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${systemToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Meta Cloud API document dispatch error');
    }

    return data.messages?.[0]?.id || `META_${Date.now()}`;
  } else {
    // Plain text message
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientPhone,
      type: 'text',
      text: { preview_url: false, body: messageText }
    };

    const res = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${systemToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Meta Cloud API message dispatch error');
    }

    return data.messages?.[0]?.id || `META_${Date.now()}`;
  }
};

// Generic Real WhatsApp Gateway Dispatcher
const processWhatsAppDispatch = async ({ garageId, recipientPhone, messageType, messageText, mediaBase64 = null, documentName = 'Document.pdf', req = null }) => {
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
  let provider = garage.whatsapp_provider || 'local-bridge';

  // If Meta Cloud API is set as provider but no Phone Number ID exists, seamlessly use local-bridge session
  if (provider === 'meta_cloud_api' && !garage.whatsapp_phone_number_id) {
    provider = 'local-bridge';
  }

  if (provider === 'local-bridge' || provider === 'whatsapp-web') {
    // Check if Remote Agent Socket is connected via Socket.io
    const bridgeSockets = global.bridgeSockets || (req && req.app ? req.app.get('bridgeSockets') : null);
    const agentSocket = bridgeSockets ? (bridgeSockets[String(garageId)] || bridgeSockets[Number(garageId)]) : null;

    // Strict Check: Require active Remote Agent Socket
    if (!agentSocket) {
      throw new Error('Workshop PC WhatsApp Agent is OFFLINE. Please start the 1-Click WhatsApp Agent on your workshop computer.');
    }

    // Mode 1: Local Workshop Computer Bridge
    const logRes = await db.query(
      `INSERT INTO whatsapp_logs (garage_id, recipient_phone, message_type, cost_deducted, balance_after, status, message_text, media_base64, document_name)
       VALUES ($1, $2, $3, 0, $4, 'queued_for_bridge', $5, $6, $7) RETURNING id`,
      [garageId, formattedRecipient, messageType, balance, messageText, mediaBase64, documentName]
    );

    const jobId = logRes.rows[0].id;

    if (agentSocket) {
      console.log(`⚡ [Socket.io Bridge] Instantly emitting job #${jobId} to Garage ${garageId} Local Bridge...`);
      agentSocket.emit('send_whatsapp_message', {
        id: jobId,
        recipient_phone: formattedRecipient,
        message_text: messageText,
        media_base64: mediaBase64,
        document_name: documentName
      });

      // Wait up to 6 seconds for real-time delivery ack from local agent
      const ackResult = await new Promise((resolve) => {
        let attempts = 0;
        const ackInterval = setInterval(async () => {
          attempts++;
          try {
            const checkRes = await db.query(
              `SELECT status, error_message, gateway_msg_id FROM whatsapp_logs WHERE id = $1`,
              [jobId]
            );
            const currentJob = checkRes.rows[0];
            if (currentJob && currentJob.status === 'sent') {
              clearInterval(ackInterval);
              resolve({ success: true, gatewayMsgId: currentJob.gateway_msg_id });
            } else if (currentJob && currentJob.status === 'failed') {
              clearInterval(ackInterval);
              resolve({ success: false, errorMessage: currentJob.error_message || 'Local PC Agent failed to send message' });
            }
          } catch (e) {}

          if (attempts >= 6) {
            clearInterval(ackInterval);
            resolve({ success: true, mode: 'queued', message: 'Job queued for Local Agent processing' });
          }
        }, 1000);
      });

      if (ackResult.success === false) {
        const err = new Error(ackResult.errorMessage);
        err.code = 'AGENT_DISPATCH_FAILED';
        throw err;
      }

      return { 
        success: true, 
        mode: 'local-bridge-ack', 
        jobId: jobId, 
        message: 'WhatsApp message delivered successfully to recipient!' 
      };
    }

  } else if (provider === 'direct_click') {
    // Mode 2: Direct 1-Click WhatsApp Link (Zero server memory, zero ban risk)
    const encodedText = encodeURIComponent(messageText);
    const waUrl = `https://wa.me/${formattedRecipient}?text=${encodedText}`;

    await db.query(
      `INSERT INTO whatsapp_logs (garage_id, recipient_phone, message_type, gateway_msg_id, cost_deducted, balance_after, status)
       VALUES ($1, $2, $3, 'DIRECT_CLICK', 0, $4, 'sent')`,
      [garageId, formattedRecipient, messageType, balance]
    );

    return { success: true, mode: 'direct_click', waUrl, messageText };

  } else {
    // Mode 3: Official Meta Cloud API Dispatch
    try {
      const systemToken = process.env.META_SYSTEM_TOKEN || garage.whatsapp_api_token;
      const phoneNumberId = garage.whatsapp_phone_number_id;

      if (!phoneNumberId) {
        throw new Error('WhatsApp Phone Number ID is not configured for this garage.');
      }

      if (!systemToken) {
        throw new Error('META_SYSTEM_TOKEN is not configured in backend environment. Please set META_SYSTEM_TOKEN in server .env.');
      }

      gatewayMsgId = await sendMetaWhatsAppCloudMessage({
        phoneNumberId,
        systemToken,
        recipientPhone: formattedRecipient,
        messageText,
        mediaBase64,
        documentName
      });
    } catch (err) {
      await db.query(
        `INSERT INTO whatsapp_logs (garage_id, recipient_phone, message_type, cost_deducted, balance_after, status, error_message)
         VALUES ($1, $2, $3, 0, $4, 'failed', $5)`,
        [garageId, formattedRecipient, messageType, balance, err.message]
      );

      if (err.message && err.message.includes('not registered on WhatsApp')) {
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
  }
};

exports.processWhatsAppDispatch = processWhatsAppDispatch;

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
      documentName: `${inv.invoice_number}.pdf`,
      req
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
    
    if (error.code === 'AGENT_DISPATCH_FAILED' || (error.message && (error.message.includes('OFFLINE') || error.message.includes('unauthenticated') || error.message.includes('not registered') || error.message.includes('Local PC Agent')))) {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    console.error('Error in WhatsApp controller:', error);
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
      messageText: message,
      req
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
        // Format date safely (prevent RangeError: Invalid time value)
        let formattedDate = 'N/A';
        if (invoiceDate) {
          const d = new Date(invoiceDate);
          if (!isNaN(d.getTime())) {
            formattedDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
          }
        }
        message = `Hello *${customerName || 'Valued Customer'}* 👋,\n\nThis is a payment reminder for your vehicle *${carNumber || 'N/A'}*.\n\n📄 *Invoice Details:*\n  Invoice No: *${invoiceNumber || 'N/A'}*\n  Date: *${formattedDate}*\n  Amount Due: *${formattedAmt}*\n\nPlease arrange for the payment at your earliest convenience. Contact us at ${garagePhone} for any queries.`;
    } else if (type === 'general_reminder') {
        const formattedTotal = parseFloat(totalDue || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
        message = `Hello *${customerName || 'Valued Customer'}* 👋,\n\nThis is a general payment reminder for your pending invoices.\n\n📄 *Pending Summary:*\n  Total Invoices: *${invoiceCount || 1}*\n  Total Amount Due: *${formattedTotal}*\n\nPlease arrange for the payment at your earliest convenience. Contact us at ${garagePhone} for any queries.`;
    } else {
        message = `Hello *${customerName || 'Valued Customer'}* 👋,\n\nThis is a reminder from our garage regarding your vehicle *${carNumber || ''}*.\n\nPlease contact us at ${garagePhone} to schedule your visit.`;
    }

    const result = await processWhatsAppDispatch({
      garageId,
      recipientPhone: phone,
      messageType: 'reminder',
      messageText: message,
      req
    });

    res.json({
      success: true,
      message: `Reminder WhatsApp sent!`,
      remainingBalance: result?.remainingBalance
    });
  } catch (error) {
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return res.status(402).json({ success: false, code: 'INSUFFICIENT_FUNDS', message: error.message });
    }

    if (error.code === 'AGENT_DISPATCH_FAILED' || (error.message && (error.message.includes('OFFLINE') || error.message.includes('unauthenticated') || error.message.includes('not registered') || error.message.includes('Local PC Agent')))) {
      return res.status(400).json({ success: false, message: error.message });
    }

    console.error('Error sending reminder WhatsApp:', error);
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
      `SELECT id, name, phone, whatsapp_status, whatsapp_provider, whatsapp_phone_number, whatsapp_phone_number_id, feature_whatsapp FROM garages WHERE id = $1`,
      [garageId]
    );

    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Garage not found' });
    
    const garage = rows[0];
    const bridgeSockets = global.bridgeSockets || (req && req.app ? req.app.get('bridgeSockets') : null);
    const agentSocket = bridgeSockets ? (bridgeSockets[String(garageId)] || bridgeSockets[Number(garageId)]) : null;
    const isAgentConnected = !!agentSocket;

    // Fully connected ONLY if Agent Socket is active AND WhatsApp Web is authenticated
    const isConnected = isAgentConnected && (garage.whatsapp_status === 'connected');

    res.json({
      success: true,
      status: isConnected ? 'connected' : 'disconnected',
      isAgentConnected,
      provider: garage.whatsapp_provider || 'local-bridge',
      phoneNumberId: garage.whatsapp_phone_number_id || null,
      phoneNumber: isConnected ? (garage.whatsapp_phone_number || 'Workshop PC Agent') : null,
      message: isConnected 
        ? 'Workshop PC WhatsApp Agent is ONLINE & Connected'
        : (isAgentConnected ? 'Agent Socket Online. Please scan QR Code on WhatsApp.' : 'Workshop PC WhatsApp Agent is OFFLINE. Please start the 1-Click WhatsApp Agent.')
    });
  } catch (error) {
    console.error('Error fetching WhatsApp status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getWhatsAppQR = async (req, res) => {
  try {
    const garageId = req.garageId;
    
    // Check if Local Agent Socket is connected for this garage
    const bridgeSockets = global.bridgeSockets || (req && req.app ? req.app.get('bridgeSockets') : null);
    const agentSocket = bridgeSockets ? (bridgeSockets[String(garageId)] || bridgeSockets[Number(garageId)]) : null;

    if (!agentSocket) {
      return res.status(400).json({
        success: false,
        isAgentConnected: false,
        message: 'Workshop PC Agent is OFFLINE. Please run the 1-Click WhatsApp Agent setup script on your computer first.'
      });
    }

    console.log(`📲 [Remote Control] Triggering QR Generation on Local Agent for Garage ${garageId}...`);
    agentSocket.emit('request_agent_qr', { garageId });
    agentSocket.emit('agent_generate_qr', { garageId });
    
    // Poll req.app for cached QR code from agent_qr_code event
    let attempts = 0;
    const checkInterval = setInterval(() => {
      attempts++;
      const cachedQr = req.app.get(`qr_code_${garageId}`);
      if (cachedQr) {
        clearInterval(checkInterval);
        req.app.set(`qr_code_${garageId}`, null); // Clear single-use cache
        return res.json({ success: true, isAgentConnected: true, qrCode: cachedQr });
      }
      if (attempts >= 60) {
        clearInterval(checkInterval);
        return res.json({
          success: false,
          isAgentConnected: true,
          message: 'Local agent is connected, but QR code response timed out. Click Generate Connection QR Code button again.'
        });
      }
    }, 1000);
  } catch (err) {
    console.error('Error in getWhatsAppQR:', err);
    res.status(500).json({ success: false, message: 'Failed to generate QR code' });
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

    // Send remote agent_disconnect command down socket tunnel if Local PC Agent is connected
    const bridgeSockets = req.app.get('bridgeSockets');
    if (bridgeSockets && bridgeSockets[garageId]) {
      console.log(`📲 [Remote Control] Emitting agent_disconnect to Local Agent for Garage ${garageId}...`);
      bridgeSockets[garageId].emit('agent_disconnect', { garageId });
    }

    // Force clean local session folder on disk
    const fs = require('fs');
    const path = require('path');
    const sessionPath = path.join(__dirname, `../.wwebjs_auth/session-garage_${garageId}`);
    if (fs.existsSync(sessionPath)) {
      try {
        fs.rmSync(sessionPath, { recursive: true, force: true });
        console.log(`[WhatsApp] Session folder forcefully cleaned for garage ${garageId}`);
      } catch (cleanErr) {
        console.error(`[WhatsApp] Clean session folder error:`, cleanErr);
      }
    }

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
      documentName: `${customerName.replace(/\s+/g, '_')}_Ledger_${cleanPeriodText}.pdf`,
      req
    });

    res.json({
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

// ==========================================================================
// LOCAL WORKSHOP WHATSAPP BRIDGE ENDPOINTS
// ==========================================================================

// @desc    Poll pending queued messages for Local WhatsApp Bridge
// @route   GET /api/whatsapp/bridge/pending
exports.getPendingBridgeMessages = async (req, res) => {
  try {
    const garageId = req.query.garageId || req.garageId;
    if (!garageId) return res.status(400).json({ success: false, message: 'Garage ID required' });

    const { rows } = await db.query(
      `SELECT id, recipient_phone, message_type, message_text, media_base64, document_name, created_at
       FROM whatsapp_logs
       WHERE garage_id = $1 AND status = 'queued_for_bridge'
       ORDER BY id ASC LIMIT 5`,
      [garageId]
    );

    res.json({ success: true, count: rows.length, jobs: rows });
  } catch (err) {
    console.error('Error in getPendingBridgeMessages:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Acknowledge completed message by Local WhatsApp Bridge
// @route   POST /api/whatsapp/bridge/ack
exports.acknowledgeBridgeMessage = async (req, res) => {
  try {
    const { jobId, garageId, status, gatewayMsgId, errorMessage } = req.body;

    if (status === 'sent') {
      await db.query(
        `UPDATE whatsapp_logs
         SET status = 'sent', gateway_msg_id = $1, error_message = NULL
         WHERE id = $2 AND garage_id = $3`,
        [gatewayMsgId || `LOCAL_${Date.now()}`, jobId, garageId]
      );
    } else {
      await db.query(
        `UPDATE whatsapp_logs
         SET status = 'failed', error_message = $1
         WHERE id = $2 AND garage_id = $3`,
        [errorMessage || 'Local bridge dispatch failed', jobId, garageId]
      );
    }

    res.json({ success: true, message: 'Job acknowledged successfully' });
  } catch (err) {
    console.error('Error in acknowledgeBridgeMessage:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Serve the raw JS agent script — requires a valid signed JWT token
exports.getAgentScript = async (req, res) => {
  try {
    // --- Token verification: only signed .bat files can download the agent script ---
    const downloadToken = req.query.token;
    if (!downloadToken) {
      return res.status(401).send('// Unauthorized: Missing download token.');
    }
    let tokenPayload;
    try {
      tokenPayload = jwt.verify(downloadToken, AGENT_SCRIPT_SECRET);
    } catch (e) {
      return res.status(401).send('// Unauthorized: Token expired or invalid.');
    }
    if (!['agent_script', 'agent_script_download'].includes(tokenPayload.purpose)) {
      return res.status(403).send('// Forbidden: Invalid token purpose.');
    }

    const garageId = tokenPayload.garageId || req.params.garageId;
    let { rows } = await db.query(`SELECT name, whatsapp_agent_secret FROM garages WHERE id = $1`, [garageId]);
    
    // Auto-generate secret if it doesn't exist
    let agentSecret = rows.length > 0 ? rows[0].whatsapp_agent_secret : null;
    if (rows.length > 0 && !agentSecret) {
      const crypto = require('crypto');
      agentSecret = crypto.randomUUID();
      await db.query(`UPDATE garages SET whatsapp_agent_secret = $1 WHERE id = $2`, [agentSecret, garageId]);
    }
    
    const garageName = rows.length > 0 ? rows[0].name : `Garage ${garageId}`;

    let host = req.get('host') || 'localhost:5001';
    let protocol = 'http';
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      protocol = 'http';
      host = 'localhost:5001';
    } else {
      protocol = 'https';
    }

    const backendUrl = `${protocol}://${host}/api`;
    const socketUrl = `${protocol}://${host}`;

    const path = require('path');
    const fs = require('fs');
    const templatePath = path.join(__dirname, '../scripts/garage-whatsapp-bridge-template.js');

    if (!fs.existsSync(templatePath)) {
      return res.status(404).send('// Error: Bridge template script not found.');
    }

    let scriptContent = fs.readFileSync(templatePath, 'utf8');
    scriptContent = scriptContent
      .replace(/const GARAGE_ID = .*;/g, `const GARAGE_ID = ${garageId};`)
      .replace(/const GARAGE_NAME = .*;/g, `const GARAGE_NAME = "${garageName}";`)
      .replace(/const BACKEND_URL = .*;/g, `const BACKEND_URL = '${backendUrl}';`)
      .replace(/const SOCKET_URL = .*;/g, `const SOCKET_URL = '${socketUrl}';`)
      .replace(/const AGENT_SECRET = .*;/g, `const AGENT_SECRET = '${agentSecret}';`);

    res.setHeader('Content-Type', 'application/javascript');
    res.send(scriptContent);
  } catch (err) {
    console.error('Error serving agent script:', err);
    res.status(500).send('// Server Error serving agent script');
  }
};

// @desc    Generate a signed one-time download token for the agent .bat installer
exports.generateAgentToken = async (req, res) => {
  try {
    const garageId = req.garageId;
    const token = jwt.sign(
      { garageId, purpose: 'agent_script_download' },
      AGENT_SCRIPT_SECRET,
      { expiresIn: '10m' } // Token valid 10 minutes — enough to click Download
    );
    res.json({ success: true, token });
  } catch (err) {
    console.error('Error generating agent token:', err);
    res.status(500).json({ success: false, message: 'Could not generate download token.' });
  }
};

// @desc    Generate 1-Click Windows .bat Batch Script for Local Agent Setup
// @access  Protected (requires valid signed agent token via ?token=)
exports.downloadBridgeScript = async (req, res) => {
  try {
    // --- Verify signed token (prevents unauthorized .bat downloads) ---
    const downloadToken = req.query.token;
    if (!downloadToken) {
      return res.status(401).json({ success: false, message: 'Missing download token. Please generate a new download link from Settings.' });
    }

    let tokenPayload;
    try {
      tokenPayload = jwt.verify(downloadToken, AGENT_SCRIPT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Download link has expired or is invalid. Please generate a new one from Settings.' });
    }

    if (tokenPayload.purpose !== 'agent_script_download') {
      return res.status(403).json({ success: false, message: 'Invalid token purpose.' });
    }

    const garageId = tokenPayload.garageId;

    // --- Fetch garage info ---
    const { rows } = await db.query(
      `SELECT id, name, phone, whatsapp_provider FROM garages WHERE id = $1`,
      [garageId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Garage not found.' });
    }
    const garage = rows[0];
    const garageName = garage.name || `Garage ${garageId}`;

    // Create a safe slug for file naming: e.g. "Saman Motors" -> "Saman-Motors"
    const garageSlug = garageName.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const agentFileName = `garage-${garageId}-agent.js`;
    const batFileName = `${garageSlug}-WhatsApp-Agent.bat`;
    const installDirName = `CipraWA_${garageSlug}_${garageId}`;

    // --- Determine base URL for agent script download ---
    // Generate a fresh signed token for the agent.js script (separate from the .bat token)
    const scriptToken = jwt.sign(
      { garageId, purpose: 'agent_script' },
      AGENT_SCRIPT_SECRET,
      { expiresIn: '30d' } // Script token lasts 30 days; agent re-downloads on each .bat run
    );

    let host = req.get('host') || 'localhost:5001';
    let protocol = 'http';
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      protocol = 'http';
      host = 'localhost:5001';
    } else {
      protocol = 'https';
    }

    const scriptDownloadUrl = `${protocol}://${host}/api/whatsapp/bridge/script/${garageId}?token=${scriptToken}`;

    // --- Generate .bat content (NO DB credentials, NO secrets, NO sensitive info) ---
    const batContent = `@echo off
title ${garageName} - Cipra WhatsApp Agent
color 0A

echo ================================================================
echo         CIPRA GMS - Workshop WhatsApp Agent Installer
echo ================================================================
echo.
echo  Garage : ${garageName}
echo.

:: ---------- Check Node.js is installed ----------
where node >nul 2>&1
if errorlevel 1 (
  echo  ERROR: Node.js is not installed on this PC.
  echo.
  echo  Please download and install Node.js from: https://nodejs.org
  echo  Then run this file again.
  echo.
  pause
  exit /b 1
)
echo  Node.js found.

:: ---------- Setup install folder ----------
set "INSTALL_DIR=%LOCALAPPDATA%\\${installDirName}"
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
cd /d "%INSTALL_DIR%"

:: ---------- STEP 1: Download latest agent engine from cloud ----------
echo.
echo [1/3] Downloading latest agent from Cipra Cloud...
node -e "const https = require('https'), http = require('http'), fs = require('fs'); const url = '${scriptDownloadUrl}'; function fetchScript(targetUrl) { const client = targetUrl.startsWith('https') ? https : http; client.get(targetUrl, (res) => { if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) { fetchScript(res.headers.location); } else if (res.statusCode === 200) { const file = fs.createWriteStream('${agentFileName}'); res.pipe(file); file.on('finish', () => file.close()); } }); } fetchScript(url);" >nul 2>&1

timeout /t 1 /nobreak >nul
if not exist "${agentFileName}" (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls11 -bor [System.Net.SecurityProtocolType]::Tls; try { (New-Object System.Net.WebClient).DownloadFile('${scriptDownloadUrl}', '${agentFileName}'); Write-Host 'OK' } catch { try { Invoke-WebRequest -Uri '${scriptDownloadUrl}' -OutFile '${agentFileName}' -UseBasicParsing; Write-Host 'OK' } catch { Write-Host ('FAIL: ' + $_.Exception.Message) } }"
)

if not exist "${agentFileName}" (
  echo.
  echo  ERROR: Could not download agent from Cipra Cloud.
  echo  Check your internet connection and try again.
  echo.
  pause
  exit /b 1
)
echo  Agent downloaded successfully.

:: ---------- STEP 2: Install Node.js dependencies ----------
if not exist "%INSTALL_DIR%\\node_modules\\whatsapp-web.js" (
  echo.
  echo [2/3] First-time setup: Installing WhatsApp engine...
  echo  This will take 1-3 minutes. Please wait and do NOT close this window.
  echo.
  call npm install --prefix "%INSTALL_DIR%" whatsapp-web.js puppeteer socket.io-client qrcode --no-audit --no-fund --loglevel=error
  if errorlevel 1 (
    echo.
    echo  ERROR: Failed to install WhatsApp engine modules.
    echo  Please check your internet connection and try again.
    echo.
    pause
    exit /b 1
  )
  echo  WhatsApp engine installed successfully!
) else (
  echo [2/3] WhatsApp engine verified.
)

:: ---------- Stop any previous running instance ----------
echo  Stopping any old agent instance...
wmic process where "name='node.exe' and commandline like '%%${agentFileName}%%'" call terminate >nul 2>&1
timeout /t 2 /nobreak >nul

:: ---------- Create silent background launcher (with correct module path) ----------
(
  echo Set WshShell = CreateObject("WScript.Shell"^)
  echo WshShell.CurrentDirectory = "%INSTALL_DIR%"
  echo WshShell.Environment("Process"^)("NODE_PATH"^) = "%INSTALL_DIR%\\node_modules"
  echo WshShell.Run "node ${agentFileName}", 0, false
  echo Set WshShell = Nothing
) > "run-agent.vbs"

:: ---------- Register in Windows Startup for auto-launch on PC boot ----------
set "STARTUP=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"
if exist "%STARTUP%" (
  copy /y "run-agent.vbs" "%STARTUP%\\CipraWA_${garageSlug}.vbs" >nul
  echo  Auto-start on Windows boot: Enabled.
)

:: ---------- STEP 3: Launch agent silently ----------
echo.
echo [3/3] Launching WhatsApp Agent silently...
cscript //nologo "run-agent.vbs"
echo.
echo  Agent is running in the background.
echo  You can close this window safely.
echo.
timeout /t 4 >nul
`;

    res.setHeader('Content-Type', 'application/x-msdos-program');
    res.setHeader('Content-Disposition', `attachment; filename="${batFileName}"`);
    res.send(batContent);
  } catch (err) {
    console.error('Error in downloadBridgeScript:', err);
    res.status(500).json({ success: false, message: 'Server Error generating installer script.' });
  }
};

// @desc    Verify Meta Webhook Challenge (GET)
exports.verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.META_VERIFY_TOKEN || 'cipra_whatsapp_verify_token_2026';

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('[Meta Webhook] Challenge verified successfully!');
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
};

// @desc    Handle incoming Meta Webhook Events (POST)
exports.handleWebhook = (req, res) => {
  res.status(200).send('EVENT_RECEIVED');
};
