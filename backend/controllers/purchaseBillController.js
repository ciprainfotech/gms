const db = require('../config/db');

exports.getPurchaseBills = async (req, res) => {
    const garageId = req.garageId;
    const { supplierId, dateFrom, dateTo, paymentStatus, page = 1, pageSize = 20 } = req.query;

    let filters = '';
    const params = [garageId];
    let paramIndex = 2;

    if (supplierId) {
        filters += ` AND pb.supplier_id = $${paramIndex++}`;
        params.push(supplierId);
    }
    if (dateFrom) {
        filters += ` AND pb.bill_date >= $${paramIndex++}`;
        params.push(dateFrom);
    }
    if (dateTo) {
        filters += ` AND pb.bill_date <= $${paramIndex++}`;
        params.push(dateTo);
    }
    if (paymentStatus) {
        filters += ` AND pb.payment_status = $${paramIndex++}`;
        params.push(paymentStatus);
    }

    const limit = parseInt(pageSize) || 20;
    const offset = (parseInt(page) - 1) * limit;

    try {
        const countQuery = `SELECT COUNT(*) FROM purchase_bills pb WHERE pb.garage_id = $1 AND pb.is_deleted = FALSE ${filters}`;
        const countRes = await db.query(countQuery, params);
        const totalCount = parseInt(countRes.rows[0].count);

        const query = `
            SELECT pb.id, pb.bill_number AS "billNumber", TO_CHAR(pb.bill_date,'YYYY-MM-DD') AS "billDate", pb.total_amount AS "totalAmount", pb.discount_amount AS "discountAmount", pb.tax_amount AS "taxAmount", pb.net_amount AS "netAmount", TO_CHAR(pb.due_date,'YYYY-MM-DD') AS "dueDate", pb.payment_status AS "paymentStatus", pb.notes, pb.created_at AS "createdAt", s.id AS "supplierId", s.name AS "supplierName",
            COALESCE((SELECT SUM(sp.amount) FROM supplier_payments sp WHERE sp.purchase_bill_id = pb.id), 0) AS "amountPaid",
            pb.net_amount - COALESCE((SELECT SUM(sp.amount) FROM supplier_payments sp WHERE sp.purchase_bill_id = pb.id), 0) AS "amountDue"
            FROM purchase_bills pb LEFT JOIN suppliers s ON pb.supplier_id = s.id 
            WHERE pb.garage_id = $1 AND pb.is_deleted = FALSE ${filters}
            ORDER BY pb.bill_date DESC, pb.created_at DESC 
            LIMIT $${paramIndex++} OFFSET $${paramIndex}
        `;
        params.push(limit, offset);

        const { rows } = await db.query(query, params);
        res.status(200).json({ bills: rows, totalCount, page: parseInt(page), pageSize: limit });
    } catch (error) {
        console.error('Error fetching purchase bills:', error);
        res.status(500).json({ message: 'Server error while fetching purchase bills.' });
    }
};

exports.getPurchaseBillById = async (req, res) => {
    const garageId = req.garageId;
    const { id } = req.params;

    try {
        const query = `
            SELECT pb.id, pb.bill_number AS "billNumber", TO_CHAR(pb.bill_date,'YYYY-MM-DD') AS "billDate", pb.total_amount AS "totalAmount", pb.discount_amount AS "discountAmount", pb.tax_amount AS "taxAmount", pb.net_amount AS "netAmount", TO_CHAR(pb.due_date,'YYYY-MM-DD') AS "dueDate", pb.payment_status AS "paymentStatus", pb.notes, pb.created_at AS "createdAt", s.id AS "supplierId", s.name AS "supplierName",
            COALESCE((SELECT SUM(sp.amount) FROM supplier_payments sp WHERE sp.purchase_bill_id = pb.id), 0) AS "amountPaid",
            pb.net_amount - COALESCE((SELECT SUM(sp.amount) FROM supplier_payments sp WHERE sp.purchase_bill_id = pb.id), 0) AS "amountDue"
            FROM purchase_bills pb LEFT JOIN suppliers s ON pb.supplier_id = s.id 
            WHERE pb.id = $1 AND pb.garage_id = $2 AND pb.is_deleted = FALSE
        `;
        const { rows } = await db.query(query, [id, garageId]);

        if (rows.length === 0) return res.status(404).json({ message: 'Purchase bill not found.' });

        const itemsQuery = `
            SELECT pbi.id, pbi.master_item_id AS "masterItemId", COALESCE(pbi.item_name, mi.name) AS "itemName", COALESCE(pbi.item_part_no, mi.part_no) AS "partNo", pbi.quantity, pbi.purchase_price AS "purchasePrice", pbi.line_total AS "lineTotal"
            FROM purchase_bill_items pbi LEFT JOIN master_items mi ON pbi.master_item_id = mi.id 
            WHERE pbi.purchase_bill_id = $1
        `;
        const itemsRes = await db.query(itemsQuery, [id]);

        const paymentsQuery = `SELECT * FROM supplier_payments WHERE purchase_bill_id = $1 ORDER BY payment_date ASC`;
        const paymentsRes = await db.query(paymentsQuery, [id]);

        res.status(200).json({
            ...rows[0],
            items: itemsRes.rows,
            payments: paymentsRes.rows
        });
    } catch (error) {
        console.error('Error fetching purchase bill details:', error);
        res.status(500).json({ message: 'Server error while fetching purchase bill details.' });
    }
};

