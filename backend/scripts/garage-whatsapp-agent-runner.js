/**
 * 🚗 SAMAN MOTORS GARAGE MANAGEMENT SYSTEM
 * Universal Standalone Workshop WhatsApp Agent Executable Runner
 * 
 * Works out of the box on any Windows PC without Node.js installed!
 */

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const io = require('socket.io-client');
const fs = require('fs');
const path = require('path');

let config = {
  garageId: 1,
  garageName: 'Saman Motors',
  backendUrl: 'http://localhost:5001/api',
  socketUrl: 'http://localhost:5001'
};

// Try loading local config.json if present
const configPath = path.join(__dirname, 'config.json');
const exeConfigPath = path.join(process.cwd(), 'config.json');

if (fs.existsSync(configPath)) {
  try {
    config = { ...config, ...JSON.parse(fs.readFileSync(configPath, 'utf8')) };
  } catch (e) {}
} else if (fs.existsSync(exeConfigPath)) {
  try {
    config = { ...config, ...JSON.parse(fs.readFileSync(exeConfigPath, 'utf8')) };
  } catch (e) {}
}

const GARAGE_ID = config.garageId;
const GARAGE_NAME = config.garageName;
const BACKEND_URL = config.backendUrl;
const SOCKET_URL = config.socketUrl;

console.log('=================================================================');
console.log(`🚗 Workshop WhatsApp Agent (.EXE Edition) Initializing...`);
console.log(`🏢 Garage Name: ${GARAGE_NAME}`);
console.log(`🆔 Garage ID: ${GARAGE_ID}`);
console.log(`🌐 SaaS Server: ${SOCKET_URL}`);
console.log('=================================================================');

let client = null;
let isInitializing = false;

// Connect Socket.io tunnel to Render Cloud
const socket = io(SOCKET_URL, {
  query: { garageId: GARAGE_ID, isAgent: 'true' },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 2000
});

socket.on('connect', () => {
  console.log(`⚡ [Tunnel Connected] Linked to SaaS Cloud Server (Garage ID: ${GARAGE_ID})`);
  socket.emit('agent_online', { garageId: GARAGE_ID });
});

socket.on('disconnect', () => {
  console.log(`⚠️ [Tunnel Disconnected] Retrying connection to SaaS Cloud...`);
});

const initWhatsAppClient = () => {
  if (client || isInitializing) return client;
  isInitializing = true;
  console.log(`[WhatsApp Agent] Launching local headless Chrome...`);

  client = new Client({
    authStrategy: new LocalAuth({
      clientId: `workshop_exe_garage_${GARAGE_ID}`,
      dataPath: path.join(process.cwd(), '.wwebjs_auth')
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
    console.log(`🔑 [Authenticated] WhatsApp session validated.`);
  });

  client.on('auth_failure', (msg) => {
    isInitializing = false;
    console.error(`❌ [Auth Failure] Session expired:`, msg);
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

// Remote QR generation command from SaaS Web UI
socket.on('agent_generate_qr', () => {
  console.log(`📩 [Remote Command] SaaS Web Settings requested QR Code generation...`);
  if (!client) {
    initWhatsAppClient();
  } else if (client.info) {
    socket.emit('agent_status_change', {
      garageId: GARAGE_ID,
      status: 'connected',
      phoneNumber: client.info.wid?.user || client.info.me?.user
    });
  }
});

// Remote Disconnect command from SaaS Web UI
socket.on('agent_disconnect', async () => {
  console.log(`📩 [Remote Command] SaaS Web Settings requested Disconnect...`);
  if (client) {
    try {
      await client.destroy();
    } catch (e) {}
    client = null;
  }
  
  const sessionPath = path.join(process.cwd(), `.wwebjs_auth/session-workshop_exe_garage_${GARAGE_ID}`);
  if (fs.existsSync(sessionPath)) {
    try {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    } catch (err) {}
  }

  socket.emit('agent_status_change', { garageId: GARAGE_ID, status: 'disconnected' });
});

// Process dispatches
socket.on('send_whatsapp_message', async (job) => {
  console.log(`📩 [Dispatch Job #${job.id}] Sending to ${job.recipient_phone}...`);
  
  if (!client || !client.info) {
    socket.emit('job_ack', {
      jobId: job.id,
      garageId: GARAGE_ID,
      status: 'failed',
      errorMessage: 'Workshop PC agent WhatsApp is not authenticated.'
    });
    return;
  }

  try {
    // Anti-ban human typing delay (2.0s - 4.0s)
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

    const gatewayMsgId = sentMsg?.id?._serialized || `LOCAL_EXE_${Date.now()}`;
    console.log(`✅ [Job #${job.id} Sent] ID: ${gatewayMsgId}`);

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
      errorMessage: err.message || 'Dispatch error on Workshop PC Agent'
    });
  }
});

// Auto-restore saved session
const savedSession = path.join(process.cwd(), `.wwebjs_auth/session-workshop_exe_garage_${GARAGE_ID}`);
if (fs.existsSync(savedSession)) {
  console.log(`📂 [Saved Session Found] Auto-restoring WhatsApp connection...`);
  initWhatsAppClient();
} else {
  console.log(`ℹ️ [Ready] Waiting for "Generate QR Code" command from your SaaS Web Settings UI...`);
}
