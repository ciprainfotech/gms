const db = require('../config/db');

/**
 * @desc    Get data for the Kanban dashboard
 * @route   GET /api/dashboard/kanban-data
 * @access  Private
 */
exports.getKanbanData = async (req, res) => {
    const garageId = req.garageId;
    try {
        // This query fetches all active (Waiting, In Progress) jobs AND jobs completed today.
        const query = `
            SELECT 
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
                AND js.is_deleted = FALSE
                AND (
                    js.status IN ('Waiting', 'In Progress') 
                    OR 
                    (js.status = 'Completed' AND js.date_completed >= CURRENT_DATE)
                )
            ORDER BY js.created_at DESC
        `;
        const { rows } = await db.query(query, [garageId]);
        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        console.error('Error fetching Kanban data:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};