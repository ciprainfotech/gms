const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

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
            'SELECT id, name, email, password_hash, is_super_admin FROM users WHERE email = $1 AND is_deleted = FALSE',
            [email.toLowerCase().trim()]
        );

        if (userRows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        
        const user = userRows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const payload = { id: user.id };
        const jwtSecret = process.env.JWT_SECRET || 'CGMS_CIPRA_JWT';
        const token = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: true, // Required for cross-scheme HTTPS frontend to HTTP backend
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            sameSite: 'none',
        });

        const { rows: garageRows } = await db.query(
            `SELECT g.id, g.name, g.logo_url, g.is_active, gu.role 
             FROM garages g
             JOIN garage_users gu ON g.id = gu.garage_id
             WHERE gu.user_id = $1`,
            [user.id]
        );

        let activeGarage = null;
        if (garageRows.length > 0) {
            const userGarageIds = garageRows.map(g => Number(g.id));
            let activeId = req.cookies.activeGarageId ? Number(req.cookies.activeGarageId) : null;
            if (!activeId || !userGarageIds.includes(activeId)) {
                activeId = userGarageIds[0];
            }

            const activeRes = await db.query(
                `SELECT id, name, phone, email, address, logo_url, gst_number, bank_name, bank_account_no, bank_ifsc,
                        terms_and_conditions, invoice_prefix, invoice_next_num, jobsheet_prefix, jobsheet_next_num, 
                        whatsapp_credit_balance, whatsapp_status, is_active, feature_stock, feature_purchase, feature_analytics, 
                        feature_reminders, feature_tasks, feature_whatsapp, feature_whatsapp_utility, feature_whatsapp_marketing, feature_payroll 
                 FROM garages WHERE id = $1`,
                [activeId]
            );
            if (activeRes.rows.length > 0) {
                activeGarage = activeRes.rows[0];
            } else {
                activeGarage = garageRows[0];
            }
            
            // Check if garage is suspended for non-superadmin users
            if (!user.is_super_admin && activeGarage && activeGarage.is_active === false) {
                res.clearCookie('token');
                res.clearCookie('activeGarageId');
                return res.status(403).json({
                    success: false,
                    code: 'GARAGE_SUSPENDED',
                    message: `Account Suspended: License for "${activeGarage.name}" has been suspended by Super Admin. You cannot log in at this time. Please contact Cipra Infotech support.`
                });
            }

            res.cookie('activeGarageId', activeGarage.id, {
                httpOnly: true,
                secure: true,
                maxAge: 24 * 60 * 60 * 1000,
                sameSite: 'none',
            });
        }

        res.status(200).json({
            success: true,
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                is_super_admin: user.is_super_admin 
            },
            garages: garageRows,
            activeGarage
        });

    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ success: false, message: err.message || 'Server Error' });
    }
};

// @desc    Get current logged in user and active garage details
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    const userId = req.user.id;

    try {
        const { rows: userRows } = await db.query(
            'SELECT id, name, email, phone, is_super_admin FROM users WHERE id = $1 AND is_deleted = FALSE',
            [userId]
        );

        if (userRows.length === 0) {
            return res.status(401).json({ success: false, message: 'User session invalid or deleted' });
        }

        const user = userRows[0];

        const { rows: garageRows } = await db.query(
            `SELECT g.id, g.name, g.logo_url, g.is_active, gu.role 
             FROM garages g
             JOIN garage_users gu ON g.id = gu.garage_id
             WHERE gu.user_id = $1`,
            [userId]
        );

        let activeGarage = null;
        if (garageRows.length > 0) {
            const userGarageIds = garageRows.map(g => Number(g.id));
            let activeGarageId = req.cookies.activeGarageId ? Number(req.cookies.activeGarageId) : null;
            if (!activeGarageId || !userGarageIds.includes(activeGarageId)) {
                activeGarageId = userGarageIds[0];
            }

            const activeRes = await db.query(
                `SELECT id, name, phone, email, address, logo_url, gst_number, bank_name, bank_account_no, bank_ifsc,
                        terms_and_conditions, invoice_prefix, invoice_next_num, jobsheet_prefix, jobsheet_next_num, 
                        whatsapp_credit_balance, whatsapp_status, is_active, feature_stock, feature_purchase, feature_analytics, 
                        feature_reminders, feature_tasks, feature_whatsapp, feature_whatsapp_utility, feature_whatsapp_marketing, feature_payroll 
                 FROM garages WHERE id = $1`,
                [activeGarageId]
            );
            if (activeRes.rows.length > 0) {
                activeGarage = activeRes.rows[0];
            } else {
                activeGarage = garageRows[0];
            }

            res.cookie('activeGarageId', activeGarage.id, {
                httpOnly: true,
                secure: true,
                maxAge: 24 * 60 * 60 * 1000,
                sameSite: 'none',
            });
        }

        res.status(200).json({
            success: true,
            user,
            garages: garageRows,
            activeGarage
        });
    } catch (err) {
        console.error("Error fetching user session:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Log the user out
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
    });
    res.clearCookie('activeGarageId', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
    });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// @desc    Select an active garage and set it in a cookie
// @route   POST /api/auth/select-garage
// @access  Private
exports.selectGarage = async (req, res) => {
    const { garageId } = req.body;
    const userId = req.user.id;

    if (!garageId) {
        return res.status(400).json({ success: false, message: 'Garage ID is required.' });
    }

    try {
        const accessResult = await db.query(
            'SELECT garage_id FROM garage_users WHERE user_id = $1 AND garage_id = $2',
            [userId, garageId]
        );

        if (accessResult.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to access this garage.' });
        }
        
        res.cookie('activeGarageId', garageId, {
            httpOnly: true,
            secure: true,
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'none',
        });

        const activeRes = await db.query(
            `SELECT id, name, phone, email, address, logo_url, gst_number, bank_name, bank_account_no, bank_ifsc,
                    terms_and_conditions, invoice_prefix, invoice_next_num, jobsheet_prefix, jobsheet_next_num, 
                    whatsapp_credit_balance, whatsapp_status, is_active, feature_stock, feature_purchase, feature_analytics, 
                    feature_reminders, feature_tasks, feature_whatsapp, feature_whatsapp_utility, feature_whatsapp_marketing, feature_payroll 
             FROM garages WHERE id = $1`,
            [garageId]
        );

        res.status(200).json({ 
            success: true, 
            message: `Garage ${garageId} selected.`,
            activeGarage: activeRes.rows[0] || null
        });

    } catch (err) {
        console.error("Error selecting garage:", err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};