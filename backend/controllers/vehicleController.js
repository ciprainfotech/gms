    // File: controllers/vehicleController.js

    const db = require('../config/db');

    // @desc    Check for a vehicle by car number within the user's garage
    // @route   POST /api/vehicles/check
    // @access  Private (Requires 'authorizeGarage' middleware)
    exports.checkVehicleByNumber = async (req, res) => {
        const { car_number } = req.body;
        const garageId = req.garageId;

        if (!car_number) {
            return res.status(400).json({ success: false, message: 'Car number is required' });
        }

        try {
            const { rows } = await db.query(
                `SELECT 
                    v.id, v.car_number, v.year, v.vin, v.fuel_type,
                    c.id AS customer_id, c.name AS customer_name, c.phone AS customer_phone,
                    m.name AS make_name, mo.name AS model_name
                FROM vehicles v
                JOIN customers c ON v.customer_id = c.id
                JOIN makes m ON v.make_id = m.id
                JOIN models mo ON v.model_id = mo.id
                WHERE v.garage_id = $1 AND v.car_number = $2 AND v.is_deleted = FALSE`,
                [garageId, car_number.trim().toUpperCase()]
            );

            if (rows.length > 0) {
                return res.status(200).json({ success: true, exists: true, data: rows[0] });
            } else {
                return res.status(200).json({ success: true, exists: false, data: null });
            }
        } catch (err) {
            console.error('Error checking vehicle by number:', err);
            return res.status(500).json({ success: false, message: 'Server Error' });
        }
    };

    
/**
 * @description Search vehicles by partial car number for auto-suggest
 * @route GET /api/vehicles/search?q=...
 * @access Private
 */
exports.searchVehicles = async (req, res) => {
    const { q } = req.query;
    const garageId = req.garageId;

    if (!q || q.length < 2) {
        return res.status(200).json({ success: true, data: [] });
    }

    const client = await db.getClient();
    try {
        // ILIKE performs a case-insensitive partial match
        const query = `
            SELECT 
                v.car_number, 
                c.name as customer_name,
                m.name as make,
                mo.name as model
            FROM vehicles v
            LEFT JOIN customers c ON v.customer_id = c.id
            LEFT JOIN makes m ON v.make_id = m.id
            LEFT JOIN models mo ON v.model_id = mo.id
            WHERE v.garage_id = $1 AND v.car_number ILIKE $2
            LIMIT 10
        `;
        const { rows } = await client.query(query, [garageId, `%${q}%`]);
        
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Error searching vehicles:', error);
        res.status(500).json({ success: false, message: 'Server error during search.' });
    } finally {
        client.release();
    }
};


    // @desc    Get service history for a vehicle
    // @route   GET /api/vehicles/history/:carNumber
    // @access  Private (Requires 'authorizeGarage' middleware)
    exports.getVehicleHistory = async (req, res) => {
        const { carNumber } = req.params;
        const garageId = req.garageId;

        try {
            // --- FIX #1: Changed JOIN to LEFT JOIN for robustness ---
            // This prevents an error if a make or model is missing for a vehicle.
            const vehicleResult = await db.query(
                `SELECT 
                    v.id AS vehicle_id, v.car_number, v.year, v.vin, v.fuel_type,
                    mo.name AS model, m.name AS make, 
                    c.id AS customer_id, c.name, c.phone, c.email, c.address
                FROM vehicles v
                JOIN customers c ON v.customer_id = c.id
                LEFT JOIN makes m ON v.make_id = m.id
                LEFT JOIN models mo ON v.model_id = mo.id
                WHERE v.garage_id = $1 AND v.car_number = $2 AND v.is_deleted = FALSE`,
                [garageId, carNumber.trim().toUpperCase()]
            );

            if (vehicleResult.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Vehicle not found in your garage' });
            }
            
            const vehicleAndCustomerInfo = vehicleResult.rows[0];

            const historyResult = await db.query(
                `SELECT id, job_sheet_number, date_created, date_completed, km_reading, status, next_service_km 
                FROM job_sheets 
                WHERE vehicle_id = $1 AND garage_id = $2 AND is_deleted = FALSE
                ORDER BY date_created DESC`,
                [vehicleAndCustomerInfo.vehicle_id, garageId]
            );

            // --- FIX #2: Changed the response key from "vehicle" to "customer" ---
            // This now matches exactly what the frontend `Dashboard.jsx` is expecting.
            return res.status(200).json({
                success: true,
                data: {
                    customer: vehicleAndCustomerInfo,
                    jobSheets: historyResult.rows
                }
            });
        } catch (err) {
            console.error('Error fetching vehicle history:', err);
            return res.status(500).json({ success: false, message: 'Server Error' });
        }
    };

    // @desc    Create a new vehicle (Restores soft-deleted vehicles if car number matches)
