const Vendor = require('../models/vendor.model');
const AppError = require('../utils/AppError');

exports.getAll = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await Vendor.findAll() }); } catch (e) { next(e); }
};
exports.search = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) throw new AppError(400, 'Provide a search term using ?q=');
    res.status(200).json({ success: true, data: await Vendor.search(q) });
  } catch (e) { next(e); }
};
exports.getOne = async (req, res, next) => {
  try {
    const v = await Vendor.findById(req.params.id);
    if (!v) throw new AppError(404, `Vendor ${req.params.id} not found`);
    res.status(200).json({ success: true, data: { ...v, outstanding_sales: await Vendor.outstandingSales(v.vendor_id) } });
  } catch (e) { next(e); }
};
exports.create = async (req, res, next) => {
  try { res.status(201).json({ success: true, message: 'Vendor registered', data: await Vendor.create(req.body) }); } catch (e) { next(e); }
};
exports.update = async (req, res, next) => {
  try {
    const v = await Vendor.update(req.params.id, req.body);
    if (!v) throw new AppError(404, `Vendor ${req.params.id} not found`);
    res.status(200).json({ success: true, message: 'Vendor updated', data: v });
  } catch (e) { next(e); }
};
