// File: routes/authRoutes.js

const express = require('express');
const router = express.Router();



// Import the controller functions that are now correctly defined in the controller file
const { login, getMe, logout, selectGarage } = require('../controllers/authController');
console.log()

// Import the middleware we will create in the next step
const { authenticate } = require('../middleware/authMiddleware');

// This route now works because the 'login' function is defined
router.post('/login', login);

// This route uses the simple 'authenticate' middleware
router.get('/me', authenticate, getMe);

// This route logs the user out
router.post('/logout', logout);

router.post('/select-garage', authenticate, selectGarage);

module.exports = router;