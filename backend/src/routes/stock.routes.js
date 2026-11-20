const router = require('express').Router();
const c = require('../controllers/fruit.controller');
const v = require('../middleware/validate');

router.get('/', c.stockAll);
router.get('/low', c.stockLow);
router.put('/:id/price', v.validId, v.price, c.updatePrice);
module.exports = router;
