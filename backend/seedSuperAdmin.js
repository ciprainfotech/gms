require('dotenv').config();
const db = require('./config/db');
const bcrypt = require('bcrypt');

async function seedSuperAdmin() {
  try {
    const email = 'admin@ciprainfotech.com';
    const password = 'admin123';

    // Check if user exists
    const { rows } = await db.query('SELECT id, is_super_admin FROM users WHERE email = $1', [email]);
    
    if (rows.length > 0) {
      // Update existing user to super admin
      await db.query('UPDATE users SET is_super_admin = TRUE WHERE id = $1', [rows[0].id]);
      console.log(`User ${email} updated to Super Admin.`);
    } else {
      // Create new Super Admin user
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      
      await db.query(
        `INSERT INTO users (name, email, password_hash, is_super_admin)
         VALUES ($1, $2, $3, TRUE)`,
        ['Cipra Platform Admin', email, hash]
      );
      console.log(`Super Admin user created: ${email} / ${password}`);
    }
  } catch (error) {
    console.error('Error seeding super admin:', error);
  } finally {
    process.exit();
  }
}

seedSuperAdmin();
