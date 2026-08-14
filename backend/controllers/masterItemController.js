const db = require('../config/db');

// @desc    Get all master items
// @route   GET /api/master-items
const getMasterItems = async (req, res) => {
    const garageId = req.garageId;
    if (!garageId) return res.status(401).json({ message: 'Not authorized.' });

    try {
        // Aliasing snake_case database columns to camelCase for the frontend
        const query = `
            SELECT 
                id, name, type, 
                part_no AS "partNo", part_no, 
                unit_price AS "unitPrice", unit_price, 
                lube_charge AS "lubeCharge", lube_charge, 
                labour_charge AS "labourCharge", labour_charge,
                stock_qty AS "stockQty", stock_qty
            FROM master_items
            WHERE garage_id = $1 AND is_deleted = FALSE
            ORDER BY name ASC;
        `;
        const { rows } = await db.query(query, [garageId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching master items:', error);
        res.status(500).json({ message: 'Server error while fetching items.' });
    }
};

// @desc    Create a new master item
// @route   POST /api/master-items
const createMasterItem = async (req, res) => {
    const garageId = req.garageId;
    const { name, partNo, type, unitPrice, lubeCharge, labourCharge, stockQty } = req.body;

    try {
        const garageRes = await db.query('SELECT feature_stock FROM garages WHERE id = $1', [garageId]);
        if (garageRes.rows.length > 0 && garageRes.rows[0].feature_stock === false) {
            return res.status(403).json({ success: false, message: 'This action is restricted because the Stock & Inventory module is set to Read-Only Mode by your Super Admin.' });
        }
        const query = `
            INSERT INTO master_items (garage_id, name, part_no, type, unit_price, lube_charge, labour_charge, stock_qty)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, name, type, part_no AS "partNo", unit_price AS "unitPrice", lube_charge AS "lubeCharge", labour_charge AS "labourCharge", stock_qty AS "stockQty";
        `;
        
        // Ensure stockQty is null for Services
        const finalStockQty = type === 'Spare' ? (stockQty || 0) : null;

        const { rows } = await db.query(query, [
            garageId, name, partNo || null, type, 
            unitPrice || 0, lubeCharge || 0, labourCharge || 0, finalStockQty
        ]);
        
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creating master item:', error);
        // Catch unique constraint error for duplicate part numbers
        if (error.code === '23505') {
            return res.status(400).json({ message: 'An item with this Part No. already exists.' });
        }
        res.status(500).json({ message: 'Server error while creating item.' });
    }
};

// @desc    Update a master item
// @route   PUT /api/master-items/:id
const updateMasterItem = async (req, res) => {
    const garageId = req.garageId;
    const { id } = req.params;
    const { name, partNo, type, unitPrice, lubeCharge, labourCharge, stockQty } = req.body;

    try {
        const finalStockQty = type === 'Spare' ? (stockQty || 0) : null;

        const query = `
            UPDATE master_items 
            SET name = $1, part_no = $2, type = $3, unit_price = $4, lube_charge = $5, labour_charge = $6, stock_qty = $7
            WHERE id = $8 AND garage_id = $9 AND is_deleted = FALSE
            RETURNING id, name, type, part_no AS "partNo", unit_price AS "unitPrice", lube_charge AS "lubeCharge", labour_charge AS "labourCharge", stock_qty AS "stockQty";
        `;
        
        const { rows } = await db.query(query, [
            name, partNo || null, type, unitPrice || 0, lubeCharge || 0, labourCharge || 0, finalStockQty, id, garageId
        ]);

        if (rows.length === 0) return res.status(404).json({ message: 'Item not found.' });
        
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error updating master item:', error);
        if (error.code === '23505') return res.status(400).json({ message: 'Part No. already exists.' });
        res.status(500).json({ message: 'Server error while updating item.' });
    }
};

// @desc    Soft delete a master item
// @route   DELETE /api/master-items/:id
const deleteMasterItem = async (req, res) => {
    const garageId = req.garageId;
    const { id } = req.params;

    try {
        // We use soft delete so past invoices don't break
        const query = `UPDATE master_items SET is_deleted = TRUE WHERE id = $1 AND garage_id = $2 RETURNING id;`;
        const { rows } = await db.query(query, [id, garageId]);

        if (rows.length === 0) return res.status(404).json({ message: 'Item not found.' });

        res.status(200).json({ success: true, message: 'Item deleted.' });
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ message: 'Server error during deletion.' });
    }
};

module.exports = { getMasterItems, createMasterItem, updateMasterItem, deleteMasterItem };