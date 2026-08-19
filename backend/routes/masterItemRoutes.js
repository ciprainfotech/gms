const express = require('express');
const router = express.Router();
const { getMasterItems, createMasterItem, updateMasterItem, deleteMasterItem, quickRestockItem } = require('../controllers/masterItemController');
const { authorizeGarage } = require('../middleware/authMiddleware'); 

router.get('/', authorizeGarage, getMasterItems);
router.post('/', authorizeGarage, createMasterItem);
router.put('/:id', authorizeGarage, updateMasterItem);
router.patch('/:id/restock', authorizeGarage, quickRestockItem);
router.post('/:id/restock', authorizeGarage, quickRestockItem);
router.delete('/:id', authorizeGarage, deleteMasterItem);

module.exports = router;