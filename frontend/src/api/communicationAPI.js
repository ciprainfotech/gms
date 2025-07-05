// This file simulates calls to a backend or a third-party service like Twilio.
// In a real app, this would make `fetch` or `axios` requests.

import { findInvoiceById, findCustomerById, findVehicleById, updateJobSheet } from '../data/staticData';

// --- SIMULATED PAYMENT REMINDER ---
export const sendPaymentReminder = (invoiceId) => {
    return new Promise((resolve, reject) => {
        console.log(`[API SIM] Initiating payment reminder for Invoice ID: ${invoiceId}`);
        const invoice = findInvoiceById(invoiceId);
        const customer = findCustomerById(invoice.customerId);

        if (!invoice || !customer) {
            return reject(new Error("Invoice or Customer not found."));
        }

        const amountDue = invoice.grandTotal - (invoice.paymentRecords?.reduce((sum, p) => sum + p.amountPaid, 0) || 0);

        // This is the message you would send via WhatsApp/SMS
        const message = `Dear ${customer.name}, this is a friendly reminder from SAMAN MOTORS that your invoice #${invoice.invoiceNumber} for ₹${amountDue.toFixed(2)} is due on ${invoice.dueDate}. Thank you.`;

        console.log(`[API SIM] Prepared Message: "${message}"`);
        console.log(`[API SIM] Pretending to send to phone: ${customer.phone}`);

        // Simulate network delay
        setTimeout(() => {
            console.log(`[API SIM] Successfully sent payment reminder for Invoice ID: ${invoiceId}`);
            resolve({ success: true, message: `Reminder sent to ${customer.name} for invoice #${invoice.invoiceNumber}.` });
        }, 1500); // 1.5 second delay
    });
};


// --- SIMULATED SERVICE REMINDER ---
export const sendServiceReminder = (jobSheetId) => {
     return new Promise((resolve, reject) => {
        console.log(`[API SIM] Initiating service reminder for Job Sheet ID: ${jobSheetId}`);
        const jobSheet = updateJobSheet({ id: jobSheetId, serviceReminderSent: true }); // Mark as sent immediately
        const customer = findCustomerById(jobSheet.customerId);
        const vehicle = findVehicleById(jobSheet.vehicleId);

        if (!jobSheet || !customer || !vehicle) {
            return reject(new Error("Job Sheet, Customer, or Vehicle not found."));
        }

        const message = `Dear ${customer.name}, it's time for the next service for your ${vehicle.make} ${vehicle.model} (${vehicle.carNumber}). Please contact SAMAN MOTORS to book an appointment. Thank you.`;

        console.log(`[API SIM] Prepared Message: "${message}"`);
        console.log(`[API SIM] Pretending to send to phone: ${customer.phone}`);
        
        setTimeout(() => {
            console.log(`[API SIM] Successfully sent service reminder for Job Sheet ID: ${jobSheetId}`);
            resolve({ success: true, message: `Service reminder sent to ${customer.name} for vehicle ${vehicle.carNumber}.` });
        }, 1500);
    });
};