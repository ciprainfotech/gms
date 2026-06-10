const db = require('../config/db');

// @desc    Get all vehicle makes
// @route   GET /api/meta/makes
// @access  Private
exports.getMakes = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM makes ORDER BY name ASC');
        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        console.error('Error fetching makes:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all models for a specific make
// @route   GET /api/meta/models/:makeId
// @access  Private
exports.getModelsByMake = async (req, res) => {
    const { makeId } = req.params;
    try {
        const { rows } = await db.query('SELECT * FROM models WHERE make_id = $1 ORDER BY name ASC', [makeId]);
        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        console.error('Error fetching models for make:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};