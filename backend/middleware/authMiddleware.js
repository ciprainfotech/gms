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

// Super Admin Access Guard
exports.requireSuperAdmin = [
    exports.authenticate,
    async (req, res, next) => {
        try {
            const { rows } = await db.query('SELECT is_super_admin FROM users WHERE id = $1', [req.user.id]);
            if (rows.length === 0 || !rows[0].is_super_admin) {
                return res.status(403).json({ success: false, message: 'Access denied: Super Admin credentials required.' });
            }
            req.user.isSuperAdmin = true;
            next();
        } catch (err) {
            console.error("SuperAdmin Auth Error:", err);
            return res.status(500).json({ success: false, message: 'Server error verifying admin credentials.' });
        }
    }
];

// Active License Guard (Blocks data mutations if garage account is suspended)
exports.requireActiveLicense = [
    ...exports.authorizeGarage,
    async (req, res, next) => {
        try {
            const { rows } = await db.query('SELECT is_active, subscription_status FROM garages WHERE id = $1', [req.garageId]);
            if (rows.length === 0 || rows[0].is_active === false || rows[0].subscription_status === 'suspended') {
                return res.status(403).json({ 
                    success: false, 
                    code: 'ACCOUNT_SUSPENDED',
                    message: 'Account Suspended: Read-Only mode enabled. You can view past histories, but creation of new cars, job sheets, or invoices is locked. Contact Cipra Infotech support.' 
                });
            }
            next();
        } catch (err) {
            console.error("Active License Check Error:", err);
            return res.status(500).json({ success: false, message: 'Server error checking account license status.' });
        }
    }
];

// Modular Feature Guard
exports.requireFeature = (featureColumn) => [
    ...exports.authorizeGarage,
    async (req, res, next) => {
        try {
            const { rows } = await db.query(`SELECT ${featureColumn} FROM garages WHERE id = $1`, [req.garageId]);
            if (rows.length === 0 || rows[0][featureColumn] === false) {
                return res.status(403).json({ 
                    success: false, 
                    code: 'FEATURE_DISABLED',
                    message: `Module Locked: The requested feature is disabled for your garage account by Cipra Infotech Admin.` 
                });
            }
            next();
        } catch (err) {
            console.error("Feature Check Error:", err);
            return res.status(500).json({ success: false, message: 'Server error checking module permissions.' });
        }
    }
];