exports.getPurchaseSummary = async (req, res) => {
    const garageId = req.garageId;

    try {
        const inventoryRes = await db.query(`
            SELECT 
                COALESCE(SUM(stock_qty * cost_price), 0) AS "totalInventoryValue",
                COUNT(*) AS "totalItems",
                COUNT(CASE WHEN stock_qty > 0 AND stock_qty < 10 THEN 1 END) AS "lowStockItems",
                COUNT(CASE WHEN stock_qty IS NULL OR stock_qty = 0 THEN 1 END) AS "outOfStockItems"
            FROM master_items WHERE garage_id = $1 AND is_deleted = FALSE AND type = 'Spare'
        `, [garageId]);

        const purchaseRes = await db.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN date_trunc('month', bill_date) = date_trunc('month', CURRENT_DATE) THEN net_amount ELSE 0 END), 0) AS "totalPurchasedThisMonth",
                COALESCE(SUM(net_amount), 0) AS "totalPurchasedAllTime"
            FROM purchase_bills WHERE garage_id = $1 AND is_deleted = FALSE
        `, [garageId]);

        const outstandingRes = await db.query(`
            SELECT COALESCE(SUM(
                COALESCE(opening_balance, 0) + 
                COALESCE((SELECT SUM(pb.net_amount) FROM purchase_bills pb WHERE pb.supplier_id = suppliers.id AND pb.garage_id = $1 AND pb.is_deleted = FALSE), 0) - 
                COALESCE((SELECT SUM(sp.amount) FROM supplier_payments sp WHERE sp.supplier_id = suppliers.id AND sp.garage_id = $1), 0)
            ), 0) AS "totalOutstanding"
            FROM suppliers WHERE garage_id = $1 AND is_deleted = FALSE
        `, [garageId]);

        res.status(200).json({
            totalInventoryValue: parseFloat(inventoryRes.rows[0].totalInventoryValue),
            totalItems: parseInt(inventoryRes.rows[0].totalItems),
            lowStockItems: parseInt(inventoryRes.rows[0].lowStockItems),
            outOfStockItems: parseInt(inventoryRes.rows[0].outOfStockItems),
            totalPurchasedThisMonth: parseFloat(purchaseRes.rows[0].totalPurchasedThisMonth),
            totalPurchasedAllTime: parseFloat(purchaseRes.rows[0].totalPurchasedAllTime),
            totalOutstanding: parseFloat(outstandingRes.rows[0].totalOutstanding)
        });
    } catch (error) {
        console.error('Error fetching purchase summary:', error);
        res.status(500).json({ message: 'Server error while fetching purchase summary.' });
    }
};

exports.createPurchaseBill = async (req, res) => {
    const garageId = req.garageId;
    const { supplierId, billNumber, billDate, dueDate, notes, discountAmount, taxAmount, items } = req.body;

    if (!supplierId || !items || items.length === 0) {
        return res.status(400).json({ message: 'Supplier and items are required.' });
    }

    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        let totalAmount = 0;
        for (const item of items) {
            totalAmount += parseFloat(item.quantity) * parseFloat(item.purchasePrice);
        }
        const netAmount = totalAmount - (parseFloat(discountAmount) || 0) + (parseFloat(taxAmount) || 0);

        const billQuery = `
            INSERT INTO purchase_bills (garage_id, supplier_id, bill_number, bill_date, due_date, notes, discount_amount, tax_amount, total_amount, net_amount, payment_status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Unpaid')
            RETURNING id, bill_number AS "billNumber", net_amount AS "netAmount"
        `;
        const billRes = await client.query(billQuery, [garageId, supplierId, billNumber, billDate, dueDate, notes, discountAmount || 0, taxAmount || 0, totalAmount, netAmount]);
        const bill = billRes.rows[0];

        for (const item of items) {
            const itemRes = await client.query(`SELECT name, part_no FROM master_items WHERE id = $1 AND garage_id = $2`, [item.masterItemId, garageId]);
            if (itemRes.rows.length === 0) throw new Error(`Master item ${item.masterItemId} not found`);
            const { name, part_no } = itemRes.rows[0];
            const lineTotal = parseFloat(item.quantity) * parseFloat(item.purchasePrice);

            await client.query(`
                INSERT INTO purchase_bill_items (purchase_bill_id, master_item_id, item_name, item_part_no, quantity, purchase_price, line_total)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [bill.id, item.masterItemId, name, part_no, item.quantity, item.purchasePrice, lineTotal]);

            await client.query(`
                UPDATE master_items SET stock_qty = COALESCE(stock_qty, 0) + $1, cost_price = $2 WHERE id = $3 AND garage_id = $4
            `, [item.quantity, item.purchasePrice, item.masterItemId, garageId]);
        }

        await client.query('COMMIT');
        res.status(201).json({ success: true, bill });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating purchase bill:', error);
        res.status(500).json({ message: 'Server error while creating purchase bill.', error: error.message });
    } finally {
        client.release();
    }
};

