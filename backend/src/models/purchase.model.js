const { pool, query } = require('../config/db');
const AppError = require('../utils/AppError');
const { calculateTotal } = require('../utils/payment');

const mergeItems = (items) => {
  const map = new Map();
  for (const it of items) {
    const key = `${it.fruit_id}-${it.packaging_size}-${Number(it.unit_cost)}`;
    const cur = map.get(key);
    if (cur) cur.quantity += Number(it.quantity);
    else map.set(key, { fruit_id: Number(it.fruit_id), packaging_size: it.packaging_size, quantity: Number(it.quantity), unit_price: Number(it.unit_cost) });
  }
  return [...map.values()];
};

exports.findAll = () => query(`SELECT p.*, s.business_name, s.province,
  (SELECT SUM(quantity) FROM purchase_details d WHERE d.purchase_id = p.purchase_id) AS total_boxes
  FROM purchases p JOIN suppliers s ON s.supplier_id = p.supplier_id ORDER BY p.purchase_date DESC, p.purchase_id DESC`);

exports.findById = async (id) => {
  const [p] = await query('SELECT p.*, s.business_name, s.province FROM purchases p JOIN suppliers s ON s.supplier_id = p.supplier_id WHERE p.purchase_id = ?', [id]);
  if (!p) return null;
  p.items = await query(`SELECT d.*, f.fruit_name, d.quantity * d.unit_cost AS line_total FROM purchase_details d
    JOIN fruits f ON f.fruit_id = d.fruit_id WHERE d.purchase_id = ?`, [id]);
  return p;
};

// Atomic: either every item is saved and stock increased, or nothing changes.
exports.create = async ({ supplier_id, items }) => {
  const conn = await pool.getConnection();
  try {
    await conn.query('BEGIN');
    const [sup] = await conn.query('SELECT supplier_id FROM suppliers WHERE supplier_id = ?', [supplier_id]);
    if (!sup.length) throw new AppError(404, `Supplier ${supplier_id} does not exist`);

    const lines = mergeItems(items);
    const problems = [];
    for (const l of lines) {
      const [f] = await conn.query('SELECT fruit_name, status FROM fruits WHERE fruit_id = ?', [l.fruit_id]);
      if (!f.length) problems.push(`Fruit ${l.fruit_id} does not exist`);
      else if (f[0].status !== 'ACTIVE') problems.push(`${f[0].fruit_name} is inactive and cannot be purchased`);
    }
    if (problems.length) throw new AppError(400, 'Purchase rejected. Nothing was saved.', problems);

    const total = calculateTotal(lines);
    const [p] = await conn.query('INSERT INTO purchases (supplier_id, total_amount) VALUES (?,?)', [supplier_id, total]);
    for (const l of lines) {
      await conn.query('INSERT INTO purchase_details (purchase_id, fruit_id, quantity, unit_cost, packaging_size) VALUES (?,?,?,?,?)',
        [p.insertId, l.fruit_id, l.quantity, l.unit_price, l.packaging_size]);
      // Increase the stock balance for this exact fruit + packaging size.
      await conn.query(`INSERT INTO stock (fruit_id, packaging_size, available_quantity) VALUES (?,?,?)
        ON DUPLICATE KEY UPDATE available_quantity = available_quantity + VALUES(available_quantity)`, [l.fruit_id, l.packaging_size, l.quantity]);
    }
    await conn.query('COMMIT');
    return exports.findById(p.insertId);
  } catch (err) {
    try { await conn.query('ROLLBACK'); } catch (_) { /* connection already gone */ }
    throw err;
  } finally {
    conn.release();
  }
};
