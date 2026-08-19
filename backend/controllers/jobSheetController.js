// File: controllers/jobSheetController.js

const db = require('../config/db');

// --- Reusable Helper Function ---
const getFullJobSheetById = async (jobSheetId, garageId) => {
    const { rows } = await db.query(
        `SELECT 
            js.id, 
            js.job_sheet_number AS "jobSheetNumber",
            js.status, 
            js.notes, 
            js.date_created AS "dateCreated",
            v.car_number AS "vehicleNumber",
            CONCAT(mk.name, ' ', m.name) AS "vehicleModel", 
            c.name AS "customerName"
         FROM 
            job_sheets js
         JOIN 
            vehicles v ON js.vehicle_id = v.id
         JOIN 
            customers c ON v.customer_id = c.id
         JOIN 
            models m ON v.model_id = m.id
         JOIN
            makes mk ON v.make_id = mk.id
         WHERE 
            js.id = $1 AND js.garage_id = $2`,
        [jobSheetId, garageId]
    );
    return rows[0];
};

// --- Helper function for formatting numbers ---
const padWithZeros = (number, length) => {
    return String(number).padStart(length, '0');
};


/**
 * @description Fetches all historical job sheets (Completed, Invoiced, Cancelled) for a garage.
 * Includes customer name, vehicle details, grand total, and a linked invoice ID if one exists.
 * @route GET /api/jobsheets/historical
 * @access Private
 */
exports.getHistoricalJobSheets = async (req, res) => {
    const garageId = req.garageId; // Assumes your auth middleware provides this

    try {
        const query = `
            SELECT
                js.id,
                js.job_sheet_number AS "jobSheetNumber", -- Use aliases that match frontend camelCase
                TO_CHAR(js.date_completed, 'YYYY-MM-DD') AS "dateCompleted",
                TO_CHAR(js.date_created, 'YYYY-MM-DD') AS "dateCreated",
                js.status,
                
                -- Customer and Vehicle Details
                c.name AS "customerName",
                v.car_number AS "vehicleNumber",
                mk.name AS make,
                md.name AS model,
                
                -- Calculate grand_total on-the-fly from job_sheet_items
                (
                    SELECT COALESCE(SUM((jsi.unit_price * jsi.quantity) + jsi.lube_charge + jsi.labour_charge), 0)
                    FROM job_sheet_items jsi WHERE jsi.job_sheet_id = js.id
                ) AS "grandTotal",

                -- Find the corresponding invoice ID, if any
                (
                    SELECT inv.id
                    FROM invoices inv
                    WHERE inv.job_sheet_id = js.id
                    LIMIT 1
                ) AS "linkedInvoiceId"
                
            FROM job_sheets js
            JOIN customers c ON js.customer_id = c.id
            JOIN vehicles v ON js.vehicle_id = v.id
            JOIN makes mk ON v.make_id = mk.id
            JOIN models md ON v.model_id = md.id
            WHERE 
                js.garage_id = $1
                AND js.status IN ('Completed', 'Invoiced', 'Cancelled')
                AND js.is_deleted = FALSE
            ORDER BY js.date_created DESC, js.id DESC;
        `;

        const { rows } = await db.query(query, [garageId]);
        
        // Combine make and model into a single vehicleModel string, as the frontend expects
        const results = rows.map(row => ({
            ...row,
            vehicleModel: `${row.make || ''} ${row.model || ''}`.trim()
        }));

        res.status(200).json(results);

    } catch (error) {
        console.error('Error fetching historical job sheets:', error);
        res.status(500).json({ message: 'Server error while fetching job sheets archive.' });
    }
};

