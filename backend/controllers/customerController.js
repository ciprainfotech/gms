// controllers/customerController.js

const db = require('../config/db');

// @desc    Create a new customer (Strict Flow: Links existing if phone matches)
// @route   POST /api/customers
// @access  Private
exports.createCustomer = async (req, res) => {
    const garageId = req.garageId;
    const { name, phone, email, address } = req.body;

    if (!garageId || !name || !phone) {
        return res.status(400).json({ success: false, message: 'Garage ID, Name, and Phone are required.' });
    }

    try {
        // 1. STRICT LOGIC: Check if this phone number already exists
        const checkExist = await db.query(
            'SELECT * FROM customers WHERE garage_id = $1 AND phone = $2',
            [garageId, phone]
        );

        if (checkExist.rows.length > 0) {
            const existingCustomer = checkExist.rows[0];

            // 2. If they were deleted, revive them!
            if (existingCustomer.is_deleted) {
                const { rows } = await db.query(
                    `UPDATE customers SET is_deleted = FALSE, updated_at = NOW() WHERE id = $1 RETURNING *`,
                    [existingCustomer.id]
                );
                return res.status(200).json({ success: true, data: rows[0], message: 'Revived existing customer.' });
            }

            // 3. If active, DO NOT overwrite their data. Just return their profile 
            // so the frontend can link the new vehicle to them!
            return res.status(200).json({ success: true, data: existingCustomer, message: 'Linked to existing customer.' });
        }

        // 4. If the number has never been used, do a standard INSERT
        const { rows } = await db.query(
            'INSERT INTO customers (garage_id, name, phone, email, address) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [garageId, name, phone, email, address]
        );
        res.status(201).json({ success: true, data: rows[0] });

    } catch (err) {
        console.error('Error creating customer:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * You would follow this exact same pattern for all other controller functions
 * that need to operate within the context of a specific garage.
 * 
 * For example: To get all customers for the current garage.
 */
exports.getCustomers = async (req, res) => {
    const garageId = req.garageId;

    try {
        const { rows } = await db.query(
            'SELECT * FROM customers WHERE garage_id = $1 AND is_deleted = FALSE ORDER BY created_at DESC',
            [garageId]
        );
        res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (err) {
        console.error('Error fetching customers:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Private
exports.updateCustomer = async (req, res) => {
    const garageId = req.garageId;
    const customerId = req.params.id;
    const { name, phone, email, address } = req.body;

    if (!name || !phone) {
        return res.status(400).json({ success: false, message: 'Name and Phone are required.' });
    }

    try {
        const { rows } = await db.query(
            `UPDATE customers 
             SET name = $1, phone = $2, email = $3, address = $4 
             WHERE id = $5 AND garage_id = $6 AND is_deleted = FALSE 
             RETURNING *`,
            [name, phone, email, address, customerId, garageId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer not found or you do not have permission to edit.' });
        }

        res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
        // Handle unique constraint error if they change the phone number to one that already exists
        if (err.code === '23505') {
            return res.status(409).json({ success: false, message: 'A customer with this phone number already exists in your garage.' });
        }
        console.error('Error updating customer:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete a customer (Soft Delete)
// @route   DELETE /api/customers/:id
// @access  Private
exports.deleteCustomer = async (req, res) => {
    const garageId = req.garageId;
    const customerId = req.params.id;

    try {
        // We do a SOFT DELETE so we don't break old invoices/job sheets tied to this customer
        const { rowCount } = await db.query(
            'UPDATE customers SET is_deleted = TRUE WHERE id = $1 AND garage_id = $2 AND is_deleted = FALSE',
            [customerId, garageId]
        );

        if (rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        // Optional: You might also want to soft delete all vehicles associated with this customer
        await db.query(
            'UPDATE vehicles SET is_deleted = TRUE WHERE customer_id = $1 AND garage_id = $2',
            [customerId, garageId]
        );

        res.status(200).json({ success: true, message: 'Customer deleted successfully' });
    } catch (err) {
        console.error('Error deleting customer:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get a single customer by ID
// @route   GET /api/customers/:id
// @access  Private
exports.getCustomerById = async (req, res) => {
    const garageId = req.garageId;
    const customerId = req.params.id;

    try {
        const { rows } = await db.query(
            'SELECT * FROM customers WHERE id = $1 AND garage_id = $2 AND is_deleted = FALSE',
            [customerId, garageId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('Error fetching customer by ID:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


// @desc    Check if a customer exists by phone number
// @route   GET /api/customers/check-phone/:phone
// @access  Private
exports.checkCustomerByPhone = async (req, res) => {
    const garageId = req.garageId;
    const phone = req.params.phone;

    try {
        const { rows } = await db.query(
            'SELECT * FROM customers WHERE garage_id = $1 AND phone = $2 AND is_deleted = FALSE',
            [garageId, phone]
        );

        if (rows.length > 0) {
            return res.status(200).json({ success: true, exists: true, data: rows[0] });
        } else {
            return res.status(200).json({ success: true, exists: false });
        }
    } catch (err) {
        console.error('Error checking phone:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};