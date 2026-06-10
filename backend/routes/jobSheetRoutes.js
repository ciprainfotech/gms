// File: routes/jobSheetRoutes.js

const express = require('express');

const { 
    createCheckIn,
    startRepair, 
    updateJobSheetStatus, 
    getActiveJobSheets,
    getJobSheetDetails,
    updateJobSheetDetails,
    deleteJobSheet,
    getDashboardData,
    getHistoricalJobSheets,
    bulkDeleteJobSheets
} = require('../controllers/jobSheetController');

const { authorizeGarage } = require('../middleware/authMiddleware');

const router = express.Router();

// =================================================================
// 1. STATIC ROUTES 
// (These must come FIRST so they don't get swallowed by wildcards)
// =================================================================

router.post('/check-in', authorizeGarage, createCheckIn);
router.get('/active', authorizeGarage, getActiveJobSheets);
router.get('/historical', authorizeGarage, getHistoricalJobSheets);

// 👉 THE FIX: Changed to POST and safely placed at the top!
router.post('/bulk-delete', authorizeGarage, bulkDeleteJobSheets);


// =================================================================
// 2. DYNAMIC ROUTES 
// (These have wildcards like :id, so they must go at the BOTTOM)
// =================================================================

router.put('/:id/status', authorizeGarage, updateJobSheetStatus);
router.get('/:id/details', authorizeGarage, getJobSheetDetails);
router.put('/:id/details', authorizeGarage, updateJobSheetDetails);

// 👉 THE FIX: Unified to :id to match your controller, safely at the bottom
router.delete('/:id', authorizeGarage, deleteJobSheet);


module.exports = router;