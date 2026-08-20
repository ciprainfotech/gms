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
let lastQrCode = null;

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
  socket.emit('agent_online', { garageId: GARAGE_ID });
  if (!client || !client.info) {
    socket.emit('agent_status_change', { garageId: GARAGE_ID, status: 'disconnected', isAgentConnected: true });
  }
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
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled'
      ]
    },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  client.on('qr', async (qr) => {
    console.log(`📲 [QR Generated] Transmitting QR code to SaaS Web Settings UI...`);
    try {
      const qrcode = require('qrcode');
      const dataUrl = await qrcode.toDataURL(qr);
      lastQrCode = dataUrl;
      socket.emit('agent_qr_code', { garageId: GARAGE_ID, qrCode: dataUrl });
    } catch (err) {
      console.error(`[QR Error] Failed to encode QR image:`, err.message);
    }
  });

  client.on('ready', async () => {
    isInitializing = false;
    lastQrCode = null;
    const phone = client.info?.wid?.user || client.info?.me?.user || null;
    console.log(`✅ [WhatsApp Ready] Workshop WhatsApp ACTIVE for ${GARAGE_NAME} (${phone || 'Connected'})!`);
    socket.emit('agent_status_change', {
      garageId: GARAGE_ID,
      status: 'connected',
      phoneNumber: phone
    });
  });

  client.on('authenticated', () => {
    isInitializing = false;
    lastQrCode = null;
    console.log(`🔑 [Authenticated] WhatsApp session validated! Updating SaaS Web Status...`);
    socket.emit('agent_status_change', {
      garageId: GARAGE_ID,
      status: 'connected'
    });
  });

  client.on('auth_failure', (msg) => {
    isInitializing = false;
    lastQrCode = null;
    console.error(`❌ [Auth Failure] Session expired or unlinked:`, msg);
    socket.emit('agent_status_change', { garageId: GARAGE_ID, status: 'disconnected', isAgentConnected: true });
    if (client) {
      try { client.destroy().catch(() => {}); } catch (e) {}
      client = null;
    }
  });

  client.on('disconnected', (reason) => {
    isInitializing = false;
    lastQrCode = null;
    console.log(`⚠️ [Disconnected] WhatsApp session unlinked from phone:`, reason);
    socket.emit('agent_status_change', { garageId: GARAGE_ID, status: 'disconnected', isAgentConnected: true });
    if (client) {
      try { client.destroy().catch(() => {}); } catch (e) {}
      client = null;
    }
  });

  client.initialize().catch((err) => {
    isInitializing = false;
    lastQrCode = null;
    console.error(`❌ [Init Error] Chrome failed to launch:`, err.message);
    client = null;
    socket.emit('agent_status_change', { garageId: GARAGE_ID, status: 'disconnected', isAgentConnected: true });
  });

  return client;
};

// Active Health Check: Polls WhatsApp Web state every 3s to instantly detect when device is unlinked on phone
setInterval(async () => {
  if (client && !isInitializing) {
    try {
      const state = await client.getState().catch(() => null);
      if (!state || state !== 'CONNECTED') {
        console.log(`⚠️ [Unlinked Detected] Session state is ${state || 'DISCONNECTED'}. Syncing yellow status to cloud...`);
        socket.emit('agent_status_change', { garageId: GARAGE_ID, status: 'disconnected', isAgentConnected: true });
        try { await client.destroy().catch(() => {}); } catch (e) {}
        client = null;
      }
    } catch (e) {
      console.log(`⚠️ [Unlinked Detected] Session error. Syncing yellow status to cloud...`);
      socket.emit('agent_status_change', { garageId: GARAGE_ID, status: 'disconnected', isAgentConnected: true });
      try { await client.destroy().catch(() => {}); } catch (e) {}
      client = null;
    }
  }
}, 3000);

