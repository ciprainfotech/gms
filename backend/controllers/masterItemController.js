// File: backend/controllers/masterItemController.js

const db = require('../config/db'); // Adjust path to your db config if needed

/**
 * @desc    Get all master items (spares and services) for the logged-in user's garage
 * @route   GET /api/master-items
 * @access  Private
 */
const getMasterItems = async (req, res) => {
    // This garageId is securely attached to the request by your middleware.
    const garageId = req.garageId;

    // Safety check, although your middleware should prevent unauthorized access.
    if (!garageId) {
        return res.status(401).json({ message: 'Not authorized or no garage associated with user.' });
    }

    try {
        // This query fetches only the items belonging to the specific garage.
        const query = `
            SELECT 
                id, 
                name, 
                part_no, 
                type, 
                unit_price, 
                lube_charge, 
                labour_charge
            FROM master_items
            WHERE garage_id = $1 AND is_deleted = FALSE
            ORDER BY name ASC;
        `;

        const { rows } = await db.query(query, [garageId]);
        
        // Return the list of items. It's perfectly fine if this is an empty array [].
        res.status(200).json(rows);

    } catch (error) {
        // This will log the detailed database error on your backend terminal for debugging.
        console.error('Error fetching master items from database:', error);
        // Send a generic error to the frontend.
        res.status(500).json({ message: 'Server error while fetching the item list.' });
    }
};

module.exports = {
    getMasterItems,
};