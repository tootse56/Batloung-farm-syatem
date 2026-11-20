const Fruit = require('../models/fruit.model');
const Stock = require('../models/stock.model');
const AppError = require('../utils/AppError');
const { LOW_STOCK_THRESHOLD } = require('../config/constants');

exports.getAll = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await Fruit.findAll(req.query.all === 'true') }); } catch (e) { next(e); }
};
exports.getOne = async (req, res, next) => {
  try {
    const f = await Fruit.findById(req.params.id);
    if (!f) throw new AppError(404, `Fruit ${req.params.id} not found`);
    res.status(200).json({ success: true, data: { ...f, stock: await Stock.findByFruit(f.fruit_id) } });
  } catch (e) { next(e); }
};
exports.create = async (req, res, next) => {
  try { res.status(201).json({ success: true, message: 'Fruit registered', data: await Fruit.create(req.body) }); } catch (e) { next(e); }
};
exports.update = async (req, res, next) => {
  try {
    const f = await Fruit.update(req.params.id, req.body);
    if (!f) throw new AppError(404, `Fruit ${req.params.id} not found`);
    res.status(200).json({ success: true, message: 'Fruit updated', data: f });
  } catch (e) { next(e); }
};

// ----- Stock -----
exports.stockAll = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await Stock.findAll() }); } catch (e) { next(e); }
};
exports.stockByFruit = async (req, res, next) => {
  try {
    if (!(await Fruit.findById(req.params.id))) throw new AppError(404, `Fruit ${req.params.id} not found`);
    res.status(200).json({ success: true, data: await Stock.findByFruit(req.params.id) });
  } catch (e) { next(e); }
};
exports.stockLow = async (req, res, next) => {
  try {
    const t = req.query.threshold === undefined ? LOW_STOCK_THRESHOLD : Number(req.query.threshold);
    if (!Number.isInteger(t) || t < 0) throw new AppError(400, 'threshold must be a non-negative whole number');
    res.status(200).json({ success: true, threshold: t, data: await Stock.findLow(t) });
  } catch (e) { next(e); }
};
exports.updatePrice = async (req, res, next) => {
  try {
    const s = await Stock.updatePrice(req.params.id, Number(req.body.selling_price));
    if (!s) throw new AppError(404, `Stock record ${req.params.id} not found`);
    res.status(200).json({ success: true, message: 'Selling price updated', data: s });
  } catch (e) { next(e); }
};
