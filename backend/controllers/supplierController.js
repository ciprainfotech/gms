const db = require('../config/db');

exports.getSuppliers = async (req, res) => {
    const garageId = req.garageId;
    if (!garageId) return res.status(401).json({ message: 'Not authorized.' });

    try {
        const query = `
            SELECT s.id, s.name, s.contact_person AS "contactPerson", s.phone, s.email, s.address, s.gst_number AS "gstNumber", s.city, s.credit_days AS "creditDays", s.opening_balance AS "openingBalance", s.notes,
            COALESCE((SELECT SUM(pb.net_amount) FROM purchase_bills pb WHERE pb.supplier_id = s.id AND pb.garage_id = $1 AND pb.is_deleted = FALSE), 0) AS "totalPurchased",
            COALESCE((SELECT SUM(sp.amount) FROM supplier_payments sp WHERE sp.supplier_id = s.id AND sp.garage_id = $1), 0) AS "totalPaid",
            COALESCE(s.opening_balance, 0) + COALESCE((SELECT SUM(pb.net_amount) FROM purchase_bills pb WHERE pb.supplier_id = s.id AND pb.garage_id = $1 AND pb.is_deleted = FALSE), 0) - COALESCE((SELECT SUM(sp.amount) FROM supplier_payments sp WHERE sp.supplier_id = s.id AND sp.garage_id = $1), 0) AS "outstandingBalance"
            FROM suppliers s WHERE s.garage_id = $1 AND s.is_deleted = FALSE ORDER BY s.name ASC
        `;
        const { rows } = await db.query(query, [garageId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).json({ message: 'Server error while fetching suppliers.' });
    }
};

exports.getSupplierById = async (req, res) => {
    const garageId = req.garageId;
    const { id } = req.params;

    try {
        const supplierRes = await db.query(`
            SELECT s.id, s.name, s.contact_person AS "contactPerson", s.phone, s.email, s.address, s.gst_number AS "gstNumber", s.city, s.credit_days AS "creditDays", s.opening_balance AS "openingBalance", s.notes,
            COALESCE((SELECT SUM(pb.net_amount) FROM purchase_bills pb WHERE pb.supplier_id = s.id AND pb.garage_id = $1 AND pb.is_deleted = FALSE), 0) AS "totalPurchased",
            COALESCE((SELECT SUM(sp.amount) FROM supplier_payments sp WHERE sp.supplier_id = s.id AND sp.garage_id = $1), 0) AS "totalPaid",
            COALESCE(s.opening_balance, 0) + COALESCE((SELECT SUM(pb.net_amount) FROM purchase_bills pb WHERE pb.supplier_id = s.id AND pb.garage_id = $1 AND pb.is_deleted = FALSE), 0) - COALESCE((SELECT SUM(sp.amount) FROM supplier_payments sp WHERE sp.supplier_id = s.id AND sp.garage_id = $1), 0) AS "outstandingBalance"
            FROM suppliers s WHERE s.id = $2 AND s.garage_id = $1 AND s.is_deleted = FALSE
        `, [garageId, id]);

        if (supplierRes.rows.length === 0) return res.status(404).json({ message: 'Supplier not found.' });
        const supplier = supplierRes.rows[0];

        const billsRes = await db.query(`
            SELECT pb.id, pb.bill_number AS "billNumber", TO_CHAR(pb.bill_date,'YYYY-MM-DD') AS date, pb.net_amount AS amount, pb.payment_status AS "paymentStatus", pb.notes, 'bill' AS type 
            FROM purchase_bills pb WHERE pb.supplier_id = $1 AND pb.garage_id = $2 AND pb.is_deleted = FALSE
        `, [id, garageId]);

        const paymentsRes = await db.query(`
            SELECT sp.id, TO_CHAR(sp.payment_date,'YYYY-MM-DD') AS date, sp.amount, sp.payment_method AS "paymentMethod", sp.reference_no AS "referenceNo", sp.notes, 'payment' AS type, sp.purchase_bill_id AS "linkedBillId" 
            FROM supplier_payments sp WHERE sp.supplier_id = $1 AND sp.garage_id = $2 ORDER BY sp.payment_date DESC
        `, [id, garageId]);

        const merged = [...billsRes.rows, ...paymentsRes.rows].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50);

        res.status(200).json({ 
            supplier, 
            ledger: merged,
            totalPurchased: supplier.totalPurchased,
            totalPaid: supplier.totalPaid,
            outstandingBalance: supplier.outstandingBalance
        });
    } catch (error) {
        console.error('Error fetching supplier details:', error);
        res.status(500).json({ message: 'Server error while fetching supplier details.' });
    }
};

