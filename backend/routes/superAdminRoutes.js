const express = require('express');
const router = express.Router();
const { requireSuperAdmin } = require('../middleware/authMiddleware');
const superAdminController = require('../controllers/superAdminController');

// All routes here are protected by Super Admin Guard
router.use(requireSuperAdmin);

router.get('/stats', superAdminController.getPlatformStats);
router.get('/garages', superAdminController.getAllGarages);
router.post('/onboard-garage', superAdminController.onboardGarage);
router.put('/garages/:garageId/subscription', superAdminController.updateGarageSubscription);
router.post('/garages/:garageId/topup-whatsapp', superAdminController.topUpWhatsAppCredits);

router.get('/plans', superAdminController.getAllPlans);
router.post('/plans', superAdminController.createPlan);

router.put('/profile', superAdminController.updateSuperAdminProfile);
router.put('/password', superAdminController.updateSuperAdminPassword);

module.exports = router;
