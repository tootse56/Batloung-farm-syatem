const { pool, query } = require('../config/db');
const AppError = require('../utils/AppError');
const { calculateTotal, paymentStatus, round } = require('../utils/payment');

const mergeItems = (items) => {
  const map = new Map();
  for (const it of items) {
    const key = `${it.fruit_id}-${it.packaging_size}`;
    const cur = map.get(key);
    if (cur) cur.quantity += Number(it.quantity);
    else map.set(key, { fruit_id: Number(it.fruit_id), packaging_size: it.packaging_size, quantity: Number(it.quantity), unit_price: it.unit_price ? Number(it.unit_price) : null });
  }
  return [...map.values()].sort((a, b) => a.fruit_id - b.fruit_id || a.packaging_size.localeCompare(b.packaging_size));
};

exports.findAll = (limit) => query(`SELECT s.*, v.vendor_name, v.phone_number, s.total_amount - s.amount_paid AS outstanding_balance,
  (SELECT SUM(quantity) FROM sales_details d WHERE d.sale_id = s.sale_id) AS total_boxes
  FROM sales s JOIN vendors v ON v.vendor_id = s.vendor_id ORDER BY s.sale_date DESC, s.sale_id DESC ${limit ? 'LIMIT ' + Number(limit) : ''}`);

exports.findById = async (id) => {
  const [s] = await query(`SELECT s.*, v.vendor_name, v.phone_number, s.total_amount - s.amount_paid AS outstanding_balance
    FROM sales s JOIN vendors v ON v.vendor_id = s.vendor_id WHERE s.sale_id = ?`, [id]);
  if (!s) return null;
  s.items = await query(`SELECT d.*, f.fruit_name, d.quantity * d.unit_price AS line_total FROM sales_details d
    JOIN fruits f ON f.fruit_id = d.fruit_id WHERE d.sale_id = ?`, [id]);
  s.payments = await query('SELECT * FROM payments WHERE sale_id = ? ORDER BY payment_date', [id]);
  return s;
};

// Atomic sale: every line must have enough stock, otherwise the WHOLE sale is rolled back.
exports.create = async ({ vendor_id, items, payment_method = 'CASH', amount_paid }) => {
  const conn = await pool.getConnection();
  try {
    await conn.query('BEGIN');
    const [v] = await conn.query('SELECT vendor_id FROM vendors WHERE vendor_id = ?', [vendor_id]);
    if (!v.length) throw new AppError(404, `Vendor ${vendor_id} is not registered`);

    const lines = [];
    const problems = [];
    for (const it of mergeItems(items)) {
      // FOR UPDATE locks the stock row so two simultaneous sales cannot oversell.
      const [rows] = await conn.query(`SELECT st.stock_id, st.available_quantity, st.selling_price, f.fruit_name, f.status
        FROM stock st JOIN fruits f ON f.fruit_id = st.fruit_id WHERE st.fruit_id = ? AND st.packaging_size = ? FOR UPDATE`, [it.fruit_id, it.packaging_size]);
      const row = rows[0];
      if (!row) { problems.push(`Fruit ${it.fruit_id} (${it.packaging_size}) does not exist`); continue; }
      if (row.status !== 'ACTIVE') { problems.push(`${row.fruit_name} is inactive and cannot be sold`); continue; }
      if (it.quantity > row.available_quantity) {
        problems.push(`Insufficient stock for ${row.fruit_name} (${it.packaging_size}): requested ${it.quantity}, available ${row.available_quantity}`);
        continue;
      }
      const unit_price = it.unit_price || row.selling_price;
      if (!(unit_price > 0)) { problems.push(`No selling price set for ${row.fruit_name} (${it.packaging_size})`); continue; }
      lines.push({ ...it, stock_id: row.stock_id, unit_price });
    }
    if (problems.length) throw new AppError(400, 'Sale rejected. No stock was reduced and no sale was recorded.', problems);

    const total = calculateTotal(lines);
    let paid = payment_method === 'CREDIT' ? 0 : amount_paid === undefined ? total : round(amount_paid);
    if (paid > total) throw new AppError(400, `Amount paid (${paid}) is more than the sale total (${total})`);
    const status = paymentStatus(total, paid);

    const [s] = await conn.query('INSERT INTO sales (vendor_id, total_amount, amount_paid, payment_status, payment_method) VALUES (?,?,?,?,?)',
      [vendor_id, total, paid, status, payment_method]);
    for (const l of lines) {
      await conn.query('INSERT INTO sales_details (sale_id, fruit_id, packaging_size, quantity, unit_price) VALUES (?,?,?,?,?)',
        [s.insertId, l.fruit_id, l.packaging_size, l.quantity, l.unit_price]);
      // Guarded decrement: can never push stock below zero.
      const [u] = await conn.query('UPDATE stock SET available_quantity = available_quantity - ? WHERE stock_id = ? AND available_quantity >= ?', [l.quantity, l.stock_id, l.quantity]);
      if (u.affectedRows !== 1) throw new AppError(400, 'Sale rejected: stock changed while processing. Please retry.');
    }
    if (paid > 0) await conn.query('INSERT INTO payments (sale_id, amount, method) VALUES (?,?,?)', [s.insertId, paid, payment_method]);
    await conn.query('COMMIT');
    return exports.findById(s.insertId);
  } catch (err) {
    try { await conn.query('ROLLBACK'); } catch (_) { /* connection already gone */ }
    throw err;
  } finally {
    conn.release();
  }
};

// Record a later payment (cash / mobile money) against an unpaid or partly paid sale.
exports.addPayment = async (saleId, { amount, method }) => {
  const conn = await pool.getConnection();
  try {
    await conn.query('BEGIN');
    const [rows] = await conn.query('SELECT total_amount, amount_paid FROM sales WHERE sale_id = ? FOR UPDATE', [saleId]);
    if (!rows.length) throw new AppError(404, `Sale ${saleId} not found`);
    const balance = round(rows[0].total_amount - rows[0].amount_paid);
    const amt = round(amount);
    if (balance <= 0) throw new AppError(400, 'This sale is already fully paid');
    if (amt > balance) throw new AppError(400, `Payment of ${amt} exceeds the outstanding balance of ${balance}`);
    const newPaid = round(rows[0].amount_paid + amt);
    await conn.query('INSERT INTO payments (sale_id, amount, method) VALUES (?,?,?)', [saleId, amt, method]);
    await conn.query('UPDATE sales SET amount_paid = ?, payment_status = ? WHERE sale_id = ?', [newPaid, paymentStatus(rows[0].total_amount, newPaid), saleId]);
    await conn.query('COMMIT');
    return exports.findById(saleId);
  } catch (err) {
    try { await conn.query('ROLLBACK'); } catch (_) { /* connection already gone */ }
    throw err;
  } finally {
    conn.release();
  }
};
