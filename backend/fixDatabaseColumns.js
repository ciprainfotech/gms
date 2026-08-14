require('dotenv').config();
const db = require('./config/db');

async function fixColumns() {
  try {
    console.log('Running 3-tier SaaS pricing migration...');
    
    await db.query(`
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS one_time_setup_fee DECIMAL(10,2) DEFAULT 0.00;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS yearly_maintenance_fee DECIMAL(10,2) DEFAULT 0.00;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS subscription_renewal_date DATE;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS email VARCHAR(100);
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS logo_url VARCHAR(255);
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS gst_number VARCHAR(50);
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS invoice_prefix VARCHAR(20) DEFAULT 'INV-';
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS invoice_next_num INTEGER DEFAULT 1;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS jobsheet_prefix VARCHAR(20) DEFAULT 'JS-';
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS jobsheet_next_num INTEGER DEFAULT 1;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS custom_monthly_price DECIMAL(10,2) DEFAULT 0.00;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS whatsapp_credit_balance DECIMAL(10,2) DEFAULT 100.00;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS whatsapp_cost_per_msg DECIMAL(10,2) DEFAULT 0.15;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS whatsapp_api_token TEXT;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id VARCHAR(100);
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS whatsapp_api_url VARCHAR(255);
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS feature_stock BOOLEAN DEFAULT TRUE;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS feature_purchase BOOLEAN DEFAULT TRUE;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS feature_analytics BOOLEAN DEFAULT TRUE;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS feature_reminders BOOLEAN DEFAULT TRUE;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS feature_tasks BOOLEAN DEFAULT TRUE;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS feature_whatsapp BOOLEAN DEFAULT TRUE;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100) DEFAULT 'HDFC Bank (BORSAD)';
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS bank_account_no VARCHAR(50) DEFAULT '07492000002739';
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS bank_ifsc VARCHAR(20) DEFAULT 'HDFC0000749';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;
      ALTER TABLE whatsapp_logs ADD COLUMN IF NOT EXISTS gateway_msg_id VARCHAR(255);
      ALTER TABLE whatsapp_logs ADD COLUMN IF NOT EXISTS error_message TEXT;

      -- Staff Lifecycle columns
      ALTER TABLE staff ADD COLUMN IF NOT EXISTS joined_date DATE DEFAULT CURRENT_DATE;
      ALTER TABLE staff ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
      ALTER TABLE staff ADD COLUMN IF NOT EXISTS leaving_date DATE DEFAULT NULL;
      ALTER TABLE staff ADD COLUMN IF NOT EXISTS leaving_notes TEXT DEFAULT NULL;

      UPDATE garages SET whatsapp_phone_number_id = '1202739572931345' WHERE whatsapp_phone_number_id IS NULL OR whatsapp_phone_number_id = '';
    `);

    console.log('Database columns updated & verified successfully!');
  } catch (err) {
    console.error('Error adding database columns:', err);
  } finally {
    process.exit();
  }
}

fixColumns();
