const Report = require('../models/report.model');
const AppError = require('../utils/AppError');
const { LOW_STOCK_THRESHOLD } = require('../config/constants');

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const wrap = (fn) => async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await fn(req) }); } catch (e) { next(e); }
};

exports.topFruits = wrap(() => Report.topFruits());
exports.topVendor = wrap(() => Report.topVendor());
exports.stockLevels = wrap(() => Report.stockLevels());
exports.summary = wrap(() => Report.summary(LOW_STOCK_THRESHOLD));
exports.revenue = wrap(async (req) => {
  const { from, to } = req.query;
  if (!DATE.test(from || '') || !DATE.test(to || '')) throw new AppError(400, 'from and to are required in YYYY-MM-DD format');
  if (from > to) throw new AppError(400, 'from date must not be after to date');
  return { from, to, ...(await Report.revenue(from, to)) };
});
