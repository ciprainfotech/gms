const express = require('express');
const router = express.Router();
const { authorizeGarage } = require('../middleware/authMiddleware');
const whatsappController = require('../controllers/whatsappController');

// Public Webhook endpoints for Meta Verification & Events (No auth required)
router.get('/webhook', whatsappController.verifyWebhook);
router.post('/webhook', whatsappController.handleWebhook);

// Protected routes
router.use(authorizeGarage);

router.get('/balance', whatsappController.getWhatsAppBalance);
router.get('/logs', whatsappController.getWhatsAppLogs);
router.get('/status', whatsappController.getWhatsAppStatus);
router.get('/qr', whatsappController.getWhatsAppQR);
router.post('/connect', whatsappController.connectWhatsApp);
router.post('/disconnect', whatsappController.disconnectWhatsApp);

router.post('/send-invoice', whatsappController.sendInvoiceWhatsApp);
router.post('/send-jobsheet', whatsappController.sendJobSheetWhatsApp);
router.post('/send-reminder', whatsappController.sendReminderWhatsApp);
router.post('/send-marketing', whatsappController.sendMarketingWhatsApp);
router.post('/send-ledger', whatsappController.sendLedgerWhatsApp);

module.exports = router;
