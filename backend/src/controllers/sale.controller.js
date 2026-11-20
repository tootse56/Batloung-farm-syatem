const Sale = require('../models/sale.model');
const AppError = require('../utils/AppError');

exports.getAll = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await Sale.findAll(req.query.limit) }); } catch (e) { next(e); }
};
exports.getOne = async (req, res, next) => {
  try {
    const s = await Sale.findById(req.params.id);
    if (!s) throw new AppError(404, `Sale ${req.params.id} not found`);
    res.status(200).json({ success: true, data: s });
  } catch (e) { next(e); }
};
exports.create = async (req, res, next) => {
  try { res.status(201).json({ success: true, message: 'Sale recorded and stock reduced', data: await Sale.create(req.body) }); } catch (e) { next(e); }
};
exports.addPayment = async (req, res, next) => {
  try { res.status(201).json({ success: true, message: 'Payment recorded', data: await Sale.addPayment(req.params.id, req.body) }); } catch (e) { next(e); }
};