// @route   POST /api/vehicles
// @access  Private 
exports.createVehicle = async (req, res) => {
    const garageId = req.garageId;
    const { customer_id, make_id, model_id, car_number, year, vin, fuel_type, color } = req.body;

    if (!customer_id || !make_id || !model_id || !car_number) {
        return res.status(400).json({ success: false, message: 'Customer, make, model, and car number are required.' });
    }

    const cleanCarNumber = car_number.trim().toUpperCase();

    try {
        // 1. Check if this car number already exists (Deleted or Active)
        const checkExist = await db.query(
            'SELECT id, is_deleted FROM vehicles WHERE garage_id = $1 AND car_number = $2',
            [garageId, cleanCarNumber]
        );

        if (checkExist.rows.length > 0) {
            const existingVehicle = checkExist.rows[0];

            if (existingVehicle.is_deleted) {
                // 2. THE GHOST FIX: If it was deleted, "Undelete" it and attach it to the new customer!
                const { rows } = await db.query(
                    `UPDATE vehicles 
                     SET customer_id = $1, make_id = $2, model_id = $3, year = $4, vin = $5, fuel_type = $6, color = $7, is_deleted = FALSE
                     WHERE id = $8 RETURNING *`,
                    [customer_id, make_id, model_id, year, vin, fuel_type, color, existingVehicle.id]
                );
                return res.status(201).json({ success: true, data: rows[0] });
            } else {
                // 3. If it exists and is ACTIVE, reject it
                return res.status(409).json({ success: false, message: 'An active vehicle with this car number already exists in your garage.' });
            }
        }

        // 4. If it's a brand new car, do a standard INSERT
        const { rows } = await db.query(
            `INSERT INTO vehicles (garage_id, customer_id, make_id, model_id, car_number, year, vin, fuel_type, color) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [garageId, customer_id, make_id, model_id, cleanCarNumber, year, vin, fuel_type, color]
        );
        return res.status(201).json({ success: true, data: rows[0] });

    } catch (err) {
        if (err.code === '23505') { 
            return res.status(409).json({ success: false, message: 'A vehicle with this car number already exists in your garage.' });
        }
        console.error('Error creating vehicle:', err);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all vehicles for the current garage
// @route   GET /api/vehicles
// @access  Private 
exports.getVehicles = async (req, res) => {
    const garageId = req.garageId;

    try {
        const { rows } = await db.query(
            `SELECT 
                v.id, 
                v.customer_id AS "customerId", 
                v.car_number AS "carNumber", 
                v.year, 
                v.vin, 
                v.fuel_type AS "fuelType",
                v.color,      -- MUST BE HERE
                v.make_id,    -- MUST BE HERE OR FRONTEND FALLBACK FAILS
                v.model_id,   -- MUST BE HERE OR FRONTEND FALLBACK FAILS
                m.name AS make,
                mo.name AS model
             FROM vehicles v
             LEFT JOIN makes m ON v.make_id = m.id
             LEFT JOIN models mo ON v.model_id = mo.id
             WHERE v.garage_id = $1 AND v.is_deleted = FALSE 
             ORDER BY v.created_at DESC`,
            [garageId]
        );
        res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (err) {
        console.error('Error fetching vehicles:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get a single vehicle by ID
// @route   GET /api/vehicles/:id
// @access  Private (Requires 'authorizeGarage' middleware)
exports.getVehicleById = async (req, res) => {
    const garageId = req.garageId;
    const vehicleId = req.params.id;

    try {
        const { rows } = await db.query(
           `SELECT 
                v.id, 
                v.customer_id AS "customerId", 
                v.car_number AS "carNumber", 
                v.year, 
                v.vin, 
                v.fuel_type AS "fuelType",
                v.color, 
                v.make_id,    -- 👉 NEW: Send the Make ID to React
                v.model_id,   -- 👉 NEW: Send the Model ID to React
                m.name AS make,
                mo.name AS model
             FROM vehicles v
             LEFT JOIN makes m ON v.make_id = m.id
             LEFT JOIN models mo ON v.model_id = mo.id
             WHERE v.garage_id = $1 AND v.is_deleted = FALSE 
             ORDER BY v.created_at DESC` // 👉 Fixed WHERE clause
            [vehicleId, garageId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Vehicle not found' });
        }

        res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('Error fetching vehicle by ID:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

    // @desc    Update a vehicle
    // @route   PUT /api/vehicles/:id
    // @access  Private (Requires 'authorizeGarage' middleware)
    exports.updateVehicle = async (req, res) => {
        const garageId = req.garageId;
        const vehicleId = req.params.id;
        const { make_id, model_id, car_number, year, vin, fuel_type, color } = req.body;

        if (!make_id || !model_id || !car_number) {
            return res.status(400).json({ success: false, message: 'Make, model, and car number are required.' });
        }

        try {
            const { rows } = await db.query(
        `UPDATE vehicles 
        SET make_id = $1, model_id = $2, car_number = $3, year = $4, vin = $5, fuel_type = $6, color = $7
        WHERE id = $8 AND garage_id = $9 AND is_deleted = FALSE 
        RETURNING *`,
        [make_id, model_id, car_number.trim().toUpperCase(), year, vin, fuel_type, color, vehicleId, garageId]
    );

            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Vehicle not found or you do not have permission to edit.' });
            }

            res.status(200).json({ success: true, data: rows[0] });
        } catch (err) {
            // Handle unique constraint error if they change the car number to one that already exists
            if (err.code === '23505') {
                return res.status(409).json({ success: false, message: 'A vehicle with this car number already exists in your garage.' });
            }
            console.error('Error updating vehicle:', err);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    };

    // @desc    Delete a vehicle (Soft Delete)
    // @route   DELETE /api/vehicles/:id
    // @access  Private (Requires 'authorizeGarage' middleware)
    exports.deleteVehicle = async (req, res) => {
        const garageId = req.garageId;
        const vehicleId = req.params.id;

        try {
            // SOFT DELETE: keeps the historical record intact for old invoices
            const { rowCount } = await db.query(
                'UPDATE vehicles SET is_deleted = TRUE WHERE id = $1 AND garage_id = $2 AND is_deleted = FALSE',
                [vehicleId, garageId]
            );

            if (rowCount === 0) {
                return res.status(404).json({ success: false, message: 'Vehicle not found' });
            }

            res.status(200).json({ success: true, message: 'Vehicle deleted successfully' });
        } catch (err) {
            console.error('Error deleting vehicle:', err);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    };