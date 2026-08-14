const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authorizeGarage } = require('../middleware/authMiddleware');

router.get('/', authorizeGarage, analyticsController.getAnalyticsData);

module.exports = router;
