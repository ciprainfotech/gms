const db = require('../config/db');
const bcrypt = require('bcrypt');

// Platform Dashboard Stats
exports.getPlatformStats = async (req, res) => {
  try {
    const totalGaragesRes = await db.query('SELECT COUNT(*) FROM garages WHERE is_active = TRUE');
    const totalSubscribersRes = await db.query('SELECT COUNT(*) FROM garages WHERE subscription_status = $1', ['active']);
    const totalUsersRes = await db.query('SELECT COUNT(*) FROM users WHERE is_deleted = FALSE');
    const totalCreditsRes = await db.query('SELECT COALESCE(SUM(whatsapp_credit_balance), 0) AS total_credits FROM garages');

    res.json({
      success: true,
      stats: {
        totalGarages: parseInt(totalGaragesRes.rows[0].count, 10),
        activeSubscribers: parseInt(totalSubscribersRes.rows[0].count, 10),
        totalUsers: parseInt(totalUsersRes.rows[0].count, 10),
        totalWhatsappCredits: parseFloat(totalCreditsRes.rows[0].total_credits || 0)
      }
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    res.status(500).json({ success: false, message: 'Server error fetching platform statistics' });
  }
};

exports.getAllWhatsappLogs = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT l.id, l.recipient_phone, l.message_type, l.gateway_msg_id, l.cost_deducted, 
             l.balance_after, l.status, l.error_message, l.created_at, g.name as garage_name
      FROM whatsapp_logs l
      LEFT JOIN garages g ON l.garage_id = g.id
      ORDER BY l.created_at DESC
      LIMIT 100
    `);
    res.json({ success: true, logs: rows });
  } catch (error) {
    console.error('Error fetching all whatsapp logs:', error);
    res.status(500).json({ success: false, message: 'Server error fetching whatsapp logs' });
  }
};

// List All Garages with 3-Tier Commercial Plan Details & Feature Toggles
exports.getAllGarages = async (req, res) => {
  try {
    const query = `
      SELECT 
        g.id, g.name, g.phone, g.address, g.is_active, g.subscription_status,
        g.subscription_expires_at, g.invoice_prefix, g.jobsheet_prefix, g.created_at,
        g.custom_monthly_price, g.one_time_setup_fee, g.yearly_maintenance_fee,
        g.subscription_renewal_date, g.whatsapp_credit_balance, g.whatsapp_cost_per_msg,
        g.whatsapp_phone_number_id,
        COALESCE(CASE WHEN g.whatsapp_phone_number_id IS NOT NULL AND g.whatsapp_phone_number_id != '' THEN 'connected' ELSE g.whatsapp_status END, 'disconnected') AS whatsapp_status,
        g.feature_stock, g.feature_purchase, g.feature_analytics, g.feature_reminders,
        g.feature_tasks, g.feature_whatsapp, g.feature_whatsapp_utility, g.feature_whatsapp_marketing, g.feature_whatsapp_costing, g.feature_payroll,
        g.whatsapp_agent_download_enabled,
        p.id AS plan_id, p.name AS plan_name,
        u.id AS owner_id, u.name AS owner_name, u.email AS owner_email, u.phone AS owner_phone,
        (SELECT COUNT(*) FROM garage_users gu WHERE gu.garage_id = g.id) AS user_count
      FROM garages g
      LEFT JOIN plans p ON g.plan_id = p.id
      LEFT JOIN garage_users gu ON gu.garage_id = g.id AND gu.role = 'owner'
      LEFT JOIN users u ON gu.user_id = u.id
      ORDER BY g.created_at DESC
    `;
    const { rows } = await db.query(query);
    res.json({ success: true, garages: rows });
  } catch (error) {
    console.error('Error fetching all garages:', error);
    res.status(500).json({ success: false, message: 'Server error listing garages' });
  }
};

// Onboard New Client Garage with 3-Tier Commercial Fees
exports.onboardGarage = async (req, res) => {
  const {
    garageName,
    address,
    garagePhone,
    garageEmail,
    ownerName,
    ownerEmail,
    ownerPhone,
    password,
    customMonthlyPrice,
    oneTimeSetupFee,
    yearlyMaintenanceFee,
    whatsappCostPerMsg,
    whatsappPhoneNumberId,
    subscriptionRenewalDate,
    featureStock,
    featurePurchase,
    featureAnalytics,
    featureReminders,
    featureTasks,
    featureWhatsapp,
    featureWhatsappUtility,
    featureWhatsappMarketing,
    initialWhatsappCredits,
    featurePayroll
  } = req.body;

  if (!garageName || !ownerName || !ownerEmail || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide garage name, owner name, owner email, and password.'
    });
  }

  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // 1. Check if owner email exists
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [ownerEmail.toLowerCase().trim()]);
    let userId;

    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
    } else {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      const newUser = await client.query(
        `INSERT INTO users (name, email, phone, password_hash)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [ownerName.trim(), ownerEmail.toLowerCase().trim(), ownerPhone ? ownerPhone.trim() : null, hash]
      );
      userId = newUser.rows[0].id;
    }

    // 2. Create Garage record with 3-Tier Commercial Pricing
    const renewalDate = subscriptionRenewalDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const newGarage = await client.query(
      `INSERT INTO garages (
        name, address, phone, email, custom_monthly_price, 
        one_time_setup_fee, yearly_maintenance_fee, subscription_renewal_date,
        whatsapp_credit_balance, whatsapp_cost_per_msg, whatsapp_phone_number_id,
        feature_stock, feature_purchase, feature_analytics, 
        feature_reminders, feature_tasks, feature_whatsapp, feature_whatsapp_utility, feature_whatsapp_marketing, feature_whatsapp_costing, feature_payroll, subscription_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, 'active')
      RETURNING *`,
      [
        garageName.trim(),
        address ? address.trim() : null,
        garagePhone ? garagePhone.trim() : null,
        garageEmail ? garageEmail.trim() : null,
        parseFloat(customMonthlyPrice || 0),
        parseFloat(oneTimeSetupFee || 0),
        parseFloat(yearlyMaintenanceFee || 0),
        renewalDate,
        parseFloat(initialWhatsappCredits || 100.00),
        parseFloat(whatsappCostPerMsg || 0.15),
        whatsappPhoneNumberId ? whatsappPhoneNumberId.trim() : null,
        featureStock !== false,
        featurePurchase !== false,
        featureAnalytics !== false,
        featureReminders !== false,
        featureTasks !== false,
        featureWhatsapp !== false,
        featureWhatsappUtility !== false,
        featureWhatsappMarketing !== false,
        true, // feature_whatsapp_costing
        featurePayroll !== false
      ]
    );

    const garageId = newGarage.rows[0].id;

    // 3. Assign User as Garage Owner
    await client.query(
      `INSERT INTO garage_users (garage_id, user_id, role)
       VALUES ($1, $2, 'owner')
       ON CONFLICT (garage_id, user_id) DO UPDATE SET role = 'owner'`,
      [garageId, userId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `Client "${garageName}" onboarded successfully!`,
      garage: newGarage.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error onboarding garage client:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error onboarding garage client' });
  } finally {
    client.release();
  }
};