exports.createSupplier = async (req, res) => {
    const garageId = req.garageId;
    const { name, contactPerson, phone, email, address, gstNumber, city, creditDays, openingBalance, notes } = req.body;

    if (!name) return res.status(400).json({ message: 'Supplier name is required.' });

    try {
        const query = `
            INSERT INTO suppliers (garage_id, name, contact_person, phone, email, address, gst_number, city, credit_days, opening_balance, notes) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
            RETURNING id, name, contact_person AS "contactPerson", phone, email, address, gst_number AS "gstNumber", city, credit_days AS "creditDays", opening_balance AS "openingBalance", notes
        `;
        const { rows } = await db.query(query, [garageId, name, contactPerson, phone, email, address, gstNumber, city, creditDays || 0, openingBalance || 0, notes]);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creating supplier:', error);
        res.status(500).json({ message: 'Server error while creating supplier.' });
    }
};

exports.updateSupplier = async (req, res) => {
    const garageId = req.garageId;
    const { id } = req.params;
    const { name, contactPerson, phone, email, address, gstNumber, city, creditDays, openingBalance, notes } = req.body;

    if (!name) return res.status(400).json({ message: 'Supplier name is required.' });

    try {
        const query = `
            UPDATE suppliers 
            SET name = $1, contact_person = $2, phone = $3, email = $4, address = $5, gst_number = $6, city = $7, credit_days = $8, opening_balance = $9, notes = $10, updated_at = NOW() 
            WHERE id = $11 AND garage_id = $12 AND is_deleted = FALSE
            RETURNING id, name, contact_person AS "contactPerson", phone, email, address, gst_number AS "gstNumber", city, credit_days AS "creditDays", opening_balance AS "openingBalance", notes
        `;
        const { rows } = await db.query(query, [name, contactPerson, phone, email, address, gstNumber, city, creditDays || 0, openingBalance || 0, notes, id, garageId]);

        if (rows.length === 0) return res.status(404).json({ message: 'Supplier not found.' });
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error updating supplier:', error);
        res.status(500).json({ message: 'Server error while updating supplier.' });
    }
};

exports.deleteSupplier = async (req, res) => {
    const garageId = req.garageId;
    const { id } = req.params;

    try {
        const supplierRes = await db.query(`
            SELECT COALESCE(opening_balance, 0) + COALESCE((SELECT SUM(pb.net_amount) FROM purchase_bills pb WHERE pb.supplier_id = s.id AND pb.garage_id = $1 AND pb.is_deleted = FALSE), 0) - COALESCE((SELECT SUM(sp.amount) FROM supplier_payments sp WHERE sp.supplier_id = s.id AND sp.garage_id = $1), 0) AS "outstandingBalance"
            FROM suppliers s WHERE s.id = $2 AND s.garage_id = $1 AND s.is_deleted = FALSE
        `, [garageId, id]);

        if (supplierRes.rows.length === 0) return res.status(404).json({ message: 'Supplier not found.' });
        
        if (parseFloat(supplierRes.rows[0].outstandingBalance) > 0) {
            return res.status(400).json({ message: 'Cannot delete supplier with outstanding balance.' });
        }

        const query = `UPDATE suppliers SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND garage_id = $2 RETURNING id`;
        await db.query(query, [id, garageId]);

        res.status(200).json({ success: true, message: 'Supplier deleted successfully.' });
    } catch (error) {
        console.error('Error deleting supplier:', error);
        res.status(500).json({ message: 'Server error while deleting supplier.' });
    }
};