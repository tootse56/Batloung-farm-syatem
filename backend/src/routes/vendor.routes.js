const router = require('express').Router();
const c = require('../controllers/vendor.controller');
const v = require('../middleware/validate');

router.get('/', c.getAll);
router.get('/search', c.search);
router.post('/', v.vendor(false), c.create);
router.get('/:id', v.validId, c.getOne);
router.put('/:id', v.validId, v.vendor(true), c.update);
module.exports = router;
