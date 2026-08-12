require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../config/db');

async function check() {
  try {
    const { rows } = await db.query('SELECT id, name, feature_payroll, whatsapp_status FROM garages');
    console.log('Garages in database:', rows);
  } catch (err) {
    console.error('Error querying garages:', err);
  } finally {
    process.exit();
  }
}

check();
