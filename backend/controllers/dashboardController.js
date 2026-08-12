const db = require('../config/db');

exports.getKanbanData = async (req, res) => {
    const garageId = req.garageId;
    let targetDate = req.query.date;

    if (!targetDate || targetDate === 'undefined' || targetDate === 'null') {
        targetDate = null;
    }

    try {
        const dateFilterStr = targetDate ? '$2' : "TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')";
        const queryParams = targetDate ? [garageId, targetDate] : [garageId];

        const query = `
            SELECT 
                js.id, js.job_sheet_number AS "jobSheetNumber", js.status, js.notes, 
                js.date_created AS "dateCreated", js.date_completed AS "dateCompleted",
                v.car_number AS "vehicleNumber",
                CONCAT(mk.name, ' ', m.name) AS "vehicleModel", c.name AS "customerName"
            FROM job_sheets js
            JOIN vehicles v ON js.vehicle_id = v.id
            JOIN customers c ON v.customer_id = c.id
            JOIN models m ON v.model_id = m.id
            JOIN makes mk ON v.make_id = mk.id
            WHERE 
                js.garage_id = $1
                AND js.is_deleted = FALSE
                AND (
                    (js.status IN ('Waiting', 'In Progress') AND TO_CHAR(js.date_created, 'YYYY-MM-DD') <= ${dateFilterStr})
                    OR 
                    (js.status IN ('Completed', 'Invoiced') AND TO_CHAR(COALESCE(js.date_completed, js.date_created), 'YYYY-MM-DD') = ${dateFilterStr})
                )
            ORDER BY js.created_at DESC
        `;
        
        const { rows } = await db.query(query, queryParams);
        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        console.error('Error fetching Kanban data:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getRemindersData = async (req, res) => {
    const garageId = req.garageId;
    try {
        // Fetch Service Reminders: Completed job sheets where the 6-month mark (180 days) is within the next 14 days or already overdue.
        const servicesQuery = `
            SELECT * FROM (
                SELECT DISTINCT ON (js.vehicle_id)
                    js.id, js.job_sheet_number, js.date_completed, js.next_service_km,
                    (js.date_completed + INTERVAL '180 days') AS next_service_date,
                    c.name AS customer_name, c.phone AS customer_phone,
                    v.car_number,
                    CONCAT(mk.name, ' ', m.name) AS vehicle_model
                FROM job_sheets js
                JOIN vehicles v ON js.vehicle_id = v.id
                JOIN customers c ON js.customer_id = c.id
                JOIN models m ON v.model_id = m.id
                JOIN makes mk ON v.make_id = mk.id
                WHERE js.garage_id = $1 
                  AND js.is_deleted = FALSE 
                  AND js.date_completed IS NOT NULL
                ORDER BY js.vehicle_id, js.date_completed DESC
            ) AS latest_services
            WHERE next_service_date <= CURRENT_DATE + INTERVAL '14 days'
            ORDER BY next_service_date ASC
        `;

        const { rows: dueServices } = await db.query(servicesQuery, [garageId]);

        res.json({
            success: true,
            dueServices
        });
    } catch (err) {
        console.error('Error fetching reminders data:', err);
        res.status(500).json({ success: false, message: 'Server error fetching reminders' });
    }
};