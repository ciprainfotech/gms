// backend/controllers/invoiceController.js

const db = require('../config/db'); // Your database connection pool from pg

// --- Helper function for fetching detailed invoice data (DUPLICATED FOR NOW) ---
// This helper is used by both getAllInvoices and getInvoiceById
// It includes all necessary joins to fetch customer, vehicle, make, model, payments, and invoice items.
async function getFullInvoiceWithPaymentsAndVehicleDetails(clientId, invoiceId = null, garageId) {
    const whereClause = invoiceId ? `AND i.id = $2` : ``;
    const params = invoiceId ? [garageId, invoiceId] : [garageId];

    const query = `
        WITH payment_agg AS (
            SELECT
                p.invoice_id,
                json_agg(json_build_object(
                    'id', p.id::TEXT,
                    'amountPaid', p.amount_paid::NUMERIC,
                    'datePaid', TO_CHAR(p.date_paid, 'YYYY-MM-DD'),
                    'paymentMethod', p.payment_method,
                    'notes', p.notes,
                    'createdAt', p.created_at,
                    'updatedAt', p.updated_at
                ) ORDER BY p.date_paid ASC, p.created_at ASC) AS payment_records
            FROM payments p
            GROUP BY p.invoice_id
        ), item_agg AS (
            SELECT
                ii.invoice_id,
                json_agg(jsonb_build_object(
                    'master_item_id', ii.master_item_id,
                    'name', mi.name,
                    'part_no', mi.part_no,
                    'quantity', ii.quantity,
                    'unit_price', ii.unit_price,
                    'lube_charge', ii.lube_charge,
                    'labour_charge', ii.labour_charge,
                    'line_parts_calculated', (ii.unit_price * ii.quantity)
                ) ORDER BY ii.id ASC) AS item_records
            FROM invoice_items ii
            JOIN master_items mi ON ii.master_item_id = mi.id
            GROUP BY ii.invoice_id
        )
        SELECT
            i.id,
            i.invoice_number,
            i.customer_id,
            i.vehicle_id,
            js.job_sheet_number,
            i.grand_total,
            i.status,
            TO_CHAR(i.date_issued, 'YYYY-MM-DD') AS date_issued,
            TO_CHAR(i.due_date, 'YYYY-MM-DD') AS due_date,
            i.km_reading,
            i.discount_type,
            i.discount_value,
            i.tax_rate,
            i.notes,
            i.is_deleted,
            i.created_at,
            i.updated_at,
            c.name AS customer_name,
            c.phone AS customer_phone,
            c.email AS customer_email,
            c.address AS customer_address,
            v.car_number AS vehicle_car_number,
            v.year AS vehicle_year,
            v.vin AS vehicle_vin,
            mk.name AS vehicle_make,
            md.name AS vehicle_model,
            COALESCE(pa.payment_records, '[]') AS paymentRecords,
            COALESCE(ia.item_records, '[]') AS items
        FROM invoices i
        JOIN customers c ON i.customer_id = c.id
        JOIN vehicles v ON i.vehicle_id = v.id
        JOIN makes mk ON v.make_id = mk.id
        JOIN models md ON v.model_id = md.id
        LEFT JOIN job_sheets js ON i.job_sheet_id = js.id
        LEFT JOIN payment_agg pa ON i.id = pa.invoice_id
        LEFT JOIN item_agg ia ON i.id = ia.invoice_id
        WHERE i.garage_id = $1 AND i.is_deleted = FALSE ${whereClause}
        ORDER BY i.date_issued DESC, i.id DESC;
    `;
    const res = await clientId.query(query, params);
    return res.rows;
}


