/**
 * 🚗 SAMAN MOTORS GARAGE MANAGEMENT SYSTEM
 * Local Workshop WhatsApp Bridge Agent (Production Remote-Control Edition)
 * 
 * GARAGE NAME: {{GARAGE_NAME}}
 * GARAGE ID: {{GARAGE_ID}}
 * 
 * INSTRUCTIONS:
 * 1. Keep this script running on your workshop computer.
 * 2. You NEVER need to touch this script again!
 * 3. Generate QR codes, view live timers, and disconnect 100% directly from your SaaS Settings Web App!
 */

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const io = require('socket.io-client');

// Auto-injected tenant credentials
const GARAGE_ID = {{GARAGE_ID}};
const GARAGE_NAME = {{GARAGE_NAME}};
const BACKEND_URL = '{{BACKEND_URL}}';
const SOCKET_URL = '{{SOCKET_URL}}';
const AGENT_SECRET = '{{AGENT_SECRET}}';

console.log('=================================================================');
console.log(`🚗 Workshop WhatsApp Agent Initializing for: ${GARAGE_NAME}`);
console.log(`🆔 Garage ID: ${GARAGE_ID}`);
console.log(`🌐 Cloud Server: ${SOCKET_URL}`);
console.log('=================================================================');

let client = null;
let isInitializing = false;

// 1. Establish real-time WebSocket tunnel to Render Cloud
const socket = io(SOCKET_URL, {
  query: { garageId: GARAGE_ID, isAgent: 'true', agentSecret: AGENT_SECRET },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 2000,
  rejectUnauthorized: false
});

socket.on('connect', () => {
  console.log(`⚡ [Tunnel Connected] Linked to SaaS Cloud Server (Garage ID: ${GARAGE_ID})`);
  // Report agent online status
  socket.emit('agent_online', { garageId: GARAGE_ID });
});

socket.on('disconnect', () => {
  console.log(`⚠️ [Tunnel Disconnected] Retrying connection to SaaS Cloud...`);
});

// Defensive global error traps to prevent agent process from exiting on detached Chrome frame errors
process.on('uncaughtException', (err) => {
  console.log('⚠️ [Agent Trap] Handled Chrome event:', err.message);
  isInitializing = false;
  if (client) {
    try { client.destroy().catch(() => {}); } catch (e) {}
    client = null;
  }
  socket.emit('agent_status_change', { garageId: GARAGE_ID, status: 'disconnected' });
});

process.on('unhandledRejection', (reason) => {
  console.log('⚠️ [Agent Trap] Handled background promise:', reason?.message || reason);
});

socket.on('request_agent_qr', () => {
  console.log(`📲 [SaaS Request] SaaS Web UI requested QR code. Initializing WhatsApp Web Chrome...`);
  initWhatsAppClient();
});

