// File: controllers/authController.js

const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // Using 'bcrypt' as you specified

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide an email and password' });
    }

    try {
        const { rows: userRows } = await db.query(
            'SELECT id, name, email, password_hash FROM users WHERE email = $1 AND is_deleted = FALSE',
            [email.toLowerCase()]
        );

        if (userRows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        const user = userRows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const payload = { id: user.id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            sameSite: 'strict',
        });

        const { rows: garageRows } = await db.query(
            `SELECT g.id, g.name, gu.role 
             FROM garages g
             JOIN garage_users gu ON g.id = gu.garage_id
             WHERE gu.user_id = $1 AND g.is_active = TRUE`,
            [user.id]
        );

        res.status(200).json({
            success: true,
            user: { id: user.id, name: user.name, email: user.email },
            garages: garageRows
        });

    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get current logged in user and their associated garages
// @route   GET /api/auth/me
// @access  Private (Uses 'authenticate' middleware)
exports.getMe = async (req, res) => {
    const userId = req.user.id;

    try {
        const { rows: garageRows } = await db.query(
            `SELECT g.id, g.name, gu.role 
             FROM garages g
             JOIN garage_users gu ON g.id = gu.garage_id
             WHERE gu.user_id = $1 AND g.is_active = TRUE`,
            [userId]
        );

        res.status(200).json({
            success: true,
            user: req.user,
            garages: garageRows
        });
    } catch (err) {
        console.error("Error fetching user's garages:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Log the user out
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
    res.clearcookie;
    res.status(200).json({ success: true, message: 'User logged out successfully' });
};

// Add this new function to the bottom of your controllers/authController.js file

// @desc    Select an active garage and set it in a cookie
// @route   POST /api/auth/select-garage
// @access  Private (Uses 'authenticate' middleware)
exports.selectGarage = async (req, res) => {
    const { garageId } = req.body;
    const userId = req.user.id;

    if (!garageId) {
        return res.status(400).json({ success: false, message: 'Garage ID is required.' });
    }

    try {
        // CRITICAL SECURITY CHECK: Verify the user is actually a member of the garage they are trying to select.
        const accessResult = await db.query(
            'SELECT garage_id FROM garage_users WHERE user_id = $1 AND garage_id = $2',
            [userId, garageId]
        );

        if (accessResult.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to access this garage.' });
        }
        
        // Success! Set the cookie.
        res.cookie('activeGarageId', garageId, {
            httpOnly: true, // Recommended for security
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days, same as auth token
            sameSite: 'strict',
        });

        res.status(200).json({ success: true, message: `Garage ${garageId} selected.` });

    } catch (err) {
        console.error("Error selecting garage:", err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};  