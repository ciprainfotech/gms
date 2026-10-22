const express = require('express');
const router = express.Router();
const { getPurchaseBills, getPurchaseBillById, getPurchaseSummary, createPurchaseBill, updatePurchaseBill, deletePurchaseBill } = require('../controllers/purchaseBillController');
const { authorizeGarage } = require('../middleware/authMiddleware');

router.get('/summary', authorizeGarage, getPurchaseSummary);
router.get('/', authorizeGarage, getPurchaseBills);
router.get('/:id', authorizeGarage, getPurchaseBillById);
router.post('/', authorizeGarage, createPurchaseBill);
router.put('/:id', authorizeGarage, updatePurchaseBill);
router.delete('/:id', authorizeGarage, deletePurchaseBill);

module.exports = router;