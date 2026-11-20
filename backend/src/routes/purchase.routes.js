const router = require('express').Router();
const c = require('../controllers/purchase.controller');
const v = require('../middleware/validate');

router.get('/', c.getAll);
router.post('/', v.purchase, c.create);
router.get('/:id', v.validId, c.getOne);
module.exports = router;
