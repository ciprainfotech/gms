require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

// Suppress Windows EBUSY file lock crashes from WhatsApp session logouts
process.on('uncaughtException', (err) => {
  if (err && err.message && (err.message.includes('EBUSY') || err.message.includes('wwebjs_auth') || err.message.includes('resource busy'))) {
    console.warn('⚠️ [Server Warning] Suppressed Windows EBUSY session file lock error:', err.message);
    return;
  }
  console.error('CRITICAL UNCAUGHT EXCEPTION:', err);
});

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
app.set('trust proxy', 1);

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

// --- Render Production Auto-Awaker & Health Check Routes ---
app.get(['/ping', '/api/health', '/healthz', '/api/keep-alive'], (req, res) => {
  res.status(200).json({
    status: 'awake',
    message: 'Render Production Server is active and awake 24/7!',
    serverTime: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`
  });
});



// --- Basic Error Handling ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'An internal server error occurred.' });
});

app.use((req, res, next) => {
    console.log(`Request received for path: ${req.path}`);
    next();
});

// --- Start the Server with Socket.io Bridge Support ---
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const bridgeSockets = {};
global.bridgeSockets = bridgeSockets;
app.set('bridgeSockets', bridgeSockets);

io.use(async (socket, next) => {
  const isAgent = socket.handshake.query.isAgent === 'true' || socket.handshake.query.isAgent === true;
  if (!isAgent) return next(); // Web clients bypass this secret check

  const garageId = socket.handshake.query.garageId;
  const agentSecret = socket.handshake.query.agentSecret;

  if (!garageId || !agentSecret) {
    return next(new Error('Authentication error: Missing garageId or agentSecret'));
  }

  try {
    const db = require('./config/db');
    const { rows } = await db.query('SELECT whatsapp_agent_secret FROM garages WHERE id = $1', [garageId]);
    if (rows.length === 0 || rows[0].whatsapp_agent_secret !== agentSecret) {
      console.warn(`⚠️ Unauthorized Agent Connection Attempt for Garage ${garageId}`);
      return next(new Error('Authentication error: Invalid agentSecret'));
    }
    next();
  } catch (err) {
    console.error('Socket DB Auth Error:', err);
    next(new Error('Authentication error: Internal error'));
  }
});

io.on('connection', (socket) => {
  const garageId = socket.handshake.query.garageId || socket.handshake.headers['x-garage-id'];
  const isAgent = socket.handshake.query.isAgent === 'true' || socket.handshake.query.isAgent === true;

  if (garageId) {
    // Join room for this garage (so Web UI & Agent share a real-time room)
    socket.join(`garage_${garageId}`);

    if (isAgent) {
      console.log(`⚡ [Socket.io Bridge] Garage ${garageId} Agent Connected (Socket ID: ${socket.id})`);
      bridgeSockets[String(garageId)] = socket;
      bridgeSockets[Number(garageId)] = socket;

      // Instantly notify web app room that agent connected
      io.to(`garage_${garageId}`).emit('saas_status_changed', { garageId, isAgentConnected: true });

      // Auto-flush any pending queued_for_bridge messages sitting in database
      (async () => {
        try {
          const db = require('./config/db');
          const pending = await db.query(
            `SELECT * FROM whatsapp_logs WHERE garage_id = $1 AND status = 'queued_for_bridge' ORDER BY id ASC LIMIT 20`,
            [garageId]
          );
          if (pending.rows.length > 0) {
            console.log(`📦 [Auto-Flush] Re-dispatching ${pending.rows.length} pending queued messages for Garage #${garageId}...`);
            for (const job of pending.rows) {
              socket.emit('send_whatsapp_message', {
                id: job.id,
                recipient_phone: job.recipient_phone,
                message_text: job.message_text,
                media_base64: job.media_base64,
                document_name: job.document_name
              });
              await new Promise(r => setTimeout(r, 1200));
            }
          }
        } catch (e) {}
      })();

      socket.on('disconnect', () => {
        console.log(`🔌 [Socket.io Bridge] Garage ${garageId} Agent Disconnected`);
        if (bridgeSockets[String(garageId)] === socket) delete bridgeSockets[String(garageId)];
        if (bridgeSockets[Number(garageId)] === socket) delete bridgeSockets[Number(garageId)];
        io.to(`garage_${garageId}`).emit('saas_status_changed', { garageId, isAgentConnected: false });
      });
    } else {
      console.log(`🌐 [Socket.io Web Client] Garage ${garageId} Web UI Connected (Socket ID: ${socket.id})`);
    }

    // Handle agent QR Code relay to SaaS Web UI
    socket.on('agent_qr_code', (data) => {
      console.log(`📲 [Socket.io Bridge] Relaying QR Code for Garage ${data.garageId} to SaaS Web UI...`);
      io.to(`garage_${data.garageId}`).emit('saas_qr_ready', data);
      app.set(`qr_code_${data.garageId}`, data.qrCode);
    });

    // Handle agent status change
    socket.on('agent_status_change', async (data) => {
      console.log(`🔔 [Socket.io Bridge] Status change for Garage ${data.garageId}: ${data.status}`);
      try {
        const db = require('./config/db');
        if (data.status === 'disconnected') {
          await db.query(
            `UPDATE garages SET whatsapp_status = $1, whatsapp_phone_number = NULL, updated_at = NOW() WHERE id = $2`,
            [data.status, data.garageId]
          );
        } else {
          await db.query(
            `UPDATE garages SET whatsapp_status = $1, whatsapp_phone_number = COALESCE($2, whatsapp_phone_number), updated_at = NOW() WHERE id = $3`,
            [data.status, data.phoneNumber || null, data.garageId]
          );
        }
      } catch (err) {
        console.error(`[Socket.io Bridge DB Error]:`, err.message);
      }
      io.to(`garage_${data.garageId}`).emit('saas_status_changed', data);
    });

    // Handle job acknowledgement from Agent
    socket.on('job_ack', async (data) => {
      console.log(`✅ [Socket.io Bridge Job Ack] Job #${data.jobId} -> ${data.status}`);
      try {
        const db = require('./config/db');
        if (data.status === 'sent') {
          await db.query(
            `UPDATE whatsapp_logs SET status = 'sent', gateway_msg_id = $1, error_message = NULL WHERE id = $2 AND garage_id = $3`,
            [data.gatewayMsgId || `LOCAL_${Date.now()}`, data.jobId, data.garageId]
          );
        } else {
          await db.query(
            `UPDATE whatsapp_logs SET status = 'failed', error_message = $1 WHERE id = $2 AND garage_id = $3 AND status != 'sent'`,
            [data.errorMessage || 'Dispatch failed on local agent', data.jobId, data.garageId]
          );

          // If the failure was due to unauthenticated / expired session, auto-sync DB and UI state
          if (data.errorMessage && (data.errorMessage.includes('not authenticated') || data.errorMessage.includes('Session expired') || data.errorMessage.includes('Evaluation failed'))) {
            await db.query(
              `UPDATE garages SET whatsapp_status = 'disconnected', whatsapp_phone_number = NULL, updated_at = NOW() WHERE id = $1`,
              [data.garageId]
            );
            io.to(`garage_${data.garageId}`).emit('saas_status_changed', { garageId: data.garageId, status: 'disconnected', isAgentConnected: true });
          }
        }
      } catch (err) {
        console.error(`[Socket.io Bridge Job Ack Error]:`, err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`⚠️ [Socket.io Bridge] Garage ${garageId} Agent Disconnected`);
      if (bridgeSockets[garageId]?.id === socket.id) {
        delete bridgeSockets[garageId];
      }
    });
  }
});

