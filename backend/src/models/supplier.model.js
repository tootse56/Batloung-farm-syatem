const { query } = require('../config/db');

exports.findAll = () => query('SELECT * FROM suppliers ORDER BY business_name');
exports.findById = async (id) => (await query('SELECT * FROM suppliers WHERE supplier_id = ?', [id]))[0];
exports.create = async (s) => {
  const r = await query('INSERT INTO suppliers (business_name, contact_person, phone, province, address) VALUES (?,?,?,?,?)',
    [s.business_name.trim(), s.contact_person.trim(), s.phone.trim(), s.province, s.address.trim()]);
  return exports.findById(r.insertId);
};
exports.update = async (id, s) => {
  const cur = await exports.findById(id);
  if (!cur) return null;
  const m = { ...cur, ...s };
  await query('UPDATE suppliers SET business_name=?, contact_person=?, phone=?, province=?, address=? WHERE supplier_id=?',
    [m.business_name, m.contact_person, m.phone, m.province, m.address, id]);
  return exports.findById(id);
};
exports.countPurchases = async (id) => (await query('SELECT COUNT(*) AS n FROM purchases WHERE supplier_id = ?', [id]))[0].n;
exports.remove = async (id) => (await query('DELETE FROM suppliers WHERE supplier_id = ?', [id])).affectedRows;
