// backend/controllers/paymentController.js

const db = require('../config/db'); // Your database connection pool from pg

/**
 * Helper function to fetch a complete invoice with its payment records.
 * Used after any payment action to return the up-to-date invoice state to the frontend.
 *
 * @param {object} clientId - A database client (e.g., from db.query or a transaction client).
 * @param {number} invoiceId - The ID of the specific invoice to fetch.
 * @param {number} garageId - The ID of the garage to ensure ownership.
 * @returns {Promise<object|null>} The detailed invoice object, or null if not found.
 */
async function getFullInvoiceWithPayments(clientId, invoiceId, garageId) {
    const res = await clientId.query(
        `SELECT
            i.id,
            i.invoice_number,
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
            v.car_number AS vehicle_number,
            m.name AS vehicle_make,
            mod.name AS vehicle_model,
            -- Payment records aggregation: Explicitly cast 'id' to TEXT and 'amount_paid' to NUMERIC.
            COALESCE(json_agg(json_build_object(
                'id', p.id::TEXT,
                'amountPaid', p.amount_paid::NUMERIC,
                'datePaid', TO_CHAR(p.date_paid, 'YYYY-MM-DD'),
                'paymentMethod', p.payment_method,
                'notes', p.notes,
                'createdAt', p.created_at,
                'updatedAt', p.updated_at
            ) ORDER BY p.date_paid ASC, p.created_at ASC) FILTER (WHERE p.id IS NOT NULL), '[]') AS paymentRecords
         FROM invoices i
         JOIN customers c ON i.customer_id = c.id
         JOIN vehicles v ON i.vehicle_id = v.id
         JOIN makes m ON v.make_id = m.id
         JOIN models mod ON v.model_id = mod.id
         LEFT JOIN payments p ON i.id = p.invoice_id
         WHERE i.id = $1 AND i.garage_id = $2 AND i.is_deleted = FALSE
         GROUP BY i.id, c.name, c.phone, v.car_number, m.name, mod.name`,
        [invoiceId, garageId]
    );
    return res.rows[0] || null;
}

/**
 * Helper function to calculate and update an invoice's status.
 * Based on total payments and due date.
 *
 * @param {object} clientId - A database client (e.g., a transaction client).
 * @param {number} invoiceId - The ID of the invoice to update.
 * @param {number} grandTotal - The total amount of the invoice.
 * @param {string} dueDate - The due date of the invoice (ISO string).
 * @param {number} garageId - The ID of the garage.
 * @returns {Promise<void>}
 */
async function calculateAndSetInvoiceStatus(clientId, invoiceId, grandTotal, dueDate, garageId) {
    const paymentsSumRes = await clientId.query(
        `SELECT COALESCE(SUM(amount_paid), 0) AS total_paid
         FROM payments
         WHERE invoice_id = $1 AND garage_id = $2`,
        [invoiceId, garageId]
    );
    const totalPaid = parseFloat(paymentsSumRes.rows[0].total_paid);

    let newStatus;
    if (totalPaid >= grandTotal) {
        newStatus = 'Paid';
    } else if (totalPaid > 0) {
        newStatus = 'Partially Paid';
    } else {
        if (new Date(dueDate) < new Date()) {
            newStatus = 'Overdue';
        } else {
            newStatus = 'Pending';
        }
    }

    const currentInvoiceRes = await clientId.query(
        `SELECT status FROM invoices WHERE id = $1`, [invoiceId]
    );
    if (currentInvoiceRes.rows[0].status !== newStatus) {
        await clientId.query(
            `UPDATE invoices SET status = $1, updated_at = NOW() WHERE id = $2`,
            [newStatus, invoiceId]
        );
    }
}

/**
 * @desc    Records a new payment for a specific invoice.
 * @route   POST /api/payments/:invoiceId
 * @access  Private (Auth protected)
 */