app.set('io', io);
app.set('bridgeSockets', bridgeSockets);

const PORT = process.env.PORT || 5001;
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server & Socket.io Real-Time Bridge running on port ${PORT} (Strict isAgent Socket Filter Active)`);

  // --- Render 24/7 Auto-Awaker Self-Pinger ---
  const selfPingUrl = process.env.RENDER_EXTERNAL_URL
    ? `${process.env.RENDER_EXTERNAL_URL.replace(/\/$/, '')}/ping`
    : 'https://cipra-gms.onrender.com/ping';

  console.log(`[Auto-Awaker] Initialized 24/7 self-ping loop targeting: ${selfPingUrl}`);
  setInterval(async () => {
    try {
      const pingRes = await fetch(selfPingUrl);
      if (pingRes.ok) {
        console.log(`⚡ [Auto-Awaker] Self-ping successful at ${new Date().toLocaleTimeString()}! Server awake.`);
      }
    } catch (pingErr) {
      console.warn(`⚠️ [Auto-Awaker] Self-ping heartbeat failed:`, pingErr.message);
    }
  }, 14 * 60 * 1000); // 14 minutes
  
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
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS enforce_stock_validation BOOLEAN DEFAULT TRUE;
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS bank_account_no VARCHAR(50);
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS bank_ifsc VARCHAR(20);
      ALTER TABLE garages ADD COLUMN IF NOT EXISTS tagline VARCHAR(255);

      -- Vehicles table schema integrity
      ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS color VARCHAR(50);
      ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vin VARCHAR(100);
      ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(50);
      ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS year INTEGER;

      -- Payments table schema integrity
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      -- WhatsApp logs table & columns schema integrity
      CREATE TABLE IF NOT EXISTS whatsapp_logs (
          id SERIAL PRIMARY KEY,
          garage_id INTEGER REFERENCES garages(id) ON DELETE CASCADE,
          recipient_phone VARCHAR(50),
          message_type VARCHAR(50),
          gateway_msg_id VARCHAR(100),
          cost_deducted DECIMAL(10,2) DEFAULT 0.00,
          balance_after DECIMAL(10,2) DEFAULT 0.00,
          status VARCHAR(50) DEFAULT 'sent',
          error_message TEXT,
          message_text TEXT,
          media_base64 TEXT,
          document_name VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      ALTER TABLE whatsapp_logs ADD COLUMN IF NOT EXISTS message_text TEXT;
      ALTER TABLE whatsapp_logs ADD COLUMN IF NOT EXISTS media_base64 TEXT;
      ALTER TABLE whatsapp_logs ADD COLUMN IF NOT EXISTS document_name VARCHAR(255);
      ALTER TABLE whatsapp_logs ADD COLUMN IF NOT EXISTS gateway_msg_id VARCHAR(100);
      ALTER TABLE whatsapp_logs ADD COLUMN IF NOT EXISTS cost_deducted DECIMAL(10,2) DEFAULT 0.00;
      ALTER TABLE whatsapp_logs ADD COLUMN IF NOT EXISTS balance_after DECIMAL(10,2) DEFAULT 0.00;
      ALTER TABLE whatsapp_logs ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'sent';
      ALTER TABLE whatsapp_logs ADD COLUMN IF NOT EXISTS error_message TEXT;
    `);
    console.log('[DB Schema] Staff lifecycle, 3-tier SaaS fees, Vehicles, Meta & Local WhatsApp logs columns verified.');

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