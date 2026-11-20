const router = require('express').Router();
const c = require('../controllers/supplier.controller');
const v = require('../middleware/validate');

router.get('/', c.getAll);
router.post('/', v.supplier(false), c.create);
router.get('/:id', v.validId, c.getOne);
router.put('/:id', v.validId, v.supplier(true), c.update);
router.delete('/:id', v.validId, c.remove);
module.exports = router;
