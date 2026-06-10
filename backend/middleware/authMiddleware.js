// File: middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const db = require('../config/db');

// This function remains the same. It's perfect.
exports.authenticate = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token || token === 'none') {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await db.query('SELECT id, name, email FROM users WHERE id = $1 AND is_deleted = FALSE', [decoded.id]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found or has been deactivated' });
    }
    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized, token is invalid or expired' });
  }
};

// --- THIS IS THE UPDATED PART ---
exports.authorizeGarage = [
    exports.authenticate, 
    async (req, res, next) => {
        // THE CHANGE IS HERE: Read from cookies instead of headers.
        const garageId = req.cookies.activeGarageId;

        if (!garageId) {
            // The error now means the user hasn't selected a garage yet.
            return res.status(400).json({ success: false, message: 'Bad Request: No active garage selected. Please select a garage first.' });
        }

        const userId = req.user.id;
        try {
            const accessResult = await db.query(
                'SELECT role FROM garage_users WHERE user_id = $1 AND garage_id = $2',
                [userId, garageId]
            );

            if (accessResult.rows.length === 0) {
                return res.status(403).json({ success: false, message: 'Forbidden: You do not have access to the selected garage.' });
            }

            req.garageId = parseInt(garageId, 10);
            req.user.role = accessResult.rows[0].role;
            next();
        } catch (err) {
            console.error("Garage Authorization DB Error:", err);
            return res.status(500).json({ success: false, message: 'Server error while verifying garage access.' });
        }
    }
];