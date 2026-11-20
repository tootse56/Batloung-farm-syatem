
const router = require('express').Router();
const { authenticate, staffOnly } = require('../middleware/auth');
router.use('/auth', require('./auth.routes'));
router.use(authenticate);
router.use('/my', require('./my.routes'));
router.use(staffOnly);
router.use('/suppliers', require('./supplier.routes'));
router.use('/fruits', require('./fruit.routes'));
router.use('/stock', require('./stock.routes'));
router.use('/vendors', require('./vendor.routes'));
router.use('/purchases', require('./purchase.routes'));
router.use('/sales', require('./sale.routes'));
router.use('/reports', require('./report.routes'));
module.exports = router;
