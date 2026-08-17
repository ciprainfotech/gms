const express = require('express');
const router = express.Router();
const { authorizeGarage } = require('../middleware/authMiddleware');
const whatsappController = require('../controllers/whatsappController');

// Public Webhook endpoints for Meta Verification & Events (No auth required)
router.get('/webhook', whatsappController.verifyWebhook);
router.post('/webhook', whatsappController.handleWebhook);

// Public: agent script download (JWT-verified inside controller — no user cookie needed by .bat file)
router.get('/bridge/script/:garageId', whatsappController.getAgentScript);
router.get('/bridge/download', whatsappController.downloadBridgeScript);

// Protected routes
router.use(authorizeGarage);

// Generate a signed short-lived download token (called by frontend Settings page)
router.get('/bridge/token', whatsappController.generateAgentToken);

router.get('/balance', whatsappController.getWhatsAppBalance);
router.get('/logs', whatsappController.getWhatsAppLogs);
router.get('/status', whatsappController.getWhatsAppStatus);
router.get('/qr', whatsappController.getWhatsAppQR);
router.post('/connect', whatsappController.connectWhatsApp);
router.post('/disconnect', whatsappController.disconnectWhatsApp);

// Bridge routes for Local Workshop Client
router.get('/bridge/pending', whatsappController.getPendingBridgeMessages);
router.post('/bridge/ack', whatsappController.acknowledgeBridgeMessage);

router.post('/send-invoice', whatsappController.sendInvoiceWhatsApp);
router.post('/send-jobsheet', whatsappController.sendJobSheetWhatsApp);
router.post('/send-reminder', whatsappController.sendReminderWhatsApp);
router.post('/send-marketing', whatsappController.sendMarketingWhatsApp);
router.post('/send-ledger', whatsappController.sendLedgerWhatsApp);

module.exports = router;
