const express = require('express');
const router = express.Router();
const { getSupplierPayments, createSupplierPayment, deleteSupplierPayment } = require('../controllers/supplierPaymentController');
const { authorizeGarage } = require('../middleware/authMiddleware');

router.get('/', authorizeGarage, getSupplierPayments);
router.post('/', authorizeGarage, createSupplierPayment);
router.delete('/:id', authorizeGarage, deleteSupplierPayment);

module.exports = router;
