require('dotenv').config();
const db = require('./config/db');
async function run() {
  await db.query('UPDATE garages SET whatsapp_status = $1, whatsapp_phone_number = NULL WHERE id = $2', ['disconnected', 1]);
  console.log('DB status reset to disconnected');
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
