const express = require('express');
const router = express.Router();
const { getMasterItems, createMasterItem, updateMasterItem, deleteMasterItem } = require('../controllers/masterItemController');
const { authorizeGarage } = require('../middleware/authMiddleware'); 

router.get('/', authorizeGarage, getMasterItems);
router.post('/', authorizeGarage, createMasterItem);
router.put('/:id', authorizeGarage, updateMasterItem);
router.delete('/:id', authorizeGarage, deleteMasterItem);

module.exports = router;