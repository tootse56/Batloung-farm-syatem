const router = require('express').Router();
const c = require('../controllers/fruit.controller');
const v = require('../middleware/validate');

router.get('/', c.getAll);
router.post('/', v.fruit(false), c.create);
router.get('/:id', v.validId, c.getOne);
router.put('/:id', v.validId, v.fruit(true), c.update);
router.get('/:id/stock', v.validId, c.stockByFruit);
module.exports = router;
