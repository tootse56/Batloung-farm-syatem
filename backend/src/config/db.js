require('dotenv').config();
const mysql = require('mysql2/promise');

// Pools connect lazily, so a missing/unreachable database never crashes the process.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
   connectTimeout: 10000,
  decimalNumbers: true,
  ssl: process.env.DB_SSL === 'true'
    ? { minVersion: 'TLSv1.2' }
    : undefined,
});

async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('MySQL connected');
    return true;
  } catch (err) {
    console.error(`MySQL connection failed (${err.code || err.message}). The API stays up and will retry on each request.`);
    return false;
  }
}

module.exports = { pool, query, testConnection };
