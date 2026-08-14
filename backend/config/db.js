// backend/db.js

const { Pool } = require('pg');

// A connection pool is better than a single client for web applications
// as it manages multiple connections automatically.
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_DATABASE || 'gms',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    };

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
