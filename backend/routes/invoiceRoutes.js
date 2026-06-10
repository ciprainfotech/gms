const express = require('express');
const router = express.Router();
const { authorizeGarage } = require('../middleware/authMiddleware');
const {
    getReadyJobSheets, 
    createInvoice, 
    getInvoiceById, 
    getAllInvoices,
    deleteInvoice,
    bulkDeleteInvoices
} = require('../controllers/invoiceController')

// --- STATIC ROUTES (Must be at the top) ---
router.get('/ready-for-invoicing', authorizeGarage, getReadyJobSheets);
router.post('/bulk-delete', authorizeGarage, bulkDeleteInvoices);

// --- BASE ROUTES ---
router.post('/', authorizeGarage, createInvoice);
router.get('/', authorizeGarage, getAllInvoices);

// --- DYNAMIC ROUTES (Must be at the bottom) ---
router.get('/:invoiceId', authorizeGarage, getInvoiceById);
router.delete('/:id', authorizeGarage, deleteInvoice);

module.exports = router;