exports.recordPayment = async (req, res) => {
    const { invoiceId } = req.params;
    const { amountPaid, datePaid, paymentMethod, notes } = req.body;
    const garageId = req.garageId; // Assuming authorizeGarage middleware sets req.garageId

    if (!invoiceId || !amountPaid || !datePaid) {
        return res.status(400).json({ message: 'Invoice ID, amount paid, and date paid are required.' });
    }
    const paidAmountFloat = parseFloat(amountPaid);
    if (isNaN(paidAmountFloat) || paidAmountFloat <= 0) {
        return res.status(400).json({ message: 'Amount paid must be a positive number.' });
    }

    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        const invoiceValidateQuery = `SELECT id, grand_total, due_date, is_deleted FROM invoices WHERE id = $1 AND garage_id = $2`;
        const invoiceRes = await client.query(invoiceValidateQuery, [invoiceId, garageId]);

        if (invoiceRes.rows.length === 0 || invoiceRes.rows[0].is_deleted === true) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Invoice not found or unauthorized.' });
        }
        const { grand_total: grandTotal, due_date: dueDate } = invoiceRes.rows[0];

        await client.query(
            `INSERT INTO payments (garage_id, invoice_id, amount_paid, date_paid, payment_method, notes)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [garageId, invoiceId, paidAmountFloat, datePaid, paymentMethod || 'Other', notes || null]
        );

        await calculateAndSetInvoiceStatus(client, invoiceId, parseFloat(grandTotal), dueDate, garageId);

        await client.query('COMMIT');

        const updatedInvoice = await getFullInvoiceWithPayments(db, invoiceId, garageId);
        if (!updatedInvoice) {
            return res.status(500).json({ message: 'Failed to retrieve updated invoice data after recording payment.' });
        }
        res.status(201).json({
            message: 'Payment recorded and invoice updated successfully.',
            invoice: updatedInvoice
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error recording payment:', error); // Keep error logging for server-side
        res.status(500).json({ message: 'Failed to record payment.', error: error.message });
    } finally {
        client.release();
    }
};

/**
 * @desc    Updates an existing payment record for an invoice.
 * @route   PUT /api/payments/:invoiceId/payments/:paymentId
 * @access  Private (Auth protected)
 */
exports.updatePayment = async (req, res) => {
    const { invoiceId, paymentId } = req.params;
    const { amountPaid, datePaid, paymentMethod, notes } = req.body;
    const garageId = req.garageId; // Assuming authorizeGarage middleware sets req.garageId

    if (!invoiceId || !paymentId || !amountPaid || !datePaid) {
        return res.status(400).json({ message: 'Invoice ID, Payment ID, amount paid, and date paid are required.' });
    }
    const paidAmountFloat = parseFloat(amountPaid);
    if (isNaN(paidAmountFloat) || paidAmountFloat <= 0) {
        return res.status(400).json({ message: 'Amount paid must be a positive number.' });
    }

    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        const paymentCheckQuery = `SELECT invoice_id FROM payments WHERE id = $1 AND invoice_id = $2 AND garage_id = $3`;
        const paymentCheckRes = await client.query(paymentCheckQuery, [paymentId, invoiceId, garageId]);

        if (paymentCheckRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Payment not found or not associated with this invoice/garage, or unauthorized.' });
        }

        await client.query(
            `UPDATE payments
             SET amount_paid = $1, date_paid = $2, payment_method = $3, notes = $4, updated_at = NOW()
             WHERE id = $5 AND invoice_id = $6 AND garage_id = $7`,
            [paidAmountFloat, datePaid, paymentMethod || 'Other', notes || null, paymentId, invoiceId, garageId]
        );

        const invoiceRes = await client.query(
            `SELECT grand_total, due_date FROM invoices WHERE id = $1 AND garage_id = $2`,
            [invoiceId, garageId]
        );
        const { grand_total: grandTotal, due_date: dueDate } = invoiceRes.rows[0];

        await calculateAndSetInvoiceStatus(client, invoiceId, parseFloat(grandTotal), dueDate, garageId);

        await client.query('COMMIT');

        const updatedInvoice = await getFullInvoiceWithPayments(db, invoiceId, garageId);
        if (!updatedInvoice) {
            return res.status(500).json({ message: 'Failed to retrieve updated invoice data after updating payment.' });
        }
        res.status(200).json({
            message: 'Payment updated and invoice status recalculated successfully.',
            invoice: updatedInvoice
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating payment:', error); // Keep error logging for server-side
        res.status(500).json({ message: 'Failed to update payment.', error: error.message });
    } finally {
        client.release();
    }
};

/**
 * @desc    Deletes a payment record for an invoice.
 * @route   DELETE /api/payments/:invoiceId/payments/:paymentId
 * @access  Private (Auth protected)
 */
exports.deletePayment = async (req, res) => {
    const { invoiceId, paymentId } = req.params;
    const garageId = req.garageId; // Assuming authorizeGarage middleware sets req.garageId

    if (!invoiceId || !paymentId) {
        return res.status(400).json({ message: 'Invoice ID and Payment ID are required.' });
    }

    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        const paymentCheckQuery = `SELECT invoice_id FROM payments WHERE id = $1 AND invoice_id = $2 AND garage_id = $3`;
        const paymentCheckRes = await client.query(paymentCheckQuery, [paymentId, invoiceId, garageId]);

        if (paymentCheckRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Payment not found or not associated with this invoice/garage, or unauthorized.' });
        }

        await client.query(
            `DELETE FROM payments WHERE id = $1 AND invoice_id = $2 AND garage_id = $3`,
            [paymentId, invoiceId, garageId]
        );

        const invoiceRes = await client.query(
            `SELECT grand_total, due_date FROM invoices WHERE id = $1 AND garage_id = $2`,
            [invoiceId, garageId]
        );
        const { grand_total: grandTotal, due_date: dueDate } = invoiceRes.rows[0];

        await calculateAndSetInvoiceStatus(client, invoiceId, parseFloat(grandTotal), dueDate, garageId);

        await client.query('COMMIT');

        const updatedInvoice = await getFullInvoiceWithPayments(db, invoiceId, garageId);
        if (!updatedInvoice) {
            return res.status(500).json({ message: 'Failed to retrieve updated invoice data after deleting payment.' });
        }
        res.status(200).json({
            message: 'Payment deleted and invoice status recalculated successfully.',
            invoice: updatedInvoice
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting payment:', error); // Keep error logging for server-side
        res.status(500).json({ message: 'Failed to delete payment.', error: error.message });
    } finally {
        client.release();
    }
};