// @description Fetches all job sheets ready for invoicing for the user's garage.
// @route GET /api/invoices/ready-for-invoicing
// @access Private
exports.getReadyJobSheets = async (req, res) => {
    const garageId = req.garageId; // Assumes your auth middleware provides this

    try {
        const query = `
            SELECT
                js.id,
                js.job_sheet_number,
                js.date_completed,
                js.km_reading,
                c.name AS customer_name,
                c.phone AS customer_phone,
                c.address AS customer_address,
                mk.name AS make,
                md.name AS model,
                v.year,
                v.car_number,
                v.vin,
                (
                    SELECT COALESCE(SUM((jsi.unit_price * jsi.quantity) + jsi.lube_charge + jsi.labour_charge), 0)
                    FROM job_sheet_items jsi WHERE jsi.job_sheet_id = js.id
                ) AS grand_total,
                (
                    SELECT COALESCE(SUM(jsi.unit_price * jsi.quantity), 0)
                    FROM job_sheet_items jsi WHERE jsi.job_sheet_id = js.id
                ) AS total_parts,
                (
                    SELECT COALESCE(SUM(jsi.lube_charge), 0)
                    FROM job_sheet_items jsi WHERE jsi.job_sheet_id = js.id
                ) AS total_lubes,
                (
                    SELECT COALESCE(SUM(jsi.labour_charge), 0)
                    FROM job_sheet_items jsi WHERE jsi.job_sheet_id = js.id
                ) AS total_labour,
                (
                    SELECT json_agg(json_build_object(
                        'master_item_id', jsi.master_item_id,
                        'name', mi.name,
                        'part_no', mi.part_no,
                        'quantity', jsi.quantity,
                        'unit_price', jsi.unit_price,
                        'lube_charge', jsi.lube_charge,
                        'labour_charge', jsi.labour_charge,
                        -- CRITICAL FIX: Expose the line totals directly for the React mapper
                        'line_parts', (jsi.unit_price * jsi.quantity),
                        'line_lubes', jsi.lube_charge,
                        'line_labour', jsi.labour_charge,
                        'line_total', (jsi.unit_price * jsi.quantity) + jsi.lube_charge + jsi.labour_charge
                    ))
                    FROM job_sheet_items jsi
                    JOIN master_items mi ON jsi.master_item_id = mi.id
                    WHERE jsi.job_sheet_id = js.id
                ) as items
            FROM job_sheets js
            JOIN customers c ON js.customer_id = c.id
            JOIN vehicles v ON js.vehicle_id = v.id
            JOIN makes mk ON v.make_id = mk.id
            JOIN models md ON v.model_id = md.id
            WHERE js.garage_id = $1
              AND js.status = 'Completed'
              AND js.is_deleted = FALSE
            ORDER BY js.date_completed DESC, js.id DESC;
        `;

        const { rows } = await db.query(query, [garageId]);
        res.status(200).json(rows);

    } catch (error) {
        console.error('Error fetching job sheets ready for invoicing:', error);
        res.status(500).json({ message: 'Server error while fetching job sheets.' });
    }
};


/**
 * @description Creates a new invoice from a completed job sheet.
 * @route POST /api/invoices
 * @access Private
 */
