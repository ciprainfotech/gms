const express = require('express');
const { getMakes, getModelsByMake } = require('../controllers/makeModelController');
const { authorizeGarage } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/makes', authorizeGarage, getMakes);
router.get('/models/:makeId', authorizeGarage, getModelsByMake);

module.exports = router;