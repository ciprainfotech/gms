const db = require('../config/db');

exports.getSupplierPayments = async (req, res) => {
    const garageId = req.garageId;
    const { supplierId, billId } = req.query;

    let filters = '';
    const params = [garageId];
    let paramIndex = 2;

    if (supplierId) {
        filters += ` AND supplier_id = $${paramIndex++}`;
        params.push(supplierId);
    }
    if (billId) {
        filters += ` AND purchase_bill_id = $${paramIndex++}`;
        params.push(billId);
    }

    try {
        const query = `
            SELECT id, supplier_id AS "supplierId", purchase_bill_id AS "purchaseBillId", amount, payment_method AS "paymentMethod", TO_CHAR(payment_date,'YYYY-MM-DD') AS "paymentDate", reference_no AS "referenceNo", notes 
            FROM supplier_payments 
            WHERE garage_id = $1 ${filters}
            ORDER BY payment_date DESC
        `;
        const { rows } = await db.query(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching supplier payments:', error);
        res.status(500).json({ message: 'Server error while fetching supplier payments.' });
    }
};

exports.createSupplierPayment = async (req, res) => {
    const garageId = req.garageId;
    const { supplierId, purchaseBillId, amount, paymentMethod, paymentDate, referenceNo, notes } = req.body;

    if (!supplierId || !amount || amount <= 0 || !paymentDate) {
        return res.status(400).json({ message: 'Supplier ID, positive amount, and payment date are required.' });
    }

    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        const insertQuery = `
            INSERT INTO supplier_payments (garage_id, supplier_id, purchase_bill_id, amount, payment_method, payment_date, reference_no, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, supplier_id AS "supplierId", purchase_bill_id AS "purchaseBillId", amount, payment_method AS "paymentMethod", TO_CHAR(payment_date,'YYYY-MM-DD') AS "paymentDate", reference_no AS "referenceNo", notes
        `;
        const { rows } = await client.query(insertQuery, [garageId, supplierId, purchaseBillId || null, amount, paymentMethod, paymentDate, referenceNo, notes]);
        const newPayment = rows[0];

        if (purchaseBillId) {
            const billRes = await client.query(`SELECT net_amount FROM purchase_bills WHERE id = $1 AND garage_id = $2`, [purchaseBillId, garageId]);
            if (billRes.rows.length > 0) {
                const netAmount = parseFloat(billRes.rows[0].net_amount);
                const paymentsRes = await client.query(`SELECT SUM(amount) AS "totalPaid" FROM supplier_payments WHERE purchase_bill_id = $1`, [purchaseBillId]);
                const totalPaid = parseFloat(paymentsRes.rows[0].totalPaid || 0);
                
                let paymentStatus = 'Unpaid';
                if (totalPaid >= netAmount) paymentStatus = 'Paid';
                else if (totalPaid > 0) paymentStatus = 'Partial';

                await client.query(`UPDATE purchase_bills SET payment_status = $1 WHERE id = $2`, [paymentStatus, purchaseBillId]);
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ success: true, payment: newPayment });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating supplier payment:', error);
        res.status(500).json({ message: 'Server error while creating supplier payment.' });
    } finally {
        client.release();
    }
};

exports.deleteSupplierPayment = async (req, res) => {
    const garageId = req.garageId;
    const { id } = req.params;

    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        const paymentRes = await client.query(`SELECT purchase_bill_id, supplier_id FROM supplier_payments WHERE id = $1 AND garage_id = $2`, [id, garageId]);
        if (paymentRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Payment not found.' });
        }
        
        const purchaseBillId = paymentRes.rows[0].purchase_bill_id;

        await client.query(`DELETE FROM supplier_payments WHERE id = $1 AND garage_id = $2`, [id, garageId]);

        if (purchaseBillId) {
            const billRes = await client.query(`SELECT net_amount FROM purchase_bills WHERE id = $1 AND garage_id = $2`, [purchaseBillId, garageId]);
            if (billRes.rows.length > 0) {
                const netAmount = parseFloat(billRes.rows[0].net_amount);
                const paymentsRes = await client.query(`SELECT SUM(amount) AS "totalPaid" FROM supplier_payments WHERE purchase_bill_id = $1`, [purchaseBillId]);
                const totalPaid = parseFloat(paymentsRes.rows[0].totalPaid || 0);
                
                let paymentStatus = 'Unpaid';
                if (totalPaid >= netAmount) paymentStatus = 'Paid';
                else if (totalPaid > 0) paymentStatus = 'Partial';

                await client.query(`UPDATE purchase_bills SET payment_status = $1 WHERE id = $2`, [paymentStatus, purchaseBillId]);
            }
        }

        await client.query('COMMIT');
        res.status(200).json({ success: true, message: 'Payment deleted successfully.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting supplier payment:', error);
        res.status(500).json({ message: 'Server error while deleting supplier payment.' });
    } finally {
        client.release();
    }
};
