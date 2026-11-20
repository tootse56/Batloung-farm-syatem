const Purchase = require('../models/purchase.model');
const AppError = require('../utils/AppError');

exports.getAll = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await Purchase.findAll() }); } catch (e) { next(e); }
};
exports.getOne = async (req, res, next) => {
  try {
    const p = await Purchase.findById(req.params.id);
    if (!p) throw new AppError(404, `Purchase ${req.params.id} not found`);
    res.status(200).json({ success: true, data: p });
  } catch (e) { next(e); }
};
exports.create = async (req, res, next) => {
  try { res.status(201).json({ success: true, message: 'Purchase recorded and stock updated', data: await Purchase.create(req.body) }); } catch (e) { next(e); }
};
