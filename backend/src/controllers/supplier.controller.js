const Supplier = require('../models/supplier.model');
const AppError = require('../utils/AppError');

exports.getAll = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await Supplier.findAll() }); } catch (e) { next(e); }
};
exports.getOne = async (req, res, next) => {
  try {
    const s = await Supplier.findById(req.params.id);
    if (!s) throw new AppError(404, `Supplier ${req.params.id} not found`);
    res.status(200).json({ success: true, data: s });
  } catch (e) { next(e); }
};
exports.create = async (req, res, next) => {
  try { res.status(201).json({ success: true, message: 'Supplier registered', data: await Supplier.create(req.body) }); } catch (e) { next(e); }
};
exports.update = async (req, res, next) => {
  try {
    const s = await Supplier.update(req.params.id, req.body);
    if (!s) throw new AppError(404, `Supplier ${req.params.id} not found`);
    res.status(200).json({ success: true, message: 'Supplier updated', data: s });
  } catch (e) { next(e); }
};
// Business constraint: a supplier with purchase history cannot be deleted.
exports.remove = async (req, res, next) => {
  try {
    const s = await Supplier.findById(req.params.id);
    if (!s) throw new AppError(404, `Supplier ${req.params.id} not found`);
    const n = await Supplier.countPurchases(req.params.id);
    if (n > 0) throw new AppError(409, `${s.business_name} has ${n} recorded purchase(s) and cannot be deleted`);
    await Supplier.remove(req.params.id);
    res.status(200).json({ success: true, message: 'Supplier deleted' });
  } catch (e) { next(e); }
};
