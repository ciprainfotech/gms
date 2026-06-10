const express = require('express');
const { getKanbanData } = require('../controllers/dashboardController'); // Use the real controller
const { authorizeGarage } = require('../middleware/authMiddleware'); // Add protection back

const router = express.Router();

// This is the real, final route definition
router.get('/kanban-data', authorizeGarage, getKanbanData);

module.exports = router;