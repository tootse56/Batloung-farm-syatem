const { query } = require('../config/db');

const BASE = `SELECT st.stock_id, st.fruit_id, f.fruit_name, f.status, st.packaging_size, st.available_quantity, st.selling_price
  FROM stock st JOIN fruits f ON f.fruit_id = st.fruit_id`;
const ORDER = " ORDER BY f.fruit_name, FIELD(st.packaging_size,'SMALL','MEDIUM','LARGE')";

exports.findAll = () => query(BASE + ORDER);
exports.findByFruit = (fruitId) => query(`${BASE} WHERE st.fruit_id = ?${ORDER}`, [fruitId]);
exports.findLow = (threshold) => query(`${BASE} WHERE st.available_quantity <= ? AND f.status = 'ACTIVE'${ORDER}`, [threshold]);
exports.updatePrice = async (stockId, price) => {
  const r = await query('UPDATE stock SET selling_price = ? WHERE stock_id = ?', [price, stockId]);
  if (!r.affectedRows) return null;
  return (await query(`${BASE} WHERE st.stock_id = ?`, [stockId]))[0];
};
