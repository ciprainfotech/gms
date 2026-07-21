const db = require('../config/db');

// @desc    Get all purchase bills with their items
// @route   GET /api/purchase-bills
exports.getPurchaseBills = async (req, res) => {
    const garageId = req.garageId;

    try {
        const query = `
            SELECT 
                pb.id,
                pb.bill_number AS "billNumber",
                TO_CHAR(pb.bill_date, 'YYYY-MM-DD') AS "billDate",
                pb.total_amount AS "totalAmount",
                pb.notes,
                pb.created_at AS "dateRecorded",
                s.name AS "supplierName",
                COALESCE(
                    (
                        SELECT json_agg(
                            json_build_object(
                                'masterItemId', pbi.master_item_id,
                                'quantity', pbi.quantity,
                                'purchasePrice', pbi.purchase_price
                            )
                        )
                        FROM purchase_bill_items pbi
                        WHERE pbi.purchase_bill_id = pb.id
                    ), 
                    '[]'::json
                ) AS items
            FROM purchase_bills pb
            JOIN suppliers s ON pb.supplier_id = s.id
            WHERE pb.garage_id = $1
            ORDER BY pb.bill_date DESC, pb.created_at DESC;
        `;

        const { rows } = await db.query(query, [garageId]);
        res.status(200).json(rows);

    } catch (error) {
        console.error('Error fetching purchase bills:', error);
        res.status(500).json({ message: 'Server error fetching purchase history.' });
    }
};

// @desc    Create a new purchase bill
// @route   POST /api/purchase-bills
exports.createPurchaseBill = async (req, res) => {
    const garageId = req.garageId;
    const { supplierId, billNumber, billDate, notes, items } = req.body;

    const client = await db.getClient();

    try {
        await client.query('BEGIN'); // Start transaction

        // 1. Calculate total amount securely
        let totalAmount = 0;
        items.forEach(item => {
            totalAmount += (Number(item.quantity) * Number(item.purchasePrice));
        });

        // 2. Insert the main bill record
        const insertBillQuery = `
            INSERT INTO purchase_bills (garage_id, supplier_id, bill_number, bill_date, total_amount, notes)
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING id;
        `;
        const billRes = await client.query(insertBillQuery, [
            garageId, supplierId, billNumber, billDate, totalAmount, notes || ''
        ]);
        const newBillId = billRes.rows[0].id;

        // 3. Loop through items: Insert bill items AND update stock/cost in master_items
        for (const item of items) {
            // A. Insert line item
            await client.query(
                `INSERT INTO purchase_bill_items (purchase_bill_id, master_item_id, quantity, purchase_price)
                 VALUES ($1, $2, $3, $4)`,
                [newBillId, item.masterItemId, item.quantity, item.purchasePrice]
            );

            // B. Update Stock & Cost Price in Master Items
            await client.query(
                `UPDATE master_items 
                 SET stock_qty = COALESCE(stock_qty, 0) + $1, 
                     cost_price = $2 
                 WHERE id = $3 AND garage_id = $4`,
                [item.quantity, item.purchasePrice, item.masterItemId, garageId]
            );
        }

        await client.query('COMMIT'); // Save everything permanently
        res.status(201).json({ success: true, message: 'Purchase Bill saved and stock updated.' });

    } catch (error) {
        await client.query('ROLLBACK'); // Cancel everything if anything fails
        console.error('Error saving purchase bill:', error);
        res.status(500).json({ message: 'Server error while saving purchase bill.' });
    } finally {
        client.release();
    }
};