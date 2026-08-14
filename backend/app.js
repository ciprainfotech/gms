require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

// --- Import Routes ---
const authRoutes = require('./routes/authRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');     // <-- ADD
const jobSheetRoutes = require('./routes/jobSheetRoutes');   // <-- ADD
const dashboardRoutes = require('./routes/dashboardRoutes');
const makeModelRoutes = require('./routes/makeModelRoutes');
const customerRoutes = require('./routes/customerRoutes');
const masterItemRoutes = require('./routes/masterItemRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const purchaseBillRoutes = require('./routes/purchaseBillRoutes');
const profileRoutes = require('./routes/profileRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const staffRoutes = require('./routes/staffRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

// --- Middleware ---

// Configure CORS to allow React app on localhost and Vercel to communicate with backend
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
}));
app.options('*', cors({ origin: true, credentials: true }));

// Serve static uploaded files (like logos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// To parse cookies from the request headers
app.use(cookieParser());

// To parse JSON bodies from incoming requests
app.use(express.json({ limit: '50mb' }));

// To parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/jobsheets', jobSheetRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/meta', makeModelRoutes);
app.use('/api/master-items', masterItemRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase-bills', purchaseBillRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', superAdminRoutes);
// --- Public Meta Webhook Verification Route ---
app.get('/api/whatsapp/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const expectedToken = process.env.META_VERIFY_TOKEN || 'cipra_whatsapp_verify_token_2026';

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('[Meta Webhook] Challenge verified successfully!');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});
app.post('/api/whatsapp/webhook', (req, res) => {
  res.status(200).send('EVENT_RECEIVED');
});

app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/analytics', analyticsRoutes);



// --- Basic Error Handling ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'An internal server error occurred.' });
});

app.use((req, res, next) => {
    console.log(`Request received for path: ${req.path}`);
    next();
});

// --- Start the Server ---
const PORT = process.env.PORT || 5001;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Auto-verify DB schema columns on boot
  try {
    const db = require('./config/db');
    await db.query(`
      ALTER TABLE staff ADD COLUMN IF NOT EXISTS joined_date DATE DEFAULT CURRENT_DATE;
      ALTER TABLE staff ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
      ALTER TABLE staff ADD COLUMN IF NOT EXISTS leaving_date DATE DEFAULT NULL;
      ALTER TABLE staff ADD COLUMN IF NOT EXISTS leaving_notes TEXT DEFAULT NULL;
      
      -- 3-Tier Commercial Fees & Meta WhatsApp columns
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS one_time_setup_fee DECIMAL(10,2) DEFAULT 0.00;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS yearly_maintenance_fee DECIMAL(10,2) DEFAULT 0.00;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS custom_monthly_price DECIMAL(10,2) DEFAULT 0.00;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS subscription_renewal_date DATE;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS whatsapp_credit_balance DECIMAL(10,2) DEFAULT 100.00;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS whatsapp_cost_per_msg DECIMAL(10,2) DEFAULT 0.15;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS whatsapp_api_token TEXT;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id VARCHAR(100);
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS whatsapp_phone_number VARCHAR(50);
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS whatsapp_waba_id VARCHAR(100);
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS whatsapp_api_url VARCHAR(255);
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS whatsapp_provider VARCHAR(50);
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS whatsapp_status VARCHAR(50) DEFAULT 'disconnected';
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS feature_stock BOOLEAN DEFAULT TRUE;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS feature_purchase BOOLEAN DEFAULT TRUE;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS feature_analytics BOOLEAN DEFAULT TRUE;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS feature_reminders BOOLEAN DEFAULT TRUE;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS feature_tasks BOOLEAN DEFAULT TRUE;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS feature_whatsapp BOOLEAN DEFAULT TRUE;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS feature_whatsapp_utility BOOLEAN DEFAULT TRUE;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS feature_whatsapp_marketing BOOLEAN DEFAULT TRUE;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS feature_whatsapp_costing BOOLEAN DEFAULT TRUE;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS feature_payroll BOOLEAN DEFAULT TRUE;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS bank_account_no VARCHAR(50);
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS bank_ifsc VARCHAR(20);
    `);
    console.log('[DB Schema] Staff lifecycle, 3-tier SaaS fees, and Meta WhatsApp columns verified.');

    // Auto-seed Indian Vehicle Makes and Models if empty or incomplete
    const makeCheck = await db.query('SELECT COUNT(*) FROM makes');
    if (parseInt(makeCheck.rows[0].count, 10) < 15) {
      console.log('[DB Seed] Seeding complete Indian vehicle makes and models...');
      const seedScript = require('./scripts/seedIndianVehiclesHelper');
      await seedScript.runAutoSeed();
    }
  } catch (err) {
    console.error('[DB Schema] Column check error:', err);
  }

  // Auto-restore active WhatsApp Web sessions on boot
  try {
    const db = require('./config/db');
    const whatsappManager = require('./utils/whatsappManager');
    const res = await db.query(`SELECT id FROM garages WHERE whatsapp_status = 'connected' AND whatsapp_provider = 'whatsapp-web'`);
    const activeIds = res.rows.map(r => r.id);
    if (activeIds.length > 0) {
       whatsappManager.restoreSessions(activeIds, async (garageId) => {
           try {
               await db.query(`UPDATE garages SET whatsapp_status = 'disconnected' WHERE id = $1`, [garageId]);
               console.log(`[WhatsApp] Database status updated to disconnected for garage ${garageId}`);
           } catch (err) {
               console.error(`[WhatsApp] Failed to update database status for garage ${garageId}`, err);
           }
       });
    }
  } catch (err) {
    console.error('Failed to auto-restore WhatsApp sessions on boot:', err);
  }
});