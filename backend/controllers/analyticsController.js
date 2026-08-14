const db = require('../config/db');

exports.getAnalyticsData = async (req, res) => {
    const garageId = req.garageId;
    const { range, startDate: customStart, endDate: customEnd } = req.query;

    try {
        // 1. Determine Date Range Filter Clause
        let dateCondition = "inv.date_issued >= DATE_TRUNC('month', CURRENT_DATE)"; // Default: This Month
        let expCondition = "pb.bill_date >= DATE_TRUNC('month', CURRENT_DATE)";
        let custCondition = "c.created_at >= DATE_TRUNC('month', CURRENT_DATE)";
        let jsCondition = "js.date_created >= DATE_TRUNC('month', CURRENT_DATE)";

        if (range === 'today') {
            dateCondition = "inv.date_issued >= CURRENT_DATE";
            expCondition = "pb.bill_date >= CURRENT_DATE";
            custCondition = "c.created_at >= CURRENT_DATE";
            jsCondition = "js.date_created >= CURRENT_DATE";
        } else if (range === 'week') {
            dateCondition = "inv.date_issued >= DATE_TRUNC('week', CURRENT_DATE)";
            expCondition = "pb.bill_date >= DATE_TRUNC('week', CURRENT_DATE)";
            custCondition = "c.created_at >= DATE_TRUNC('week', CURRENT_DATE)";
            jsCondition = "js.date_created >= DATE_TRUNC('week', CURRENT_DATE)";
        } else if (range === 'quarter') {
            dateCondition = "inv.date_issued >= CURRENT_DATE - INTERVAL '90 days'";
            expCondition = "pb.bill_date >= CURRENT_DATE - INTERVAL '90 days'";
            custCondition = "c.created_at >= CURRENT_DATE - INTERVAL '90 days'";
            jsCondition = "js.date_created >= CURRENT_DATE - INTERVAL '90 days'";
        } else if (range === 'year') {
            dateCondition = "inv.date_issued >= DATE_TRUNC('year', CURRENT_DATE)";
            expCondition = "pb.bill_date >= DATE_TRUNC('year', CURRENT_DATE)";
            custCondition = "c.created_at >= DATE_TRUNC('year', CURRENT_DATE)";
            jsCondition = "js.date_created >= DATE_TRUNC('year', CURRENT_DATE)";
        } else if (range === 'custom' && customStart && customEnd) {
            dateCondition = `inv.date_issued >= '${customStart}'::date AND inv.date_issued <= '${customEnd}'::date`;
            expCondition = `pb.bill_date >= '${customStart}'::date AND pb.bill_date <= '${customEnd}'::date`;
            custCondition = `c.created_at >= '${customStart}'::date AND c.created_at <= '${customEnd}'::date + INTERVAL '1 day'`;
            jsCondition = `js.date_created >= '${customStart}'::date AND js.date_created <= '${customEnd}'::date`;
        }

        // 2. Invoices & Revenue Aggregate
        const summaryQuery = `
            SELECT 
                COALESCE(SUM(inv.grand_total), 0) AS "totalRevenue",
                COUNT(inv.id) AS "totalInvoices"
            FROM invoices inv
            WHERE inv.garage_id = $1 AND inv.is_deleted = FALSE AND ${dateCondition}
        `;
        const { rows: summaryRows } = await db.query(summaryQuery, [garageId]);
        const summary = summaryRows[0] || {};

        // Payments Collected & Outstanding
        const paidQuery = `
            SELECT 
                COALESCE(SUM(p.amount_paid), 0) AS "collectedRevenue"
            FROM payments p
            JOIN invoices inv ON p.invoice_id = inv.id
            WHERE p.garage_id = $1 AND inv.is_deleted = FALSE AND ${dateCondition}
        `;
        const { rows: paidRows } = await db.query(paidQuery, [garageId]);
        summary.collectedRevenue = parseFloat(paidRows[0]?.collectedRevenue || 0);
        summary.totalRevenue = parseFloat(summary.totalRevenue || 0);
        summary.outstandingReceivable = Math.max(0, summary.totalRevenue - summary.collectedRevenue);

        // Jobs Completed Count
        const jsCountQuery = `
            SELECT COUNT(id) AS "jobsCompleted"
            FROM job_sheets js
            WHERE js.garage_id = $1 AND js.is_deleted = FALSE AND js.status IN ('Completed', 'Invoiced') AND ${jsCondition}
        `;
        const { rows: jsRows } = await db.query(jsCountQuery, [garageId]);
        summary.jobsCompleted = parseInt(jsRows[0]?.jobsCompleted || 0);

        // New Customers Count
        const custCountQuery = `
            SELECT COUNT(id) AS "newCustomers"
            FROM customers c
            WHERE c.garage_id = $1 AND c.is_deleted = FALSE AND ${custCondition}
        `;
        const { rows: custRows } = await db.query(custCountQuery, [garageId]);
        summary.newCustomers = parseInt(custRows[0]?.newCustomers || 0);

        // Expenses Query
        const expQuery = `
            SELECT COALESCE(SUM(pb.total_amount), 0) AS "totalExpenses"
            FROM purchase_bills pb
            WHERE pb.garage_id = $1 AND ${expCondition}
        `;
        const { rows: expRows } = await db.query(expQuery, [garageId]);
        summary.totalExpenses = parseFloat(expRows[0]?.totalExpenses || 0);
        summary.netProfit = summary.totalRevenue - summary.totalExpenses;
        summary.averageOrderValue = parseInt(summary.totalInvoices || 0) > 0 ? (summary.totalRevenue / parseInt(summary.totalInvoices)) : 0;

        // 3. 6-Month Monthly Trend Line Query
        const trendQuery = `
            WITH months AS (
                SELECT generate_series(
                    DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months'),
                    DATE_TRUNC('month', CURRENT_DATE),
                    '1 month'::interval
                ) AS month_date
            )
            SELECT 
                TO_CHAR(m.month_date, 'Mon YYYY') AS "month",
                COALESCE(SUM(inv.grand_total), 0) AS "revenue",
                COALESCE((
                    SELECT SUM(pb.total_amount) 
                    FROM purchase_bills pb 
                    WHERE pb.garage_id = $1 AND DATE_TRUNC('month', pb.bill_date) = m.month_date
                ), 0) AS "expenses",
                COALESCE((
                    SELECT COUNT(js.id) 
                    FROM job_sheets js 
                    WHERE js.garage_id = $1 AND js.is_deleted = FALSE AND js.status IN ('Completed', 'Invoiced') AND DATE_TRUNC('month', js.date_created) = m.month_date
                ), 0) AS "jobs"
            FROM months m
            LEFT JOIN invoices inv ON inv.garage_id = $1 AND inv.is_deleted = FALSE AND DATE_TRUNC('month', inv.date_issued) = m.month_date
            GROUP BY m.month_date
            ORDER BY m.month_date ASC
        `;
        const { rows: monthlyTrend } = await db.query(trendQuery, [garageId]);

        // 4. Payment Method Distribution
        const paymentQuery = `
            SELECT 
                LOWER(payment_method) AS "mode",
                COALESCE(SUM(amount_paid), 0) AS "amount"
            FROM payments
            WHERE garage_id = $1
            GROUP BY LOWER(payment_method)
        `;
        const { rows: paymentRows } = await db.query(paymentQuery, [garageId]);
        
        let paymentMethods = { cash: 0, upi: 0, card: 0, netbanking: 0, other: 0 };
        paymentRows.forEach(p => {
            const m = p.mode ? p.mode.toLowerCase() : 'other';
            if (m.includes('cash')) paymentMethods.cash += parseFloat(p.amount);
            else if (m.includes('upi') || m.includes('online') || m.includes('gpay') || m.includes('paytm')) paymentMethods.upi += parseFloat(p.amount);
            else if (m.includes('card')) paymentMethods.card += parseFloat(p.amount);
            else if (m.includes('bank') || m.includes('neft') || m.includes('rtgs')) paymentMethods.netbanking += parseFloat(p.amount);
            else paymentMethods.other += parseFloat(p.amount);
        });

        // 5. Top 5 Services and Top 5 Spare Parts
        const topItemsQuery = `
            SELECT 
                mi.name, mi.type,
                SUM(jsi.quantity) AS "totalQty",
                SUM(jsi.quantity * (jsi.unit_price + jsi.lube_charge + jsi.labour_charge)) AS "totalRevenue"
            FROM job_sheet_items jsi
            JOIN master_items mi ON jsi.master_item_id = mi.id
            JOIN job_sheets js ON jsi.job_sheet_id = js.id
            WHERE js.garage_id = $1 AND js.is_deleted = FALSE
            GROUP BY mi.name, mi.type
            ORDER BY "totalRevenue" DESC
            LIMIT 10
        `;
        const { rows: topItems } = await db.query(topItemsQuery, [garageId]);
        const topServices = topItems.filter(i => i.type === 'Service').slice(0, 5);
        const topSpares = topItems.filter(i => i.type === 'Spare').slice(0, 5);

        // 6. Top 5 Spending Customers
        const topCustomersQuery = `
            SELECT 
                c.name, c.phone,
                COUNT(inv.id) AS "totalInvoices",
                COALESCE(SUM(inv.grand_total), 0) AS "totalSpent"
            FROM invoices inv
            JOIN customers c ON inv.customer_id = c.id
            WHERE inv.garage_id = $1 AND inv.is_deleted = FALSE
            GROUP BY c.name, c.phone
            ORDER BY "totalSpent" DESC
            LIMIT 5
        `;
        const { rows: topCustomers } = await db.query(topCustomersQuery, [garageId]);

        res.status(200).json({
            success: true,
            summary: {
                totalRevenue: summary.totalRevenue,
                collectedRevenue: summary.collectedRevenue,
                outstandingReceivable: summary.outstandingReceivable,
                totalExpenses: summary.totalExpenses,
                netProfit: summary.netProfit,
                jobsCompleted: summary.jobsCompleted,
                newCustomers: summary.newCustomers,
                averageOrderValue: summary.averageOrderValue,
                totalInvoices: summary.totalInvoices
            },
            monthlyTrend,
            paymentMethods,
            topServices,
            topSpares,
            topCustomers
        });

    } catch (err) {
        console.error('Error in getAnalyticsData:', err);
        res.status(500).json({ success: false, message: 'Failed to compute analytics data' });
    }
};
