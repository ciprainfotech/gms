require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../config/db');

async function migrate() {
  try {
    console.log('Migrating Staff and Payroll Management tables and columns...');
    
    // Add feature flag
    await db.query(`
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS feature_payroll BOOLEAN DEFAULT TRUE;
    `);
    console.log('Added feature_payroll column to garages table.');

    // Create staff table
    await db.query(`
      CREATE TABLE IF NOT EXISTS staff (
        id SERIAL PRIMARY KEY,
        garage_id INT NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(15),
        role VARCHAR(50) NOT NULL,
        salary_type VARCHAR(20) DEFAULT 'monthly',
        base_salary DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Created staff table (if not exists).');

    // Create attendance table
    await db.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        garage_id INT NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
        staff_id INT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        status VARCHAR(20) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(staff_id, date)
      );
    `);
    console.log('Created attendance table (if not exists).');

    // Create staff_transactions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS staff_transactions (
        id SERIAL PRIMARY KEY,
        garage_id INT NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
        staff_id INT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        date DATE NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'Cash',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Created staff_transactions table (if not exists).');
    
    console.log('Staff and Payroll schema migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

migrate();