// Helper to initialize Local Chrome WhatsApp Web Client
const initWhatsAppClient = () => {
  if (client || isInitializing) return client;
  isInitializing = true;
  console.log(`[WhatsApp Agent] Booting local headless Chrome...`);

  client = new Client({
    authStrategy: new LocalAuth({
      clientId: `workshop_agent_garage_${GARAGE_ID}`
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    }
  });

  client.on('qr', async (qr) => {
    console.log(`📲 [QR Generated] Transmitting QR code to SaaS Web Settings UI...`);
    try {
      const qrcode = require('qrcode');
      const dataUrl = await qrcode.toDataURL(qr);
      socket.emit('agent_qr_code', { garageId: GARAGE_ID, qrCode: dataUrl });
    } catch (err) {
      console.error(`[QR Error] Failed to encode QR image:`, err.message);
    }
  });

  client.on('ready', async () => {
    isInitializing = false;
    const phone = client.info?.wid?.user || client.info?.me?.user || null;
    console.log(`✅ [WhatsApp Ready] Workshop WhatsApp ACTIVE for ${GARAGE_NAME} (${phone || 'Connected'})!`);
    socket.emit('agent_status_change', {
      garageId: GARAGE_ID,
      status: 'connected',
      phoneNumber: phone
    });
  });

  client.on('authenticated', () => {
    console.log(`🔑 [Authenticated] WhatsApp session validated! Updating SaaS Web Status...`);
    socket.emit('agent_status_change', {
      garageId: GARAGE_ID,
      status: 'connected'
    });
  });

  client.on('auth_failure', (msg) => {
    isInitializing = false;
    console.error(`❌ [Auth Failure] Session expired or invalid:`, msg);
    socket.emit('agent_status_change', { garageId: GARAGE_ID, status: 'disconnected' });
  });

  client.on('disconnected', (reason) => {
    isInitializing = false;
    console.log(`⚠️ [Disconnected] WhatsApp session closed:`, reason);
    socket.emit('agent_status_change', { garageId: GARAGE_ID, status: 'disconnected' });
    if (client) {
      client.destroy().catch(() => {});
      client = null;
    }
  });

  client.initialize().catch((err) => {
    isInitializing = false;
    console.error(`❌ [Init Error] Chrome failed to launch:`, err.message);
    client = null;
  });

  return client;
};

// 2. REMOTE CONTROL: Remote QR Generation Request from SaaS Web UI
socket.on('agent_generate_qr', () => {
  console.log(`📩 [Remote Command] SaaS Web Settings requested QR Code generation...`);
  if (!client) {
    initWhatsAppClient();
  } else if (client.info) {
    console.log(`ℹ️ Client already connected.`);
    socket.emit('agent_status_change', {
      garageId: GARAGE_ID,
      status: 'connected',
      phoneNumber: client.info.wid?.user || client.info.me?.user
    });
  }
});

// 3. REMOTE CONTROL: Remote Disconnect Request from SaaS Web UI
socket.on('agent_disconnect', async () => {
  console.log(`📩 [Remote Command] SaaS Web Settings requested Disconnect...`);
  if (client) {
    try {
      await client.logout();
      await client.destroy();
      console.log(`[WhatsApp Agent] Client logged out and destroyed.`);
    } catch (e) {
      console.error(`[WhatsApp Agent] Error destroying client:`, e.message);
    }
    client = null;
  }
  
  // Clean session folder
  const fs = require('fs');
  const path = require('path');
  const sessionPath = path.join(__dirname, `.wwebjs_auth/session-workshop_agent_garage_${GARAGE_ID}`);
  if (fs.existsSync(sessionPath)) {
    try {
      fs.rmSync(sessionPath, { recursive: true, force: true });
      console.log(`[WhatsApp Agent] Session directory cleaned.`);
    } catch (err) {
      console.error(`[WhatsApp Agent] Failed to clean session dir:`, err.message);
    }
  }

  socket.emit('agent_status_change', { garageId: GARAGE_ID, status: 'disconnected' });
});

// 4. MESSAGE DISPATCH: Process real-time dispatches from SaaS Web UI
socket.on('send_whatsapp_message', async (job) => {
  console.log(`📩 [Dispatch Job #${job.id}] Sending to ${job.recipient_phone}...`);
  
  if (!client || !client.info) {
    console.error(`❌ [Dispatch Failed] WhatsApp client not ready on this PC.`);
    socket.emit('job_ack', {
      jobId: job.id,
      garageId: GARAGE_ID,
      status: 'failed',
      errorMessage: 'Local Workshop PC agent WhatsApp is not authenticated.'
    });
    return;
  }

  try {
    // Anti-ban random human typing delay (2.0s - 4.0s)
    const delayMs = Math.floor(Math.random() * 2000) + 2000;
    await new Promise((r) => setTimeout(r, delayMs));

    const chatId = `${job.recipient_phone}@c.us`;
    let sentMsg = null;

    if (job.media_base64) {
      let rawBase64 = job.media_base64;
      let mimeType = 'application/pdf';
      if (job.media_base64.startsWith('data:')) {
        const parts = job.media_base64.split(';base64,');
        mimeType = parts[0].replace('data:', '');
        rawBase64 = parts[1];
      }
      const media = new MessageMedia(mimeType, rawBase64, job.document_name || 'Document.pdf');
      sentMsg = await client.sendMessage(chatId, media, { caption: job.message_text });
    } else {
      sentMsg = await client.sendMessage(chatId, job.message_text);
    }

    const gatewayMsgId = sentMsg?.id?._serialized || `LOCAL_AGENT_${Date.now()}`;
    console.log(`✅ [Job #${job.id} Sent] ID: ${gatewayMsgId}`);

    // Report success to cloud backend
    socket.emit('job_ack', {
      jobId: job.id,
      garageId: GARAGE_ID,
      status: 'sent',
      gatewayMsgId
    });

  } catch (err) {
    console.error(`❌ [Job #${job.id} Error]:`, err.message);
    socket.emit('job_ack', {
      jobId: job.id,
      garageId: GARAGE_ID,
      status: 'failed',
      errorMessage: err.message || 'Dispatch error on Local PC Agent'
    });
  }
});

// Auto-boot client if saved session exists on disk
const path = require('path');
const fs = require('fs');
const savedSession = path.join(__dirname, `.wwebjs_auth/session-workshop_agent_garage_${GARAGE_ID}`);
if (fs.existsSync(savedSession)) {
  console.log(`📂 [Saved Session Found] Auto-restoring WhatsApp Web connection...`);
  initWhatsAppClient();
} else {
  console.log(`ℹ️ [Ready] Waiting for "Generate QR Code" command from your SaaS Web Settings screen...`);
}
