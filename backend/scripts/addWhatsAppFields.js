const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE || 'gms',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function addWhatsAppFields() {
  try {
    await client.connect();
    console.log('Connected to database.');

    // 1. Add whatsapp_status
    try {
      await client.query("ALTER TABLE garages ADD COLUMN whatsapp_status VARCHAR(20) DEFAULT 'disconnected'");
      console.log('Added whatsapp_status column.');
    } catch (e) {
      console.log('whatsapp_status might already exist:', e.message);
    }

    // 2. Add whatsapp_waba_id
    try {
      await client.query("ALTER TABLE garages ADD COLUMN whatsapp_waba_id VARCHAR(100)");
      console.log('Added whatsapp_waba_id column.');
    } catch (e) {
      console.log('whatsapp_waba_id might already exist:', e.message);
    }

    // 3. Add whatsapp_phone_number
    try {
      await client.query("ALTER TABLE garages ADD COLUMN whatsapp_phone_number VARCHAR(50)");
      console.log('Added whatsapp_phone_number column.');
    } catch (e) {
      console.log('whatsapp_phone_number might already exist:', e.message);
    }

    console.log('WhatsApp fields migration completed successfully.');
  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

addWhatsAppFields();
