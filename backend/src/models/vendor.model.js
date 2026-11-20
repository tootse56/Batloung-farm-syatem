const { query } = require('../config/db');

// Every vendor row carries the outstanding balance (total billed - total paid).
const WITH_BALANCE = `SELECT v.*, COALESCE(b.total_billed,0) AS total_billed, COALESCE(b.total_paid,0) AS total_paid,
  COALESCE(b.total_billed,0) - COALESCE(b.total_paid,0) AS outstanding_balance
  FROM vendors v LEFT JOIN (SELECT vendor_id, SUM(total_amount) AS total_billed, SUM(amount_paid) AS total_paid FROM sales GROUP BY vendor_id) b
  ON b.vendor_id = v.vendor_id`;

exports.findAll = () => query(`${WITH_BALANCE} ORDER BY v.vendor_name`);
exports.findById = async (id) => (await query(`${WITH_BALANCE} WHERE v.vendor_id = ?`, [id]))[0];
exports.search = (term) => query(`${WITH_BALANCE} WHERE v.vendor_name LIKE ? OR v.phone_number LIKE ? ORDER BY v.vendor_name`, [`%${term}%`, `%${term}%`]);
const coord = (x) => (x === '' || x === undefined || x === null ? null : Number(x));
exports.create = async (v) => {
  const r = await query('INSERT INTO vendors (vendor_name, phone_number, location, latitude, longitude) VALUES (?,?,?,?,?)',
    [v.vendor_name.trim(), v.phone_number.trim(), v.location.trim(), coord(v.latitude), coord(v.longitude)]);
  return exports.findById(r.insertId);
};
exports.update = async (id, v) => {
  const cur = await exports.findById(id);
  if (!cur) return null;
  const m = { ...cur, ...v };
  await query('UPDATE vendors SET vendor_name=?, phone_number=?, location=?, latitude=?, longitude=? WHERE vendor_id=?',
    [m.vendor_name, m.phone_number, m.location, coord(m.latitude), coord(m.longitude), id]);
  return exports.findById(id);
};
exports.outstandingSales = (id) => query("SELECT sale_id, sale_date, total_amount, amount_paid, total_amount - amount_paid AS balance, payment_status FROM sales WHERE vendor_id = ? AND payment_status <> 'PAID' ORDER BY sale_date", [id]);
