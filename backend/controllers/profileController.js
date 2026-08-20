const db = require('../config/db');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

// Fetch User & Garage Profile Details
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const garageId = req.garageId;

    // Get User Details
    const userRes = await db.query(
      'SELECT id, name, email, phone, is_super_admin FROM users WHERE id = $1',
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let garageData = null;
    if (garageId) {
      const garageRes = await db.query(
        `SELECT g.id, g.name, g.phone, g.email, g.address, g.logo_url, g.gst_number, g.tagline,
                g.bank_name, g.bank_account_no, g.bank_ifsc,
                g.terms_and_conditions, g.invoice_prefix, g.invoice_next_num, 
                g.jobsheet_prefix, g.jobsheet_next_num, g.plan_id, g.subscription_status, g.is_active,
                g.one_time_setup_fee, g.yearly_maintenance_fee, g.subscription_renewal_date,
                g.whatsapp_provider, g.whatsapp_api_url, g.whatsapp_api_token, g.whatsapp_phone_number_id,
                g.whatsapp_credit_balance, g.whatsapp_cost_per_msg, g.whatsapp_status,
                g.feature_stock, g.feature_purchase, g.feature_analytics,
                g.feature_reminders, g.feature_tasks, g.feature_whatsapp,
                g.feature_whatsapp_utility, g.feature_whatsapp_marketing, g.feature_payroll,
                g.feature_whatsapp_costing, g.whatsapp_agent_download_enabled, g.enforce_stock_validation,
                p.name as plan_name
         FROM garages g
         LEFT JOIN plans p ON g.plan_id = p.id
         WHERE g.id = $1`,
        [garageId]
      );
      if (garageRes.rows.length > 0) {
        garageData = garageRes.rows[0];
      }
    }

    res.json({
      success: true,
      user: userRes.rows[0],
      garage: garageData
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Failed to load profile details' });
  }
};

// Update User Profile (Name, Phone)
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    await db.query(
      'UPDATE users SET name = $1, phone = $2, updated_at = NOW() WHERE id = $3',
      [name.trim(), phone ? phone.trim() : null, userId]
    );

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide both current and new passwords' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    // Verify current password
    const userRes = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isValid = await bcrypt.compare(currentPassword, userRes.rows[0].password_hash);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    // Hash new password and update
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, userId]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};

// Update Garage Profile & Prefix Settings
exports.updateGarageDetails = async (req, res) => {
  try {
    const garageId = req.garageId;
    const {
      name,
      phone,
      email,
      address,
      gst_number,
      tagline,
      bank_name,
      bank_account_no,
      bank_ifsc,
      terms_and_conditions,
      invoice_prefix,
      invoice_next_num,
      jobsheet_prefix,
      jobsheet_next_num,
      whatsapp_provider,
      whatsapp_api_url,
      whatsapp_api_token,
      whatsapp_phone_number_id,
      enforce_stock_validation
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Garage name is required' });
    }

    await db.query(
      `UPDATE garages SET 
        name = $1, 
        phone = $2, 
        email = $3, 
        address = $4, 
        gst_number = $5, 
        tagline = $6,
        bank_name = $7,
        bank_account_no = $8,
        bank_ifsc = $9,
        terms_and_conditions = $10, 
        invoice_prefix = $11, 
        invoice_next_num = $12, 
        jobsheet_prefix = $13, 
        jobsheet_next_num = $14, 
        whatsapp_provider = $15,
        whatsapp_api_url = $16,
        whatsapp_api_token = $17,
        whatsapp_phone_number_id = $18,
        enforce_stock_validation = $19,
        updated_at = NOW()
       WHERE id = $20`,
      [
        name.trim(),
        phone ? phone.trim() : null,
        email ? email.trim() : null,
        address ? address.trim() : null,
        gst_number ? gst_number.trim() : null,
        tagline ? tagline.trim() : null,
        bank_name && bank_name.trim() ? bank_name.trim() : null,
        bank_account_no && bank_account_no.trim() ? bank_account_no.trim() : null,
        bank_ifsc && bank_ifsc.trim() ? bank_ifsc.trim() : null,
        terms_and_conditions ? terms_and_conditions.trim() : null,
        invoice_prefix ? invoice_prefix.trim() : 'INV-',
        invoice_next_num ? parseInt(invoice_next_num, 10) : 1,
        jobsheet_prefix ? jobsheet_prefix.trim() : 'JS-',
        jobsheet_next_num ? parseInt(jobsheet_next_num, 10) : 1,
        whatsapp_provider ? whatsapp_provider.trim() : 'ultramsg',
        whatsapp_api_url ? whatsapp_api_url.trim() : null,
        whatsapp_api_token ? whatsapp_api_token.trim() : null,
        whatsapp_phone_number_id ? whatsapp_phone_number_id.trim() : null,
        enforce_stock_validation !== false,
        garageId
      ]
    );

    res.json({ success: true, message: 'Garage settings & WhatsApp API configuration updated successfully' });
  } catch (error) {
    console.error('Error updating garage settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update garage settings' });
  }
};

const { uploadImageToCloud } = require('../config/cloudinary');

// Upload Garage Logo to Cloudinary CDN
exports.uploadGarageLogo = async (req, res) => {
  try {
    const garageId = req.garageId;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    // Unique public_id per garage so updating logo overwrites the old one on Cloudinary CDN
    const publicId = `garage_${garageId}_logo`;
    const logoUrl = await uploadImageToCloud(req.file.buffer, req.file.mimetype, 'garage_logos', publicId);

    await db.query('UPDATE garages SET logo_url = $1, updated_at = NOW() WHERE id = $2', [logoUrl, garageId]);

    res.json({
      success: true,
      message: 'Logo uploaded successfully to Cloud CDN',
      logo_url: logoUrl
    });
  } catch (error) {
    console.error('Error uploading logo to Cloudinary:', error);
    res.status(500).json({ success: false, message: 'Failed to upload logo to cloud' });
  }
};