exports.createInvoice = async (req, res) => {
    const garageId = req.garageId;
    const { jobSheetId, dateIssued, discountType, discountValue, taxRate, notes } = req.body;

    // --- FIX: Removed incorrect console.log that caused ReferenceError ---
    // console.log(`[paymentController] recordPayment called for invoiceId: ${invoiceId}, garageId: ${garageId}`);

    // --- DEBUGGING LOGS FOR CREATE INVOICE ---
    console.log(`[createInvoice] Request received for jobSheetId: ${jobSheetId}, garageId: ${garageId}`);
    console.log(`[createInvoice] dateIssued: ${dateIssued}, discountType: ${discountType}, discountValue: ${discountValue}, taxRate: ${taxRate}`);
    // --- END DEBUGGING LOGS ---


    if (!jobSheetId) {
        return res.status(400).json({ message: 'Job Sheet ID is required to create an invoice.' });
    }

    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        // ======================================================
        // STEP 1: VALIDATE & FETCH THE JOB SHEET
        // ======================================================
        const jobSheetRes = await client.query(
            'SELECT * FROM job_sheets WHERE id = $1 AND garage_id = $2 AND is_deleted = FALSE',
            [jobSheetId, garageId]
        );

        if (jobSheetRes.rows.length === 0) {
            throw new Error('Job Sheet not found or you do not have permission to access it.');
        }

        const jobSheet = jobSheetRes.rows[0];
        console.log('[createInvoice] Fetched Job Sheet:', jobSheet); // DEBUG

        if (jobSheet.status !== 'Completed') {
            throw new Error(`Cannot create invoice. Job Sheet is not in 'Completed' state (current state: ${jobSheet.status}).`);
        }

        // ======================================================
        // STEP 2: CALCULATE FINAL INVOICE AMOUNTS
        // ======================================================
        const itemsTotalRes = await client.query(
            `SELECT COALESCE(SUM((unit_price * quantity) + lube_charge + labour_charge), 0) AS sub_total
             FROM job_sheet_items WHERE job_sheet_id = $1`,
            [jobSheetId]
        );
        const subTotal = parseFloat(itemsTotalRes.rows[0].sub_total) || 0;
        console.log('[createInvoice] Calculated Sub Total from Job Sheet Items:', subTotal); // DEBUG

        const finalDiscountValue = parseFloat(discountValue) || 0;
        const finalTaxRate = parseFloat(taxRate) || 0;
        console.log(`[createInvoice] Parsed Discount Value: ${finalDiscountValue}, Tax Rate: ${finalTaxRate}`); // DEBUG

        let discountAmount = 0;
        if (discountType === 'Percent') {
            discountAmount = subTotal * (finalDiscountValue / 100);
        } else { // 'Fixed'
            discountAmount = finalDiscountValue;
        }
        console.log('[createInvoice] Calculated Discount Amount:', discountAmount); // DEBUG

        const amountAfterDiscount = subTotal - discountAmount;
        console.log('[createInvoice] Amount After Discount:', amountAfterDiscount); // DEBUG

        const taxAmount = amountAfterDiscount * (finalTaxRate / 100);
        console.log('[createInvoice] Calculated Tax Amount:', taxAmount); // DEBUG

        const grandTotal = amountAfterDiscount + taxAmount;
        console.log('[createInvoice] FINAL Calculated Grand Total (before INSERT):', grandTotal); // DEBUG

        // ======================================================
        // STEP 3: CREATE THE INVOICE RECORD (Dynamic Numbering)
        // ======================================================
        const settingsRes = await client.query(
            `SELECT invoice_prefix, invoice_next_num FROM garages WHERE id = $1 FOR UPDATE`,
            [garageId]
        );
        const settings = settingsRes.rows[0] || {};
        const currentYear = new Date().getFullYear();
        const rawPrefix = settings.invoice_prefix || 'INV-';
        const dynamicPrefix = rawPrefix.replace('{YYYY}', currentYear);
        const nextNum = settings.invoice_next_num || 1;
        const paddedNumber = String(nextNum).padStart(4, '0');
        const invoiceNumber = `${dynamicPrefix}${paddedNumber}`;

        await client.query(
            `UPDATE garages SET invoice_next_num = COALESCE(invoice_next_num, 1) + 1 WHERE id = $1`,
            [garageId]
        );
        
        const dueDate = new Date(dateIssued);
        dueDate.setDate(dueDate.getDate() + 15);

        const invoiceInsertQuery = `
            INSERT INTO invoices (garage_id, invoice_number, job_sheet_id, customer_id, vehicle_id, date_issued, due_date, km_reading, discount_type, discount_value, tax_rate, grand_total, status, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id, invoice_number;
        `;
        
        const invoiceRes = await client.query(invoiceInsertQuery, [
            garageId,
            invoiceNumber,
            jobSheet.id, // Use jobSheet.id directly
            jobSheet.customer_id,
            jobSheet.vehicle_id,
            dateIssued,
            dueDate,
            jobSheet.km_reading,
            discountType,
            finalDiscountValue,
            finalTaxRate,
            grandTotal, // This is the value being inserted!
            'Pending',
            notes || ''
        ]);
        const newInvoice = invoiceRes.rows[0];
        // --- FIX: Corrected this log to use newInvoice data ---
        console.log(`[createInvoice] Successfully inserted new invoice with ID: ${newInvoice.id}, Number: ${newInvoice.invoice_number}`); // CORRECTED LOG

        // ======================================================
        // STEP 4: COPY ITEMS FROM JOB SHEET TO INVOICE
        // ======================================================
        const copyItemsQuery = `
            INSERT INTO invoice_items (invoice_id, master_item_id, quantity, unit_price, lube_charge, labour_charge)
            SELECT $1, master_item_id, quantity, unit_price, lube_charge, labour_charge
            FROM job_sheet_items
            WHERE job_sheet_id = $2;
        `;
        await client.query(copyItemsQuery, [newInvoice.id, jobSheetId]);
        
        // ======================================================
        // STEP 5: UPDATE THE JOB SHEET STATUS
        // ======================================================
        await client.query(
            "UPDATE job_sheets SET status = 'Invoiced' WHERE id = $1",
            [jobSheetId]
        );

        // ======================================================
        // STEP 6: COMMIT THE TRANSACTION
        // ======================================================
        await client.query('COMMIT');
        
        // Final response after successful creation
        res.status(201).json(newInvoice);

    } catch (error) {
        // ======================================================
        // CATCH BLOCK: ROLLBACK TRANSACTION ON FAILURE
        // ======================================================
        await client.query('ROLLBACK');
        console.error('Error during invoice creation transaction:', error);
        res.status(500).json({ message: error.message || 'Server error while creating the invoice.' });

    } finally {
        // ======================================================
        // FINALLY BLOCK: ALWAYS RELEASE THE CLIENT
        // ======================================================
        client.release();
    }
};


