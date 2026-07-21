const express = require('express');
const router = express.Router();
// Import BOTH the get and create functions now
const { getPurchaseBills, createPurchaseBill } = require('../controllers/purchaseBillController');
const { authorizeGarage } = require('../middleware/authMiddleware');

// Add the missing GET route!
router.get('/', authorizeGarage, getPurchaseBills);

// Keep the POST route we had before
router.post('/', authorizeGarage, createPurchaseBill);

module.exports = router;