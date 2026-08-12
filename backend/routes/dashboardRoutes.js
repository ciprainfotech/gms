const express = require('express');
const { getKanbanData, getRemindersData } = require('../controllers/dashboardController');
const { authorizeGarage } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/kanban-data', authorizeGarage, getKanbanData);
router.get('/reminders', authorizeGarage, getRemindersData);

module.exports = router;