// @desc    Get all active job sheets
// @route   GET /api/jobsheets/active
// @access  Private
exports.getActiveJobSheets = async (req, res) => {
    // ... (This function remains unchanged, no need to copy it again)
    const garageId = req.garageId; 
    try {
        const { rows } = await db.query(
            `SELECT 
                js.id, js.job_sheet_number AS "jobSheetNumber", js.status, js.notes, 
                js.date_created AS "dateCreated", v.car_number AS "vehicleNumber",
                CONCAT(mk.name, ' ', m.name) AS "vehicleModel", c.name AS "customerName"
             FROM job_sheets js
             JOIN vehicles v ON js.vehicle_id = v.id
             JOIN customers c ON v.customer_id = c.id
             JOIN models m ON v.model_id = m.id
             JOIN makes mk ON v.make_id = mk.id
             WHERE 
                js.garage_id = $1
                AND js.status IN ('Waiting', 'In Progress', 'Draft')
                AND js.is_deleted = FALSE
             ORDER BY js.created_at DESC`,
            [garageId]
        );
        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        console.error('Error fetching active job sheets:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


/**
 * @desc    Checks in a vehicle. Creates a record with 'Waiting' status.
 * @route   POST /api/jobsheets/check-in
 * @access  Private
 */
exports.createCheckIn = async (req, res) => {
    const { vehicle_id, customer_id, km_reading, notes, dateCreated} = req.body;
    const garageId = req.garageId;
    const finalDate = dateCreated || new Date();

    if (!vehicle_id) {
        return res.status(400).json({ success: false, message: 'Vehicle ID is required.' });
    }

    try {
        // **MODIFIED WORKFLOW RULE:** 
        // Check if this vehicle has any job that is NOT 'Completed', 'Invoiced', or 'Cancelled'.
        // This allows re-check-in only after a previous job cycle is fully finished.
        const activeJobCheck = await db.query(
            `SELECT id FROM job_sheets 
             WHERE vehicle_id = $1 
               AND garage_id = $2 
               AND is_deleted = FALSE
               AND status NOT IN ('Completed', 'Invoiced', 'Cancelled')`,
            [vehicle_id, garageId]
        );

        if (activeJobCheck.rows.length > 0) {
            return res.status(409).json({ success: false, message: 'This vehicle is already checked in and has an active job. Please complete or cancel the existing job first.' });
        }

        // The placeholder 'CHECKED-IN' could cause a unique constraint violation if a user
        // checks in the same car twice after a deletion without it being promoted.
        // A better placeholder uses the vehicle_id to ensure uniqueness before a real job sheet number is assigned.
        const placeholderJobNumber = `CHECKIN-${vehicle_id}-${Date.now()}`;

        // Create the check-in record.
        const insertQuery = `
            INSERT INTO job_sheets (garage_id, job_sheet_number, customer_id, vehicle_id, km_reading, date_created, status, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id;
        `;
        const insertResult = await db.query(insertQuery, [
            garageId,
            placeholderJobNumber, // A unique placeholder
            customer_id,
            vehicle_id,
            km_reading,
            finalDate,
            'Waiting', 
            notes
        ]);

        const newRecordId = insertResult.rows[0].id;

        const newKanbanCard = await getFullJobSheetById(newRecordId, garageId);

        res.status(201).json({ success: true, data: newKanbanCard });

    } catch (err) {
        // The original error is caught here. The unique constraint on (garage_id, job_sheet_number)
        // was likely caused by inserting 'CHECKED-IN' multiple times for garage_id=1.
        // The new placeholder `CHECKIN-${vehicle_id}-${Date.now()}` resolves this.
        console.error('Error during vehicle check-in:', err);
        res.status(500).json({ success: false, message: 'Server Error during check-in.' });
    }
};

// @desc    Update a job sheet's status
// @route   PUT /api/jobsheets/:id/status
// @access  Private
exports.updateJobSheetStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const garageId = req.garageId;
    const allowedStatuses = ['Waiting', 'In Progress', 'Completed', 'Cancelled', 'Invoiced'];

    if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'A valid status is required.' });
    }
    
    // We MUST use a transaction client here because we are fetching and updating settings
    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        // --- First, get the current state of the job sheet ---
        const currentStateQuery = await client.query(
            'SELECT status, job_sheet_number FROM job_sheets WHERE id = $1 AND garage_id = $2 AND is_deleted = FALSE',
            [id, garageId]
        );

        if (currentStateQuery.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Job Sheet not found in your garage.' });
        }
        
        const currentJobSheet = currentStateQuery.rows[0];
        let newJobSheetNumber = currentJobSheet.job_sheet_number; // Default to the existing number

        // --- NEW LOGIC: Check if we are promoting a "Waiting" job ---
        // If so, generate the official job sheet number from garages table.
        if (currentJobSheet.status === 'Waiting' && status === 'In Progress') {
            
            // 1. Fetch settings from garages table and lock row to prevent duplicate numbers
            const settingsRes = await client.query(
                `SELECT jobsheet_prefix, jobsheet_next_num FROM garages WHERE id = $1 FOR UPDATE`,
                [garageId]
            );

            if (settingsRes.rows.length === 0) {
                throw new Error('Garage configuration not found. Please contact support.');
            }

            const settings = settingsRes.rows[0];

            // 2. Format the Dynamic Number
            const currentYear = new Date().getFullYear();
            const rawPrefix = settings.jobsheet_prefix || 'JS-';
            const dynamicPrefix = rawPrefix.replace('{YYYY}', currentYear);
            const nextNum = settings.jobsheet_next_num || 1;
            const paddedNumber = String(nextNum).padStart(4, '0');
            newJobSheetNumber = `${dynamicPrefix}${paddedNumber}`; // e.g., JS-0001 or JS-2026-0001

            // 3. Increment the counter for the next vehicle
            await client.query(
                `UPDATE garages SET jobsheet_next_num = COALESCE(jobsheet_next_num, 1) + 1 WHERE id = $1`,
                [garageId]
            );
        }
        
        // --- Update both status AND the job sheet number ---
        const updateResult = await client.query(
            'UPDATE job_sheets SET status = $1, job_sheet_number = $2 WHERE id = $3 AND garage_id = $4',
            [status, newJobSheetNumber, id, garageId]
        );

        if (updateResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Job Sheet not found during update.' });
        }
        
        // Commit the transaction BEFORE fetching the full updated object
        await client.query('COMMIT');
        
        // Fetch the fully updated job sheet to send back to the frontend.
        const updatedJobSheet = await getFullJobSheetById(id, garageId);
        
        if (!updatedJobSheet) {
            console.error(`CRITICAL: Failed to retrieve updated job sheet with ID: ${id}`);
            return res.status(404).json({ success: false, message: 'Job Sheet not found after update.' });
        }

        res.status(200).json({ success: true, data: updatedJobSheet });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Error updating status for job sheet ${id}:`, err);
        res.status(500).json({ success: false, message: err.message || 'Server Error during status update.' });
    } finally {
        // Always release the client connection back to the pool
        client.release();
    }
};


// @desc    Get a single job sheet with all related details
// @route   GET /api/jobsheets/:id/details
// @access  Private
exports.getJobSheetDetails = async (req, res) => {
    const { id } = req.params;
    const garageId = req.garageId; 

    if (!garageId) {
        return res.status(400).json({ message: 'Garage ID is missing from request.' });
    }

    try {
        const jobSheetQuery = `
            SELECT
                js.id, js.job_sheet_number, js.km_reading, js.date_created, js.date_completed,
                js.status, js.notes, c.id AS customer_id, c.name AS customer_name,
                c.phone AS customer_phone, c.email AS customer_email, c.address AS customer_address,
                v.id AS vehicle_id, v.car_number AS vehicle_number, v.year AS vehicle_year,
                v.vin AS vehicle_vin, v.fuel_type AS vehicle_fuel_type,
                mk.name AS make_name, md.name AS model_name
            FROM job_sheets js
            LEFT JOIN customers c ON js.customer_id = c.id
            LEFT JOIN vehicles v ON js.vehicle_id = v.id
            LEFT JOIN makes mk ON v.make_id = mk.id
            LEFT JOIN models md ON v.model_id = md.id
            WHERE js.id = $1 AND js.garage_id = $2 AND js.is_deleted = FALSE;
        `;
        const jobSheetResult = await db.query(jobSheetQuery, [id, garageId]);

        if (jobSheetResult.rows.length === 0) {
            return res.status(404).json({ message: `Job Sheet ${id} not found.` });
        }
        const jobSheetData = jobSheetResult.rows[0];

        const itemsQuery = `
            SELECT
                jsi.master_item_id, jsi.quantity, jsi.unit_price, jsi.lube_charge,
                jsi.labour_charge, mi.name, mi.part_no
            FROM job_sheet_items jsi
            JOIN master_items mi ON jsi.master_item_id = mi.id
            WHERE jsi.job_sheet_id = $1;
        `;
        const itemsResult = await db.query(itemsQuery, [id]);

        const response = {
            jobSheetDetails: {
                id: jobSheetData.id, jobSheetNumber: jobSheetData.job_sheet_number,
                status: jobSheetData.status, kmReading: jobSheetData.km_reading,
                notes: jobSheetData.notes, dateCreated: jobSheetData.date_created,
                customerId: jobSheetData.customer_id, vehicleId: jobSheetData.vehicle_id,
            },
            customerDetails: {
                id: jobSheetData.customer_id, name: jobSheetData.customer_name,
                phone: jobSheetData.customer_phone, email: jobSheetData.customer_email,
                address: jobSheetData.customer_address,
            },
            vehicleDetails: {
                id: jobSheetData.vehicle_id, make: jobSheetData.make_name,
                model: jobSheetData.model_name, carNumber: jobSheetData.vehicle_number,
                year: jobSheetData.vehicle_year, vin: jobSheetData.vehicle_vin,
            },
            addedItems: itemsResult.rows.map(item => ({
                masterItemId: item.master_item_id,
                master_item_id: item.master_item_id,
                name: item.name,
                partNo: item.part_no,
                part_no: item.part_no,
                quantity: Number(item.quantity),
                unitPrice: parseFloat(item.unit_price || 0),
                unit_price: parseFloat(item.unit_price || 0),
                lubeCharge: parseFloat(item.lube_charge || 0),
                lube_charge: parseFloat(item.lube_charge || 0),
                labourCharge: parseFloat(item.labour_charge || 0),
                labour_charge: parseFloat(item.labour_charge || 0),
            }))
        };
        res.status(200).json(response);
    } catch (error) {
        console.error(`Error fetching job sheet details for ID ${id}:`, error);
        res.status(500).json({ message: 'Server error while fetching job sheet details.' });
    }
};


// @desc    Update a job sheet's details (Save Draft or Finalize)
// @route   PUT /api/jobsheets/:id/details
// @access  Private
// @desc    Update a job sheet's details (Save Draft or Finalize)
// @route   PUT /api/jobsheets/:id/details
// @access  Private
exports.updateJobSheetDetails = async (req, res) => {
    const { id } = req.params;
    const garageId = req.garageId;
    const { kmReading, notes, items, status, dateCompleted } = req.body;

    if (!status || !['Draft', 'In Progress', 'Completed'].includes(status)) {
        return res.status(400).json({ message: "Invalid status provided." });
    }
    if (!Array.isArray(items)) {
        return res.status(400).json({ message: "Items must be an array." });
    }

    const client = await db.getClient(); 

    try {
        await client.query('BEGIN');

        // FIX 1: Sanitize kmReading. Convert empty strings to null so they don't break integer DB columns
        const cleanKmReading = kmReading === '' || kmReading === undefined || kmReading === null 
            ? null 
            : parseInt(kmReading, 10);

        let nextServiceKm = null; 

        // Check if the status is being set to 'Completed' and we have a valid KM reading
        if (status === 'Completed' && cleanKmReading) {
            nextServiceKm = cleanKmReading + 10000;
        }

        // Modify the SQL query to use sanitized parameters safely
        const updateJobSheetQuery = `
            UPDATE job_sheets 
            SET 
                km_reading = $1, 
                notes = $2, 
                status = $3, 
                date_completed = $4,
                next_service_km = $5 
            WHERE id = $6 AND garage_id = $7 RETURNING id;
        `;

        const updateResult = await client.query(updateJobSheetQuery, [
            cleanKmReading, // Using sanitized value/null instead of raw string
            notes, 
            status,
            status === 'Completed' ? (dateCompleted || new Date()) : null,
            nextServiceKm,
            id, 
            garageId
        ]);

        if (updateResult.rowCount === 0) throw new Error('Job Sheet not found or access denied.');

        // --- STOCK DEDUCTION & DELTA CALCULATION ---
        // 1. Fetch old items for this job sheet
        const oldItemsQuery = await client.query(
            'SELECT master_item_id, quantity FROM job_sheet_items WHERE job_sheet_id = $1',
            [id]
        );
        const oldQtyMap = {};
        oldItemsQuery.rows.forEach(row => {
            const mId = parseInt(row.master_item_id, 10);
            oldQtyMap[mId] = (oldQtyMap[mId] || 0) + parseFloat(row.quantity);
        });

        // 2. Build new qty map
        const newQtyMap = {};
        if (Array.isArray(items)) {
            items.forEach(item => {
                const mId = parseInt(item.masterItemId || item.master_item_id || item.id, 10);
                const q = parseFloat(item.quantity) || 0;
                if (mId && q > 0) {
                    newQtyMap[mId] = (newQtyMap[mId] || 0) + q;
                }
            });
        }

        // 3. Process stock deltas for all involved master items
        const allMasterItemIds = Array.from(new Set([...Object.keys(oldQtyMap), ...Object.keys(newQtyMap)])).map(Number);
        
        for (const mId of allMasterItemIds) {
            const oldQty = oldQtyMap[mId] || 0;
            const newQty = newQtyMap[mId] || 0;
            const delta = newQty - oldQty; // positive = more used, negative = items returned

            if (delta !== 0) {
                const itemRes = await client.query(
                    'SELECT id, name, type, stock_qty FROM master_items WHERE id = $1 AND garage_id = $2 FOR UPDATE',
                    [mId, garageId]
                );

                if (itemRes.rows.length > 0) {
                    const masterItem = itemRes.rows[0];
                    if (masterItem.type === 'Spare') {
                        const currentStock = parseFloat(masterItem.stock_qty || 0);
                        if (delta > 0 && currentStock < delta) {
                            throw new Error(`Insufficient stock for "${masterItem.name}". Available stock: ${currentStock}, requested additional: ${delta}.`);
                        }
                        const updatedStock = Math.max(0, currentStock - delta);
                        await client.query(
                            'UPDATE master_items SET stock_qty = $1, updated_at = NOW() WHERE id = $2',
                            [updatedStock, mId]
                        );
                    }
                }
            }
        }

        await client.query('DELETE FROM job_sheet_items WHERE job_sheet_id = $1', [id]);

        if (items.length > 0) {
            // Guard against undefined or broken values during raw template literal construction
            const itemValues = items.map(item => {
                const masterItemId = parseInt(item.masterItemId || item.master_item_id || item.id, 10);
                const qty = parseFloat(item.quantity) || 1;
                const price = parseFloat(item.unitPrice ?? item.unit_price ?? item.price) || 0;
                const lube = parseFloat(item.lubeCharge ?? item.lube_charge) || 0;
                const labour = parseFloat(item.labourCharge ?? item.labour_charge) || 0;
                return `(${id}, ${masterItemId}, ${qty}, ${price}, ${lube}, ${labour})`;
            }).join(',');
            
            const insertItemsQuery = `
                INSERT INTO job_sheet_items (job_sheet_id, master_item_id, quantity, unit_price, lube_charge, labour_charge)
                VALUES ${itemValues};
            `;
            await client.query(insertItemsQuery);
        }

        await client.query('COMMIT');

        // FIX 2: Send back the modified jobSheet key so your frontend React state updates smoothly
        res.status(200).json({ 
            success: true, 
            message: `Job sheet ${status.toLowerCase()} successfully.`,
            jobSheet: {
                status: status,
                kmReading: cleanKmReading,
                notes: notes
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error updating job sheet ${id}:`, error);
        if (error.message.includes('not found')) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: error.message || 'Server error during job sheet update.' });
        }
    } finally {
        client.release();
    }
};

