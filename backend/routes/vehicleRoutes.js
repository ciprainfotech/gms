// File: routes/vehicleRoutes.js

const express = require('express');
const router = express.Router();

// Import the controller functions that are now correctly exported
const { 
    checkVehicleByNumber, 
    getVehicleHistory, 
    createVehicle,
    getVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle,
    searchVehicles
} = require('../controllers/vehicleController');

// Import the correct middleware. All these routes deal with garage data.
const { authorizeGarage } = require('../middleware/authMiddleware');

// This is line 7, the line that was crashing. It will now work.
router.post('/check', authorizeGarage, checkVehicleByNumber);

router.get('/history/:carNumber', authorizeGarage, getVehicleHistory);
router.get('/', authorizeGarage, getVehicles);
router.get('/search', authorizeGarage, searchVehicles);

// This route was likely the one causing the 'undefined' error
router.post('/', authorizeGarage, createVehicle);
// Add these below your other routes in vehicleRoutes.js
router.get('/:id',  authorizeGarage, getVehicleById);
router.put('/:id',  authorizeGarage, updateVehicle);
router.delete('/:id',  authorizeGarage, deleteVehicle);

module.exports = router;