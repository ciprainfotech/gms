/**
 * WhatsApp Helper Utilities for GMS Platform
 * Handles 1-click professional WhatsApp message formatting & redirection.
 */

// Helper to format phone number to international format without spaces/dashes
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  // Default to India country code 91 if 10 digits
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  return cleaned;
};

// Open WhatsApp Web or App
export const openWhatsApp = (phone, message) => {
  const formattedPhone = formatPhoneNumber(phone);
  const encodedText = encodeURIComponent(message);
  const url = formattedPhone 
    ? `https://wa.me/${formattedPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;
  
  window.open(url, '_blank');
};

// Generate & Send Invoice WhatsApp Message
export const sendInvoiceWhatsApp = (invoice, garage) => {
  const garageName = garage?.name || 'Our Garage';
  const customerName = invoice.customer_name || 'Valued Customer';
  const carNumber = invoice.car_number || 'your vehicle';
  const invoiceNum = invoice.invoice_number || `#${invoice.id}`;
  const totalAmount = parseFloat(invoice.grand_total || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
  const status = invoice.status || 'Generated';
  const date = invoice.date_issued ? new Date(invoice.date_issued).toLocaleDateString() : 'Today';

  const message = `Hello *${customerName}* 👋,

Thank you for choosing *${garageName}*!

📄 *Invoice Details:*
• Invoice No: *${invoiceNum}*
• Vehicle No: *${carNumber}*
• Date: *${date}*
• Total Amount: *${totalAmount}*
• Payment Status: *${status}*

If you have any questions regarding your bill, feel free to reply to this message.

Best regards,
*${garageName}*
📞 ${garage?.phone || ''}`;

  openWhatsApp(invoice.customer_phone, message);
};

// Generate & Send Job Sheet Status WhatsApp Message
export const sendJobSheetWhatsApp = (jobsheet, garage) => {
  const garageName = garage?.name || 'Our Garage';
  const customerName = jobsheet.customer_name || 'Valued Customer';
  const carNumber = jobsheet.car_number || 'your vehicle';
  const jobSheetNum = jobsheet.job_sheet_number || `#${jobsheet.id}`;
  const status = jobsheet.status || 'In Progress';

  const message = `Hello *${customerName}* 👋,

Update on your vehicle repair at *${garageName}*:

📋 *Job Sheet Details:*
• Job Sheet No: *${jobSheetNum}*
• Vehicle No: *${carNumber}*
• Status: *${status.toUpperCase()}*

${status.toLowerCase().includes('complete') || status.toLowerCase().includes('ready') 
    ? '✅ *Your vehicle is ready for pickup!* Please collect it at your convenience.' 
    : '🛠️ Our technicians are currently working on your vehicle.'}

Best regards,
*${garageName}*
📞 ${garage?.phone || ''}`;

  openWhatsApp(jobsheet.customer_phone, message);
};

// Generate & Send Service Reminder WhatsApp Message
export const sendReminderWhatsApp = (reminder, garage) => {
  const garageName = garage?.name || 'Our Garage';
  const customerName = reminder.customer_name || 'Valued Customer';
  const carNumber = reminder.car_number || 'your vehicle';
  const serviceDueDate = reminder.due_date ? new Date(reminder.due_date).toLocaleDateString() : 'soon';

  const message = `Hello *${customerName}* 👋,

This is a friendly reminder from *${garageName}*!

🚗 *Service Due Reminder:*
• Vehicle No: *${carNumber}*
• Due Date: *${serviceDueDate}*

Regular servicing ensures optimal performance and safety for your car. 
Click or reply to schedule an appointment today!

Best regards,
*${garageName}*
📞 ${garage?.phone || ''}`;

  openWhatsApp(reminder.customer_phone, message);
};
