/**
 * =====================================================================
 * AutoCare PRO / GMS - Local Workshop WhatsApp Bridge Client
 * =====================================================================
 * Run this lightweight script on your workshop computer to connect your
 * existing WhatsApp phone number to your Render SaaS web application.
 * 
 * Usage:
 *   node garage-whatsapp-bridge.js --garageId=YOUR_GARAGE_ID --serverUrl=https://cipra-gms.onrender.com
 * =====================================================================
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const http = require('https');
const httpRaw = require('http');
const path = require('path');
const fs = require('fs');

// Read command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace(/^--/, '').split('=');
  if (key && value) acc[key] = value;
  return acc;
}, {});

const SERVER_URL = (args.serverUrl || process.env.SERVER_URL || 'https://cipra-gms.onrender.com').replace(/\/$/, '');
const GARAGE_ID = args.garageId || process.env.GARAGE_ID;
const POLL_INTERVAL_MS = parseInt(args.interval || '4000', 10);

if (!GARAGE_ID) {
  console.error('\n❌ ERROR: Garage ID is required!');
  console.log('Usage: node garage-whatsapp-bridge.js --garageId=YOUR_GARAGE_ID\n');
  process.exit(1);
}

console.log('================================================================');
console.log('🚗 AutoCare GMS - Local Workshop WhatsApp Bridge');
console.log(`🏢 Garage ID: ${GARAGE_ID}`);
console.log(`🌐 Server Target: ${SERVER_URL}`);
console.log('================================================================\n');

// Initialize Local WhatsApp Web Client
const client = new Client({
  authStrategy: new LocalAuth({
    clientId: `local_garage_${GARAGE_ID}`,
    dataPath: path.join(__dirname, '.local_wwebjs_auth')
  }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  }
});

let isReady = false;

client.on('qr', (qr) => {
  console.log('\n📲 SCAN THIS QR CODE WITH YOUR WHATSAPP PHONE (Linked Devices):');
  qrcode.generate(qr, { small: true });
});

const io = require('socket.io-client');

let socket = null;

function setupSocketConnection() {
  try {
    socket = io(SERVER_URL, {
      query: { garageId: GARAGE_ID },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('⚡ Socket.io Real-Time Tunnel Connected to Render Cloud!');
    });

    socket.on('send_whatsapp_message', async (job) => {
      if (!isReady) return;
      console.log(`\n⚡ [REAL-TIME INSTANT EVENT] Job #${job.id} -> ${job.recipient_phone}`);
      await processSingleJob(job);
    });

    socket.on('disconnect', () => {
      console.log('⚠️ Socket.io Tunnel Disconnected. Falling back to HTTP polling.');
    });
  } catch (err) {
    console.error('Socket connection error:', err.message);
  }
}

client.on('ready', () => {
  isReady = true;
  console.log('\n✅ LOCAL WHATSAPP BRIDGE IS READY AND CONNECTED!');
  console.log('📡 Listening for outgoing messages from Render Cloud Server...\n');
  setupSocketConnection();
  startPollingQueue();
});

client.on('authenticated', () => {
  console.log('🔒 WhatsApp Session Authenticated Successfully!');
});

client.on('auth_failure', (msg) => {
  console.error('❌ Authentication Failure:', msg);
});

client.on('disconnected', (reason) => {
  isReady = false;
  console.log('⚠️ WhatsApp Session Disconnected:', reason);
});

client.initialize();

// Helper to make HTTP/HTTPS API Requests
function makeApiRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = `${SERVER_URL}${endpoint}`;
    const isHttps = url.startsWith('https');
    const httpLib = isHttps ? http : httpRaw;

    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-garage-id': GARAGE_ID
      }
    };

    const req = httpLib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          resolve({ raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Queue Polling Loop
async function startPollingQueue() {
  setInterval(async () => {
    if (!isReady) return;

    try {
      const response = await makeApiRequest(`/api/whatsapp/bridge/pending?garageId=${GARAGE_ID}`);
      
      if (response && response.success && response.jobs && response.jobs.length > 0) {
        for (const job of response.jobs) {
          console.log(`\n📤 Processing Dispatch Job #${job.id} -> Recipient: ${job.recipient_phone}`);
          await processSingleJob(job);
        }
      }
    } catch (err) {
      // Quiet fail on network retry
    }
  }, POLL_INTERVAL_MS);
}

// Process and send a single WhatsApp message
async function processSingleJob(job) {
  try {
    let cleanPhone = job.recipient_phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
    const chatId = `${cleanPhone}@c.us`;

    let sentMsgId = null;

    if (job.media_base64) {
      const { MessageMedia } = require('whatsapp-web.js');
      let mimeType = 'application/pdf';
      let rawBase64 = job.media_base64;

      if (job.media_base64.startsWith('data:')) {
        const matches = job.media_base64.match(/^data:([a-zA-Z0-9-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          rawBase64 = matches[2];
        }
      }

      const media = new MessageMedia(mimeType, rawBase64, job.document_name || 'Document.pdf');
      const res = await client.sendMessage(chatId, media, { caption: job.message_text });
      sentMsgId = res.id.id;
    } else {
      const res = await client.sendMessage(chatId, job.message_text);
      sentMsgId = res.id.id;
    }

    console.log(`✅ Message #${job.id} sent successfully! (ID: ${sentMsgId})`);

    // Acknowledge completion back to server
    await makeApiRequest('/api/whatsapp/bridge/ack', 'POST', {
      jobId: job.id,
      garageId: GARAGE_ID,
      status: 'sent',
      gatewayMsgId: sentMsgId
    });

  } catch (err) {
    console.error(`❌ Failed to send Job #${job.id}:`, err.message);

    await makeApiRequest('/api/whatsapp/bridge/ack', 'POST', {
      jobId: job.id,
      garageId: GARAGE_ID,
      status: 'failed',
      errorMessage: err.message
    });
  }
}
