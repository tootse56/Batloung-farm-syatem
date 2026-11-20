require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { testConnection, query } = require('./src/config/db');
const routes = require('./src/routes');
const { notFound, errorHandler } = require('./src/middleware/errorHandler');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'degraded', database: 'unreachable', message: 'Database is currently unavailable' });
  }
});

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

// Last-resort guards: log, never crash.
process.on('unhandledRejection', (r) => console.error('Unhandled rejection:', r));
process.on('uncaughtException', (e) => console.error('Uncaught exception:', e));

const PORT = Number(process.env.PORT) || 5000;

// Existing hosted databases may pre-date the vendor map. Ensure its coordinate
// columns exist before accepting requests that create or update vendors.
async function ensureVendorCoordinateColumns() {
  try {
    const rows = await query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendors'
         AND COLUMN_NAME IN ('latitude', 'longitude')`
    );
    const existing = new Set(rows.map((row) => row.COLUMN_NAME));
    if (!existing.has('latitude')) {
      await query('ALTER TABLE vendors ADD COLUMN latitude DECIMAL(9,6) NULL AFTER location');
      console.log('Database update: added vendors.latitude');
    }
    if (!existing.has('longitude')) {
      await query('ALTER TABLE vendors ADD COLUMN longitude DECIMAL(9,6) NULL AFTER latitude');
      console.log('Database update: added vendors.longitude');
    }
  } catch (err) {
    // Keep the API available if the database is temporarily offline. The
    // regular request error handler will report database errors to the client.
    console.error('Could not verify vendor map columns:', err.code || err.message);
  }
}

(async () => {
  await testConnection();
  await ensureVendorCoordinateColumns();
  app.listen(PORT, () => {
    console.log(`Batloung Farm API listening on http://localhost:${PORT}`);
  });
})();

module.exports = app;