// Update Garage Features, 3-Tier Commercial Pricing & Status
exports.updateGarageSubscription = async (req, res) => {
  const { garageId } = req.params;
  const {
    custom_monthly_price,
    one_time_setup_fee,
    yearly_maintenance_fee,
    subscription_renewal_date,
    whatsapp_cost_per_msg,
    whatsapp_phone_number_id,
    feature_stock,
    feature_purchase,
    feature_analytics,
    feature_reminders,
    feature_tasks,
    feature_whatsapp,
    feature_whatsapp_utility,
    feature_whatsapp_marketing,
    feature_whatsapp_costing,
    feature_payroll,
    is_active,
    whatsapp_agent_download_enabled
  } = req.body;

  try {
    await db.query(
      `UPDATE garages SET 
        custom_monthly_price = $1,
        one_time_setup_fee = $2,
        yearly_maintenance_fee = $3,
        subscription_renewal_date = $4,
        whatsapp_cost_per_msg = $5,
        whatsapp_phone_number_id = $6,
        feature_stock = $7,
        feature_purchase = $8,
        feature_analytics = $9,
        feature_reminders = $10,
        feature_tasks = $11,
        feature_whatsapp = $12,
        feature_whatsapp_utility = $13,
        feature_whatsapp_marketing = $14,
        feature_whatsapp_costing = $15,
        feature_payroll = $16,
        is_active = $17,
        whatsapp_agent_download_enabled = $18,
        updated_at = NOW()
       WHERE id = $19`,
      [
        parseFloat(custom_monthly_price || 0),
        parseFloat(one_time_setup_fee || 0),
        parseFloat(yearly_maintenance_fee || 0),
        subscription_renewal_date || null,
        parseFloat(whatsapp_cost_per_msg || 0.15),
        whatsapp_phone_number_id ? whatsapp_phone_number_id.trim() : null,
        feature_stock !== false,
        feature_purchase !== false,
        feature_analytics !== false,
        feature_reminders !== false,
        feature_tasks !== false,
        feature_whatsapp !== false,
        feature_whatsapp_utility !== false,
        feature_whatsapp_marketing !== false,
        feature_whatsapp_costing !== false,
        feature_payroll !== false,
        is_active !== false,
        whatsapp_agent_download_enabled === true,
        garageId
      ]
    );

    res.json({ success: true, message: 'Garage subscription & commercial configuration updated successfully' });
  } catch (error) {
    console.error('Error updating garage subscription:', error);
    res.status(500).json({ success: false, message: 'Failed to update garage configuration' });
  }
};