// 2. REMOTE CONTROL: Remote QR Generation Request from SaaS Web UI
const handleQrRequest = () => {
  console.log(`📩 [Remote Command] SaaS Web Settings requested QR Code generation...`);
  if (client && client.info) {
    console.log(`ℹ️ Client already connected.`);
    socket.emit('agent_status_change', {
      garageId: GARAGE_ID,
      status: 'connected',
      phoneNumber: client.info.wid?.user || client.info.me?.user
    });
  } else if (lastQrCode) {
    console.log(`📲 [QR Re-emit] Transmitting cached QR code to SaaS Web UI...`);
    socket.emit('agent_qr_code', { garageId: GARAGE_ID, qrCode: lastQrCode });
  } else {
    if (client) {
      try { client.destroy().catch(() => {}); } catch (e) {}
      client = null;
    }
    initWhatsAppClient();
  }
};

socket.on('request_agent_qr', handleQrRequest);
socket.on('agent_generate_qr', handleQrRequest);

// 3. REMOTE CONTROL: Remote Disconnect Request from SaaS Web UI (Unlinks phone automatically)
socket.on('agent_disconnect', async () => {
  console.log(`📩 [Remote Command] SaaS Web Settings requested Disconnect & Phone Unlink...`);
  if (client) {
    try {
      await client.logout().catch(() => {});
      await client.destroy().catch(() => {});
      console.log(`[WhatsApp Agent] Client logged out from phone and destroyed.`);
    } catch (e) {
      console.error(`[WhatsApp Agent] Error logging out client:`, e.message);
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
    } catch (err) {}
  }

  socket.emit('agent_status_change', { garageId: GARAGE_ID, status: 'disconnected', isAgentConnected: true });
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

    // 1. Clean phone number: remove +, spaces, dashes, parentheses
    let cleanPhone = String(job.recipient_phone || '').replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone; // Auto-prepend India country code '91' if 10 digits
    }

    if (!cleanPhone) {
      throw new Error(`Invalid recipient phone number: ${job.recipient_phone}`);
    }

    // 2. Resolve official WhatsApp Number ID via WhatsApp Web directory
    console.log(`🔍 Resolving WhatsApp JID for +${cleanPhone}...`);
    const numberDetails = await client.getNumberId(cleanPhone).catch(() => null);
    const chatId = numberDetails?._serialized || `${cleanPhone}@c.us`;

    // 3. Human typing state simulation for natural delivery
    try {
      const chat = await client.getChatById(chatId).catch(() => null);
      if (chat) {
        await chat.sendStateTyping().catch(() => {});
        const typingDuration = Math.floor(Math.random() * 1500) + 1000;
        await new Promise((r) => setTimeout(r, typingDuration));
        await chat.clearState().catch(() => {});
      }
    } catch (e) {}

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

// Helper: Clear stale Windows Chrome SingletonLock files before launch
const removeStaleLocks = (dirPath) => {
  try {
    const path = require('path');
    const fs = require('fs');
    if (!fs.existsSync(dirPath)) return;
    const lock1 = path.join(dirPath, 'SingletonLock');
    const lock2 = path.join(dirPath, 'Default', 'SingletonLock');
    const lock3 = path.join(dirPath, 'SingletonCookie');
    const lock4 = path.join(dirPath, 'SingletonSocket');
    [lock1, lock2, lock3, lock4].forEach(l => {
      if (fs.existsSync(l)) {
        try { fs.rmSync(l, { force: true }); } catch(e) {}
      }
    });
  } catch(e) {}
};

// Auto-boot client if saved session exists on disk
const path = require('path');
const fs = require('fs');
const savedSession = path.join(__dirname, `.wwebjs_auth/session-workshop_agent_garage_${GARAGE_ID}`);

if (fs.existsSync(savedSession)) {
  console.log(`📂 [Saved Session Found] Auto-restoring WhatsApp Web connection...`);
  removeStaleLocks(savedSession);
  initWhatsAppClient();
} else {
  console.log(`ℹ️ [Ready] Waiting for "Generate QR Code" command from your SaaS Web Settings screen...`);
  setTimeout(() => {
    socket.emit('agent_status_change', { garageId: GARAGE_ID, status: 'disconnected', isAgentConnected: true });
  }, 1000);
}
