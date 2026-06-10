const express = require('express');
const { createCustomer, getCustomers, updateCustomer, deleteCustomer, getCustomerById, checkCustomerByPhone } = require('../controllers/customerController');
const { authorizeGarage } = require('../middleware/authMiddleware');


const router = express.Router();

router.route('/').post(authorizeGarage, createCustomer);

router.get('/', authorizeGarage, getCustomers);
router.put('/:id', authorizeGarage, updateCustomer);
router.delete('/:id', authorizeGarage, deleteCustomer);
router.get('/:id',  authorizeGarage, getCustomerById);
router.get('/check-phone/:phone', authorizeGarage, checkCustomerByPhone);

module.exports = router;