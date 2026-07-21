const db = require('../config/db');

exports.getSuppliers = async (req, res) => {
    const garageId = req.garageId;
    try {
        const query = `SELECT id, name, contact_person AS "contactPerson", phone, city FROM suppliers WHERE garage_id = $1 AND is_deleted = FALSE ORDER BY name ASC`;
        const { rows } = await db.query(query, [garageId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).json({ message: 'Server error fetching suppliers.' });
    }
};

exports.createSupplier = async (req, res) => {
    const garageId = req.garageId;
    const { name, contactPerson, phone, city } = req.body;
    try {
        const query = `
            INSERT INTO suppliers (garage_id, name, contact_person, phone, city) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING id, name, contact_person AS "contactPerson", phone, city;
        `;
        const { rows } = await db.query(query, [garageId, name, contactPerson || '', phone, city || '']);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creating supplier:', error);
        res.status(500).json({ message: 'Server error creating supplier.' });
    }
};