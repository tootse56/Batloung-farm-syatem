const DB_DOWN = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'PROTOCOL_CONNECTION_LOST', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR', 'ECONNRESET', 'ER_NO_DB_ERROR'];

function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.status) return res.status(err.status).json({ success: false, message: err.message, details: err.details });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ success: false, message: 'Request body is not valid JSON' });
  if (DB_DOWN.includes(err.code)) {
    console.error('DB unavailable:', err.code);
    return res.status(503).json({ success: false, message: 'Database is currently unavailable. Check the connection settings and try again.' });
  }
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'A record with the same unique value already exists' });
  if (err.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ success: false, message: 'This record is in use by other records and cannot be deleted' });
  if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ success: false, message: 'A referenced record does not exist' });
  if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') return res.status(400).json({ success: false, message: 'A value violates a database constraint' });
  console.error(err);
  res.status(500).json({ success: false, message: 'Unexpected server error' });
}

module.exports = { notFound, errorHandler };
