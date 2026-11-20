
const router = require('express').Router();
const { query } = require('../config/db');
const AppError = require('../utils/AppError');
const Sale = require('../models/sale.model');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.use((req, res, next) => {
  if (req.user.role !== 'vendor') return next(new AppError(403, 'Vendor account required'));
  next();
});


router.get('/catalog', async (req, res, next) => {
  try {
    const fruits = await query("SELECT fruit_id, fruit_name FROM fruits WHERE status = 'ACTIVE' ORDER BY fruit_name");
    const stock = await query(`SELECT st.fruit_id, st.packaging_size, st.available_quantity, st.selling_price
      FROM stock st JOIN fruits f ON f.fruit_id = st.fruit_id
      WHERE f.status = 'ACTIVE' ORDER BY f.fruit_name, st.packaging_size`);
    res.json({ success: true, data: { fruits, stock } });
  } catch (e) { next(e); }
});

router.post('/orders', async (req, res, next) => {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || !items.length || items.some((item) =>
      !Number.isInteger(Number(item.fruit_id)) || !['SMALL', 'MEDIUM', 'LARGE'].includes(item.packaging_size) ||
      !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1
    )) throw new AppError(400, 'Choose at least one fruit and enter a valid number of boxes.');
    const order = await Sale.create({
      vendor_id: req.user.vendor_id,
      payment_method: 'CREDIT',
      items: items.map((item) => ({ fruit_id: Number(item.fruit_id), packaging_size: item.packaging_size, quantity: Number(item.quantity) }))
    });
    res.status(201).json({ success: true, message: 'Order placed successfully', data: order });
  } catch (e) { next(e); }
});

router.get('/orders', async (req, res, next) => {
  try {
    const rows = await query(`SELECT s.sale_id, s.vendor_id, s.sale_date, s.payment_status, s.total_amount, s.amount_paid,
      s.total_amount - s.amount_paid AS outstanding_balance,
      (SELECT SUM(quantity) FROM sales_details d WHERE d.sale_id = s.sale_id) AS total_boxes
      FROM sales s WHERE s.vendor_id = ? ORDER BY s.sale_date DESC, s.sale_id DESC`, [req.user.vendor_id]);
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

router.get('/orders/:id', async (req, res, next) => {
  try {
    const rows = await query(`SELECT s.sale_id, s.vendor_id, s.sale_date, s.payment_status, s.total_amount, s.amount_paid,
      s.total_amount - s.amount_paid AS outstanding_balance
      FROM sales s WHERE s.sale_id = ? AND s.vendor_id = ?`, [req.params.id, req.user.vendor_id]);
    if (!rows.length) throw new AppError(404, 'Order not found');
    const order = rows[0];
    order.items = await query(`SELECT d.*, f.fruit_name, d.quantity * d.unit_price AS line_total
      FROM sales_details d JOIN fruits f ON f.fruit_id = d.fruit_id WHERE d.sale_id = ?`, [order.sale_id]);
    order.payments = await query('SELECT payment_id, amount, method, payment_date FROM payments WHERE sale_id = ? ORDER BY payment_date', [order.sale_id]);
    res.json({ success: true, data: order });
  } catch (e) { next(e); }
});

module.exports = router;
