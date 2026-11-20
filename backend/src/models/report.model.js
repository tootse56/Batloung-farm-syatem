const { query } = require('../config/db');

// 1. Five most frequently sold fruits
exports.topFruits = () => query(`SELECT f.fruit_id, f.fruit_name, SUM(sd.quantity) AS boxes_sold, SUM(sd.quantity * sd.unit_price) AS revenue
  FROM sales_details sd JOIN fruits f ON f.fruit_id = sd.fruit_id GROUP BY f.fruit_id, f.fruit_name ORDER BY boxes_sold DESC LIMIT 5`);

// 2. Revenue for a date range (inclusive)
exports.revenue = async (from, to) => (await query(`SELECT COALESCE(SUM(total_amount),0) AS revenue, COUNT(*) AS sales_count,
  COALESCE(SUM(amount_paid),0) AS collected FROM sales WHERE sale_date >= ? AND sale_date < DATE_ADD(?, INTERVAL 1 DAY)`, [from, to]))[0];

// 3. Vendor who purchased the most boxes
exports.topVendor = async () => (await query(`SELECT v.vendor_id, v.vendor_name, v.location, SUM(sd.quantity) AS total_boxes
  FROM vendors v JOIN sales s ON s.vendor_id = v.vendor_id JOIN sales_details sd ON sd.sale_id = s.sale_id
  GROUP BY v.vendor_id, v.vendor_name, v.location ORDER BY total_boxes DESC LIMIT 1`))[0] || null;

// 4. Current stock levels per fruit and packaging size
exports.stockLevels = () => query(`SELECT f.fruit_name, st.packaging_size, st.available_quantity, st.selling_price
  FROM stock st JOIN fruits f ON f.fruit_id = st.fruit_id ORDER BY f.fruit_name, FIELD(st.packaging_size,'SMALL','MEDIUM','LARGE')`);

exports.summary = async (threshold) => {
  const [r] = await query(`SELECT
    (SELECT COUNT(*) FROM suppliers) AS suppliers, (SELECT COUNT(*) FROM vendors) AS vendors,
    (SELECT COUNT(*) FROM fruits WHERE status='ACTIVE') AS fruits,
    (SELECT COALESCE(SUM(total_amount),0) FROM sales) AS total_revenue,
    (SELECT COALESCE(SUM(total_amount - amount_paid),0) FROM sales) AS outstanding,
    (SELECT COALESCE(SUM(available_quantity),0) FROM stock) AS boxes_in_stock,
    (SELECT COALESCE(SUM(quantity),0) FROM sales_details) AS boxes_sold,
    (SELECT COALESCE(SUM(total_amount),0) FROM purchases) AS total_purchased,
    (SELECT COUNT(*) FROM stock st JOIN fruits f ON f.fruit_id=st.fruit_id WHERE st.available_quantity <= ? AND f.status='ACTIVE') AS low_stock_count`, [threshold]);
  return r;
};
