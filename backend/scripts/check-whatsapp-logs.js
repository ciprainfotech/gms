require('dotenv').config();
const db = require('../config/db');

async function check() {
  try {
    const { rows } = await db.query(
      `SELECT id, garage_id, recipient_phone, message_type, status, error_message, created_at 
       FROM whatsapp_logs 
       ORDER BY id DESC LIMIT 5`
    );
    console.log('--- RECENT WHATSAPP LOGS ---');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