/**
 * @desc    Get all invoices for a garage
 * @route   GET /api/invoices
 */
exports.getAllInvoices = async (req, res) => {
    const garageId = req.garageId;
    const client = await db.getClient(); 
    
    try {
        const query = `
            SELECT 
                i.id,
                i.invoice_number,
                i.job_sheet_id,
                i.grand_total,
                i.status,
                i.date_issued,
                i.due_date,
                c.id AS customer_id,
                c.name AS customer_name,
                c.phone AS customer_phone,
                v.car_number AS vehicle_number,
                m.name AS vehicle_make,
                mo.name AS vehicle_model,
                COALESCE((SELECT SUM(amount_paid) FROM payments WHERE invoice_id = i.id), 0) AS amount_paid,
                
                -- 👉 THE FIX: This bundles all individual payment records into a JSON array for the Modal
                COALESCE(
                    (SELECT json_agg(
                        json_build_object(
                            'id', p.id::TEXT,
                            'amountPaid', p.amount_paid::NUMERIC,
                            'datePaid', TO_CHAR(p.date_paid, 'YYYY-MM-DD'),
                            'paymentMethod', p.payment_method,
                            'notes', p.notes
                        ) ORDER BY p.date_paid ASC
                    ) FROM payments p WHERE p.invoice_id = i.id), 
                    '[]'::json
                ) AS "paymentRecords"

            FROM invoices i
            JOIN customers c ON i.customer_id = c.id
            JOIN vehicles v ON i.vehicle_id = v.id
            JOIN makes m ON v.make_id = m.id
            JOIN models mo ON v.model_id = mo.id
            WHERE i.garage_id = $1 AND i.is_deleted = FALSE
            ORDER BY i.created_at DESC
        `;
        
        const { rows } = await client.query(query, [garageId]);
        
        res.status(200).json({ success: true, invoices: rows });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ success: false, message: 'Server error fetching invoices.' });
    } finally {
        if (client) client.release();
    }
};


/**
 * @description Fetches a single invoice by its ID, including all related data.
 * This is a secure endpoint that ensures the invoice belongs to the user's garage.
 * @route GET /api/invoices/:invoiceId
 * @access Private
 */