// @desc    Hard Delete a single Job Sheet
// @route   DELETE /api/jobsheets/:id
exports.deleteJobSheet = async (req, res) => {
    const { id } = req.params;
    const garageId = req.garageId;
    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        // Restore stock for deleted spare items before removing
        const itemsToRestore = await client.query(
            `SELECT jsi.master_item_id, jsi.quantity, mi.type 
             FROM job_sheet_items jsi
             JOIN master_items mi ON jsi.master_item_id = mi.id
             WHERE jsi.job_sheet_id = $1 AND mi.type = 'Spare'`,
            [id]
        );
        for (const item of itemsToRestore.rows) {
            await client.query(
                'UPDATE master_items SET stock_qty = COALESCE(stock_qty, 0) + $1, updated_at = NOW() WHERE id = $2',
                [parseFloat(item.quantity), item.master_item_id]
            );
        }

        // 1. Delete associated items first to prevent foreign key constraint errors
        await client.query('DELETE FROM job_sheet_items WHERE job_sheet_id = $1', [id]);

        // 2. Hard delete the job sheet
        const result = await client.query(
            'DELETE FROM job_sheets WHERE id = $1 AND garage_id = $2 RETURNING id',
            [id, garageId]
        );

        if (result.rows.length === 0) {
            throw new Error('Job sheet not found or already deleted.');
        }

        await client.query('COMMIT');
        res.status(200).json({ success: true, message: 'Job Sheet permanently deleted.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error hard deleting job sheet:', error);
        
        // 👉 THE TRIPWIRE: Catch the specific foreign key violation code (23503)
        if (error.code === '23503' && error.constraint === 'invoices_job_sheet_id_fkey') {
            return res.status(409).json({ 
                success: false, 
                message: 'Cannot delete this Job Sheet because an Invoice has already been generated for it. Please delete the associated Invoice first.' 
            });
        }

        res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};


// @desc    Hard Delete multiple Job Sheets by date range
// @route   DELETE /api/jobsheets/bulk
// @body    { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
exports.bulkDeleteJobSheets = async (req, res) => {
    const garageId = req.garageId;
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Start date and end date are required.' });
    }

    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        // 1. Find all job sheet IDs in this date range for this garage
        const findQuery = `
            SELECT id FROM job_sheets 
            WHERE garage_id = $1 
            AND DATE(created_at) >= $2 
            AND DATE(created_at) <= $3
        `;
        const { rows } = await client.query(findQuery, [garageId, startDate, endDate]);
        
        if (rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(200).json({ success: true, message: 'No job sheets found in this date range.' });
        }

        const jobSheetIds = rows.map(row => row.id);

        // 2. Delete all items linked to these job sheets
        await client.query(
            'DELETE FROM job_sheet_items WHERE job_sheet_id = ANY($1::int[])',
            [jobSheetIds]
        );

        // 3. Delete the job sheets
        await client.query(
            'DELETE FROM job_sheets WHERE id = ANY($1::int[])',
            [jobSheetIds]
        );

        await client.query('COMMIT');
        res.status(200).json({ success: true, message: `Successfully deleted ${jobSheetIds.length} job sheets permanently.` });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error bulk deleting job sheets:', error);

        // 👉 THE TRIPWIRE: Catch the foreign key violation
        if (error.code === '23503' && error.constraint === 'invoices_job_sheet_id_fkey') {
            return res.status(409).json({ 
                success: false, 
                message: 'Bulk delete failed. Some job sheets in this date range have active invoices attached to them. You must delete the invoices first.' 
            });
        }

        res.status(500).json({ success: false, message: 'Server error during bulk deletion.' });
    } finally {
        client.release();
    }
};