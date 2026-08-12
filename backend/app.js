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

const app = express();

// --- Middleware ---

// Configure CORS to allow React app to communicate with backend
app.use(cors({
  origin: ['http://localhost:5173', 'https://localhost:5173', 'http://localhost:3005'],
  credentials: true,
}));

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
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/staff', staffRoutes);



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