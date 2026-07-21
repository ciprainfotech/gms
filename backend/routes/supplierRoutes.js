const express = require('express');
const router = express.Router();
const { getSuppliers, createSupplier } = require('../controllers/supplierController');
const { authorizeGarage } = require('../middleware/authMiddleware'); // Use your actual middleware name

router.get('/', authorizeGarage, getSuppliers);
router.post('/', authorizeGarage, createSupplier);

module.exports = router;