const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');

// Safely patch LocalAuth.logout to prevent Windows EBUSY file lock crash
if (LocalAuth && LocalAuth.prototype) {
    const originalLogout = LocalAuth.prototype.logout;
    LocalAuth.prototype.logout = async function () {
        try {
            if (originalLogout) {
                await originalLogout.call(this);
            }
        } catch (e) {
            console.warn('⚠️ [WhatsApp LocalAuth] Suppressed Windows file lock error during logout:', e.message);
        }
    };
}

// In-memory store of active clients (key: garageId)
const clients = {};

/**
 * Initializes a new WhatsApp Web client for a specific garage.
 * Uses LocalAuth to persist the session in the .wwebjs_auth folder.
 * 
 * @param {string} garageId 
 * @param {function} onQr - Callback when QR is ready (receives base64 image data URL)
 * @param {function} onReady - Callback when client is fully authenticated and ready
 * @param {function} onDisconnected - Callback when client gets disconnected
 */
exports.initializeClient = (garageId, onQr, onReady, onDisconnected) => {
    if (clients[garageId]) {
        console.log(`[WhatsApp] Client already exists for garage ${garageId}. Destroying old one.`);
        clients[garageId].destroy().catch(console.error);
        delete clients[garageId];
    }

    console.log(`[WhatsApp] Initializing new client for garage ${garageId}`);

    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: `garage_${garageId}`,
            dataPath: path.join(__dirname, '../.wwebjs_auth')
        }),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote', '--single-process', '--disable-gpu']
        }
    });

    client.on('qr', async (qr) => {
        console.log(`[WhatsApp] QR Code generated for garage ${garageId}`);
        if (onQr) {
            try {
                // Generate base64 data URL for the QR code
                const url = await qrcode.toDataURL(qr);
                onQr(url);
            } catch (err) {
                console.error(`[WhatsApp] Error generating QR code image for garage ${garageId}:`, err);
            }
        }
    });

    client.on('ready', async () => {
        console.log(`[WhatsApp] Client is READY for garage ${garageId}`);
        try {
            const db = require('../config/db');
            const info = client.info;
            const phone = info?.wid?.user || info?.me?.user || null;
            await db.query(
                `UPDATE garages SET whatsapp_status = 'connected', whatsapp_provider = 'whatsapp-web', whatsapp_phone_number = COALESCE($1, whatsapp_phone_number), updated_at = NOW() WHERE id = $2`,
                [phone, garageId]
            );
        } catch (e) {
            console.error(`[WhatsApp] Failed DB update on ready for garage ${garageId}:`, e);
        }
        if (onReady) onReady();
    });

    client.on('authenticated', async () => {
        console.log(`[WhatsApp] Client authenticated for garage ${garageId}`);
        try {
            const db = require('../config/db');
            await db.query(
                `UPDATE garages SET whatsapp_status = 'connected', whatsapp_provider = 'whatsapp-web', updated_at = NOW() WHERE id = $1`,
                [garageId]
            );
        } catch (e) {
            console.error(`[WhatsApp] Failed DB update on authenticated for garage ${garageId}:`, e);
        }
    });

    client.on('auth_failure', msg => {
        console.error(`[WhatsApp] Authentication failure for garage ${garageId}:`, msg);
    });

    client.on('disconnected', (reason) => {
        console.log(`[WhatsApp] Client disconnected for garage ${garageId}:`, reason);
        delete clients[garageId];
        if (onDisconnected) onDisconnected(reason);
    });

    client.initialize().catch(err => {
        console.error(`[WhatsApp] Initialization error for garage ${garageId}:`, err);
        delete clients[garageId];
    });

    clients[garageId] = client;
    return client;
};

/**
 * Gets an active client for a garage.
 * @param {string} garageId 
 * @returns {Client|null}
 */
exports.getClient = (garageId) => {
    return clients[garageId] || null;
};

/**
 * Logs out and destroys the client for a garage.
 * @param {string} garageId 
 */
exports.logoutClient = async (garageId) => {
    const client = clients[garageId];
    if (client) {
        try {
            console.log(`[WhatsApp] Destroying client for garage ${garageId}`);
            // Do NOT call client.logout() as it causes EBUSY crash on Windows LocalAuth.
            // Destroy the client to close the browser and release locks.
            await client.destroy();
        } catch (err) {
            console.error(`[WhatsApp] Error destroying client for garage ${garageId}:`, err);
        }
        delete clients[garageId];

        // Manually clean up the auth folder after a short delay to ensure locks are fully released
        setTimeout(() => {
            try {
                const fs = require('fs');
                const path = require('path');
                const sessionPath = path.join(__dirname, `../.wwebjs_auth/session-garage_${garageId}`);
                if (fs.existsSync(sessionPath)) {
                    fs.rmSync(sessionPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 1000 });
                    console.log(`[WhatsApp] Cleaned up session folder for garage ${garageId}`);
                }
            } catch (cleanupErr) {
                console.error(`[WhatsApp] Failed to clean up session folder for garage ${garageId}:`, cleanupErr.message);
            }
        }, 3000);
    }
};

/**
 * Helper function to restore active sessions on server start
 * (Optional - Can be called when the server boots up if we want to auto-connect garages)
 */
exports.restoreSessions = async (activeGarageIds, onDisconnectedCallback) => {
    console.log(`[WhatsApp] Restoring sessions for ${activeGarageIds.length} active garages...`);
    for (const garageId of activeGarageIds) {
        const sessionPath = path.join(__dirname, `../.wwebjs_auth/session-garage_${garageId}`);
        if (fs.existsSync(sessionPath)) {
            console.log(`[WhatsApp] Found existing session for garage ${garageId}, initializing...`);
            exports.initializeClient(
                garageId,
                null,
                null,
                (reason) => {
                    if (onDisconnectedCallback) onDisconnectedCallback(garageId, reason);
                }
            );
        }
    }
};
