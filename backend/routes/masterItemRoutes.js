const express = require('express');
const router = express.Router();
const { getMasterItems, createMasterItem, updateMasterItem, deleteMasterItem, quickRestockItem, adjustStock, getStockAdjustments } = require('../controllers/masterItemController');
const { authorizeGarage } = require('../middleware/authMiddleware'); 

router.get('/adjustments', authorizeGarage, getStockAdjustments);
router.get('/', authorizeGarage, getMasterItems);
router.post('/', authorizeGarage, createMasterItem);
router.put('/:id', authorizeGarage, updateMasterItem);
router.patch('/:id/restock', authorizeGarage, quickRestockItem);
router.post('/:id/restock', authorizeGarage, quickRestockItem);
router.patch('/:id/adjust', authorizeGarage, adjustStock);
router.delete('/:id', authorizeGarage, deleteMasterItem);

module.exports = router;