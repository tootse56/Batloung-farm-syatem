const { pool, query } = require('../config/db');
const { SIZES } = require('../config/constants');

exports.findAll = (includeInactive = false) =>
  query(`SELECT * FROM fruits ${includeInactive ? '' : "WHERE status = 'ACTIVE'"} ORDER BY fruit_name`);
exports.findById = async (id) => (await query('SELECT * FROM fruits WHERE fruit_id = ?', [id]))[0];

// Creating a fruit also creates its three stock rows (SMALL / MEDIUM / LARGE) in one transaction.
exports.create = async ({ fruit_name, description, status, prices = {} }) => {
  const conn = await pool.getConnection();
  try {
    await conn.query('BEGIN');
    const [r] = await conn.query('INSERT INTO fruits (fruit_name, description, status) VALUES (?,?,?)',
      [fruit_name.trim(), description || null, status || 'ACTIVE']);
    for (const size of SIZES) {
      await conn.query('INSERT INTO stock (fruit_id, packaging_size, available_quantity, selling_price) VALUES (?,?,0,?)',
        [r.insertId, size, Number(prices[size]) || 0]);
    }
    await conn.query('COMMIT');
    return exports.findById(r.insertId);
  } catch (err) {
    try { await conn.query('ROLLBACK'); } catch (_) { /* connection already gone */ }
    throw err;
  } finally {
    conn.release();
  }
};

exports.update = async (id, data) => {
  const cur = await exports.findById(id);
  if (!cur) return null;
  const m = { ...cur, ...data };
  await query('UPDATE fruits SET fruit_name=?, description=?, status=? WHERE fruit_id=?', [m.fruit_name, m.description, m.status, id]);
  if (data.prices) {
    for (const size of SIZES) {
      if (data.prices[size] !== undefined) await query('UPDATE stock SET selling_price=? WHERE fruit_id=? AND packaging_size=?', [Number(data.prices[size]), id, size]);
    }
  }
  return exports.findById(id);
};
