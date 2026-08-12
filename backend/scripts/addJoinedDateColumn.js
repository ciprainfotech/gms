require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../config/db');

async function migrate() {
  try {
    console.log('Adding joined_date column to staff table...');
    await db.query(`
      ALTER TABLE staff ADD COLUMN IF NOT EXISTS joined_date DATE DEFAULT CURRENT_DATE;
    `);
    console.log('joined_date column added successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

migrate();