// Top Up Garage WhatsApp Credit Balance
const topUpWhatsAppCredits = async (req, res) => {
  const { garageId } = req.params;
  const { amount } = req.body;

  const topUpAmt = parseFloat(amount);
  if (isNaN(topUpAmt) || topUpAmt <= 0) {
    return res.status(400).json({ success: false, message: 'Valid positive top-up amount is required' });
  }

  try {
    const { rows } = await db.query(
      `UPDATE garages 
       SET whatsapp_credit_balance = whatsapp_credit_balance + $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, whatsapp_credit_balance`,
      [topUpAmt, garageId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Garage account not found' });
    }

    res.json({
      success: true,
      message: `Recharged ₹${topUpAmt.toFixed(2)} WhatsApp credits for ${rows[0].name}`,
      newBalance: parseFloat(rows[0].whatsapp_credit_balance)
    });
  } catch (error) {
    console.error('Error topping up WhatsApp credit:', error);
    res.status(500).json({ success: false, message: 'Failed to recharge WhatsApp credits' });
  }
};

// 1-Click Toggle Garage License Status (Active / Suspended)
exports.toggleGarageStatus = async (req, res) => {
  const { garageId } = req.params;
  try {
    const { rows } = await db.query('SELECT is_active, name FROM garages WHERE id = $1', [garageId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Garage not found' });
    }

    const newStatus = !rows[0].is_active;
    await db.query('UPDATE garages SET is_active = $1, updated_at = NOW() WHERE id = $2', [newStatus, garageId]);

    res.json({
      success: true,
      message: `Garage license for "${rows[0].name}" is now ${newStatus ? 'ACTIVE' : 'SUSPENDED (Read-Only)'}`,
      is_active: newStatus
    });
  } catch (error) {
    console.error('Error toggling garage status:', error);
    res.status(500).json({ success: false, message: 'Failed to update garage active status' });
  }
};

exports.topUpWhatsAppCredits = topUpWhatsAppCredits;
exports.topUpWhatsAppCredit = topUpWhatsAppCredits;

// Plans Controllers
exports.getAllPlans = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM plans ORDER BY id ASC');
    res.json({ success: true, plans: rows });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ success: false, message: 'Server error fetching plans' });
  }
};

exports.createPlan = async (req, res) => {
  const { name, price_monthly, max_users } = req.body;
  try {
    const { rows } = await db.query(
      'INSERT INTO plans (name, price_monthly, max_users) VALUES ($1, $2, $3) RETURNING *',
      [name, price_monthly || 0, max_users || 10]
    );
    res.status(201).json({ success: true, plan: rows[0] });
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({ success: false, message: 'Server error creating plan' });
  }
};

// Update Super Admin Personal Profile
exports.updateSuperAdminProfile = async (req, res) => {
  const userId = req.user.id;
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Name and email are required' });
  }

  try {
    await db.query(
      'UPDATE users SET name = $1, email = $2, updated_at = NOW() WHERE id = $3 AND is_super_admin = TRUE',
      [name.trim(), email.toLowerCase().trim(), userId]
    );
    res.json({ success: true, message: 'Super Admin profile updated successfully' });
  } catch (error) {
    console.error('Error updating super admin profile:', error);
    res.status(500).json({ success: false, message: 'Failed to update Super Admin profile' });
  }
};

// Update Super Admin Password
exports.updateSuperAdminPassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current password and new password are required' });
  }

  try {
    const userRes = await db.query('SELECT password_hash FROM users WHERE id = $1 AND is_super_admin = TRUE', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Super Admin account not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, userRes.rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, userId]);

    res.json({ success: true, message: 'Super Admin password updated successfully' });
  } catch (error) {
    console.error('Error updating super admin password:', error);
    res.status(500).json({ success: false, message: 'Failed to update Super Admin password' });
  }
};
