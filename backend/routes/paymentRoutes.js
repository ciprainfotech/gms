const express = require('express');
const router = express.Router();
const { authorizeGarage } = require('../middleware/authMiddleware');
const { 
    recordPayment, 
    updatePayment, 
    deletePayment 
} = require('../controllers/paymentController');

// Route to record a new payment for a specific invoice
router.post('/:invoiceId', authorizeGarage, recordPayment);

// Route to update an existing payment
router.put('/:invoiceId/payments/:paymentId', authorizeGarage, updatePayment);

// Route to delete a payment
router.delete('/:invoiceId/payments/:paymentId', authorizeGarage, deletePayment);

module.exports = router;