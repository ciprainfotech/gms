// backend/db.js

const { Pool } = require('pg');

// A connection pool is better than a single client for web applications
// as it manages multiple connections automatically.
// Allow cloud SSL proxies (Supabase / Neon)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let poolConfig;

if (process.env.DATABASE_URL) {
  let connStr = process.env.DATABASE_URL.trim();
  if (!connStr.startsWith('postgres://') && !connStr.startsWith('postgresql://')) {
    connStr = 'postgresql://' + connStr;
  }
  // Strip sslmode from URL query parameters so pg uses ssl: { rejectUnauthorized: false }
  connStr = connStr.replace(/\?sslmode=[^&]*/, '').replace(/&sslmode=[^&]*/, '');

  // Handle unencoded @ symbols in passwords inside DATABASE_URL
  // e.g., postgresql://user:pass@word@host:6543/db -> encode pass@word to pass%40word
  try {
    const lastAtIdx = connStr.lastIndexOf('@');
    const schemeEndIdx = connStr.indexOf('://') + 3;
    const credsPart = connStr.substring(schemeEndIdx, lastAtIdx);
    const hostDbPart = connStr.substring(lastAtIdx + 1);

    const firstColonIdx = credsPart.indexOf(':');
    if (firstColonIdx !== -1) {
      const user = credsPart.substring(0, firstColonIdx);
      const rawPassword = credsPart.substring(firstColonIdx + 1);
      const encodedPassword = encodeURIComponent(decodeURIComponent(rawPassword));
      connStr = `postgresql://${user}:${encodedPassword}@${hostDbPart}`;
    }
  } catch (e) {
    console.warn('[DB Config] URL auto-encoding fallback:', e.message);
  }

  poolConfig = {
    connectionString: connStr,
    ssl: {
      rejectUnauthorized: false
    }
  };
} else {
  poolConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_DATABASE || 'gms',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    ssl: (process.env.DB_HOST && !process.env.DB_HOST.includes('localhost')) ? { rejectUnauthorized: false } : false
  };
}

const pool = new Pool(poolConfig);

// We export a query method that will be used by our routes
module.exports = {
  query: (text, params) => pool.query(text, params),

   /**
   * For running transactions. This gets a dedicated client from the pool.
   * This is the function that was missing, which is needed for BEGIN, COMMIT, and ROLLBACK.
   * @returns {Promise<object>} A client connection object.
   */
  getClient: () => pool.connect(),
};
