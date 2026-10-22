const express = require('express');
const router = express.Router();
const { getSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier } = require('../controllers/supplierController');
const { authorizeGarage } = require('../middleware/authMiddleware');

router.get('/', authorizeGarage, getSuppliers);
router.get('/:id', authorizeGarage, getSupplierById);
router.post('/', authorizeGarage, createSupplier);
router.put('/:id', authorizeGarage, updateSupplier);
router.delete('/:id', authorizeGarage, deleteSupplier);

module.exports = router;