exports.updatePurchaseBill = async (req, res) => {
    const garageId = req.garageId;
    const { id } = req.params;
    const { supplierId, billNumber, billDate, dueDate, notes, discountAmount, taxAmount, items } = req.body;

    if (!supplierId || !items || items.length === 0) {
        return res.status(400).json({ message: 'Supplier and items are required.' });
    }

    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        const oldItemsRes = await client.query(`SELECT master_item_id, quantity FROM purchase_bill_items WHERE purchase_bill_id = $1`, [id]);
        for (const oldItem of oldItemsRes.rows) {
            await client.query(`
                UPDATE master_items SET stock_qty = COALESCE(stock_qty, 0) - $1 WHERE id = $2 AND garage_id = $3
            `, [oldItem.quantity, oldItem.master_item_id, garageId]);
        }

        await client.query(`DELETE FROM purchase_bill_items WHERE purchase_bill_id = $1`, [id]);

        let totalAmount = 0;
        for (const item of items) {
            totalAmount += parseFloat(item.quantity) * parseFloat(item.purchasePrice);
        }
        const netAmount = totalAmount - (parseFloat(discountAmount) || 0) + (parseFloat(taxAmount) || 0);

        await client.query(`
            UPDATE purchase_bills 
            SET supplier_id = $1, bill_number = $2, bill_date = $3, due_date = $4, notes = $5, discount_amount = $6, tax_amount = $7, total_amount = $8, net_amount = $9, updated_at = NOW()
            WHERE id = $10 AND garage_id = $11
        `, [supplierId, billNumber, billDate, dueDate, notes, discountAmount || 0, taxAmount || 0, totalAmount, netAmount, id, garageId]);

        for (const item of items) {
            const itemRes = await client.query(`SELECT name, part_no FROM master_items WHERE id = $1 AND garage_id = $2`, [item.masterItemId, garageId]);
            if (itemRes.rows.length === 0) throw new Error(`Master item ${item.masterItemId} not found`);
            const { name, part_no } = itemRes.rows[0];
            const lineTotal = parseFloat(item.quantity) * parseFloat(item.purchasePrice);

            await client.query(`
                INSERT INTO purchase_bill_items (purchase_bill_id, master_item_id, item_name, item_part_no, quantity, purchase_price, line_total)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [id, item.masterItemId, name, part_no, item.quantity, item.purchasePrice, lineTotal]);

            await client.query(`
                UPDATE master_items SET stock_qty = COALESCE(stock_qty, 0) + $1, cost_price = $2 WHERE id = $3 AND garage_id = $4
            `, [item.quantity, item.purchasePrice, item.masterItemId, garageId]);
        }

        const paymentsRes = await client.query(`SELECT SUM(amount) AS "totalPaid" FROM supplier_payments WHERE purchase_bill_id = $1`, [id]);
        const totalPaid = parseFloat(paymentsRes.rows[0].totalPaid || 0);
        let paymentStatus = 'Unpaid';
        if (totalPaid >= netAmount) paymentStatus = 'Paid';
        else if (totalPaid > 0) paymentStatus = 'Partial';

        await client.query(`UPDATE purchase_bills SET payment_status = $1 WHERE id = $2`, [paymentStatus, id]);

        await client.query('COMMIT');
        res.status(200).json({ success: true, message: 'Purchase bill updated successfully.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating purchase bill:', error);
        res.status(500).json({ message: 'Server error while updating purchase bill.', error: error.message });
    } finally {
        client.release();
    }
};

exports.deletePurchaseBill = async (req, res) => {
    const garageId = req.garageId;
    const { id } = req.params;

    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        const paymentsRes = await client.query(`SELECT id FROM supplier_payments WHERE purchase_bill_id = $1`, [id]);
        if (paymentsRes.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Cannot delete a bill that has payments recorded. Delete payments first.' });
        }

        const itemsRes = await client.query(`SELECT master_item_id, quantity FROM purchase_bill_items WHERE purchase_bill_id = $1`, [id]);
        for (const item of itemsRes.rows) {
            await client.query(`
                UPDATE master_items SET stock_qty = COALESCE(stock_qty, 0) - $1 WHERE id = $2 AND garage_id = $3
            `, [item.quantity, item.master_item_id, garageId]);
        }

        await client.query(`UPDATE purchase_bills SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND garage_id = $2`, [id, garageId]);

        await client.query('COMMIT');
        res.status(200).json({ success: true, message: 'Purchase bill deleted successfully.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting purchase bill:', error);
        res.status(500).json({ message: 'Server error while deleting purchase bill.', error: error.message });
    } finally {
        client.release();
    }
};