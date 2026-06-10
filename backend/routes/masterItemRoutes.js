// File: backend/routes/masterItemRoutes.js

const express = require('express');
const router = express.Router();
const { getMasterItems } = require('../controllers/masterItemController');

// IMPORTANT: Import your security middleware here.
// You must replace the path and function name with your actual middleware.
const { authorizeGarage } = require('../middleware/authMiddleware'); 

// This defines the API endpoint: GET /api/master-items
// 1. It first runs your `protectAndSetGarage` middleware.
// 2. If the middleware succeeds (and adds `req.garageId`), it then calls `getMasterItems`.
router.get('/', authorizeGarage, getMasterItems);

module.exports = router;