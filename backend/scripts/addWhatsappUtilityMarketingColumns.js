require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../config/db');

async function migrate() {
  try {
    console.log('Migrating WhatsApp utility and marketing permission columns...');
    await db.query(`
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS feature_whatsapp_utility BOOLEAN DEFAULT TRUE;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS feature_whatsapp_marketing BOOLEAN DEFAULT TRUE;
    `);
    console.log('WhatsApp utility and marketing columns migrated successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

migrate();
