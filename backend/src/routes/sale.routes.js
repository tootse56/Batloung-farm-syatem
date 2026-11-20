const router = require('express').Router();
const c = require('../controllers/sale.controller');
const v = require('../middleware/validate');

router.get('/', c.getAll);
router.post('/', v.sale, c.create);
router.get('/:id', v.validId, c.getOne);
router.post('/:id/payments', v.validId, v.payment, c.addPayment);
module.exports = router;