exports.getInvoiceById = async (req, res) => {
    const { invoiceId } = req.params;
    const garageId = req.garageId;

    try {
        const invoices = await getFullInvoiceWithPaymentsAndVehicleDetails(db, invoiceId, garageId);

        if (invoices.length === 0) {
            return res.status(404).json({ message: `Invoice with ID ${invoiceId} not found or you do not have permission to view it.` });
        }

        res.status(200).json(invoices[0]);

    } catch (error) {
        console.error(`Error fetching invoice ID ${invoiceId}:`, error);
        res.status(500).json({ message: 'Server error while fetching the invoice.' });
    }
};


/**
 * @description Hard Delete a single Invoice and revert Job Sheet status
 * @route DELETE /api/invoices/:id
 * @access Private
 */
exports.deleteInvoice = async (req, res) => {
    const { id } = req.params;
    const garageId = req.garageId;
    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        // 1. Fetch the invoice to get the associated Job Sheet ID
        const invRes = await client.query('SELECT job_sheet_id FROM invoices WHERE id = $1 AND garage_id = $2', [id, garageId]);
        if (invRes.rows.length === 0) {
            throw new Error('Invoice not found or already deleted.');
        }
        const jobSheetId = invRes.rows[0].job_sheet_id;

        // 2. Delete child records (Items and Payments)
        await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);
        await client.query('DELETE FROM payments WHERE invoice_id = $1', [id]);

        // 3. Delete the Invoice itself
        await client.query('DELETE FROM invoices WHERE id = $1', [id]);

        // 4. Revert the Job Sheet status back to 'Completed' so it can be re-invoiced if needed
        if (jobSheetId) {
            await client.query("UPDATE job_sheets SET status = 'Completed' WHERE id = $1", [jobSheetId]);
        }

        await client.query('COMMIT');
        res.status(200).json({ success: true, message: 'Invoice permanently deleted.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error hard deleting invoice:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error during deletion.' });
    } finally {
        client.release();
    }
};

/**
 * @description Hard Delete multiple Invoices by date range
 * @route POST /api/invoices/bulk-delete
 * @access Private
 */
exports.bulkDeleteInvoices = async (req, res) => {
    const garageId = req.garageId;
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Start date and end date are required.' });
    }

    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        // 1. Find all invoice IDs and their related Job Sheet IDs in this date range
        const findQuery = `
            SELECT id, job_sheet_id FROM invoices 
            WHERE garage_id = $1 
            AND DATE(date_issued) >= $2 
            AND DATE(date_issued) <= $3
        `;
        const { rows } = await client.query(findQuery, [garageId, startDate, endDate]);
        
        if (rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(200).json({ success: true, message: 'No invoices found in this date range.' });
        }

        const invoiceIds = rows.map(row => row.id);
        // Filter out nulls just in case
        const jobSheetIds = rows.map(row => row.job_sheet_id).filter(id => id != null); 

        // 2. Delete all child records (Items and Payments) linked to these invoices
        await client.query('DELETE FROM invoice_items WHERE invoice_id = ANY($1::int[])', [invoiceIds]);
        await client.query('DELETE FROM payments WHERE invoice_id = ANY($1::int[])', [invoiceIds]);

        // 3. Delete the invoices
        await client.query('DELETE FROM invoices WHERE id = ANY($1::int[])', [invoiceIds]);

        // 4. Revert the Job Sheet statuses back to 'Completed'
        if (jobSheetIds.length > 0) {
            await client.query("UPDATE job_sheets SET status = 'Completed' WHERE id = ANY($1::int[])", [jobSheetIds]);
        }

        await client.query('COMMIT');
        res.status(200).json({ success: true, message: `Successfully deleted ${invoiceIds.length} invoices.` });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error bulk deleting invoices:', error);
        res.status(500).json({ success: false, message: 'Server error during bulk deletion.' });
    } finally {
        client.release();
    }
};