const AppError = require('../utils/AppError');
const { PROVINCES, SIZES, PAYMENT_METHODS } = require('../config/constants');

const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const isPosInt = (v) => v !== '' && v !== null && v !== undefined && Number.isInteger(Number(v)) && Number(v) > 0;
const isPosNum = (v) => v !== '' && v !== null && v !== undefined && !Number.isNaN(Number(v)) && Number(v) > 0;
const PHONE = /^[+\d][\d\s-]{6,19}$/;

// Wraps a rule function (body, req) => string[] into Express middleware.
const check = (rules) => (req, res, next) => {
  const errors = rules(req.body || {}, req);
  if (errors.length) return next(new AppError(400, 'Validation failed', errors));
  next();
};

const validateItems = (items, errors) => {
  if (!Array.isArray(items) || items.length === 0) return errors.push('items must be a non-empty array');
  items.forEach((it, i) => {
    if (!isPosInt(it.fruit_id)) errors.push(`items[${i}].fruit_id is invalid`);
    if (!SIZES.includes(it.packaging_size)) errors.push(`items[${i}].packaging_size must be one of ${SIZES.join(', ')}`);
    if (!isPosInt(it.quantity)) errors.push(`items[${i}].quantity must be a positive whole number`);
  });
};

exports.validId = check((b, req) => (isPosInt(req.params.id) ? [] : ['id must be a positive integer']));

exports.supplier = (partial = false) => check((b) => {
  const e = [];
  ['business_name', 'contact_person', 'address'].forEach((k) => {
    if ((!partial || b[k] !== undefined) && !isStr(b[k])) e.push(`${k} is required`);
  });
  if ((!partial || b.phone !== undefined) && (!isStr(b.phone) || !PHONE.test(b.phone.trim()))) e.push('phone is invalid');
  if ((!partial || b.province !== undefined) && !PROVINCES.includes(b.province)) e.push(`province must be one of: ${PROVINCES.join(', ')}`);
  return e;
});

exports.fruit = (partial = false) => check((b) => {
  const e = [];
  if ((!partial || b.fruit_name !== undefined) && !isStr(b.fruit_name)) e.push('fruit_name is required');
  if (b.status !== undefined && !['ACTIVE', 'INACTIVE'].includes(b.status)) e.push('status must be ACTIVE or INACTIVE');
  if (b.prices) SIZES.forEach((s) => {
    if (b.prices[s] !== undefined && (Number.isNaN(Number(b.prices[s])) || Number(b.prices[s]) < 0)) e.push(`prices.${s} must be a non-negative number`);
  });
  return e;
});

exports.price = check((b) => (b.selling_price === '' || b.selling_price == null || Number.isNaN(Number(b.selling_price)) || Number(b.selling_price) < 0 ? ['selling_price must be a non-negative number'] : []));

exports.vendor = (partial = false) => check((b) => {
  const e = [];
  if ((!partial || b.vendor_name !== undefined) && !isStr(b.vendor_name)) e.push('vendor_name is required');
  if ((!partial || b.location !== undefined) && !isStr(b.location)) e.push('location is required');
  if ((!partial || b.phone_number !== undefined) && (!isStr(b.phone_number) || !PHONE.test(b.phone_number.trim()))) e.push('phone_number is invalid');
  const has = (x) => x !== undefined && x !== null && x !== '';
  if (has(b.latitude) !== has(b.longitude)) e.push('latitude and longitude must be provided together');
  if (has(b.latitude) && (Number.isNaN(Number(b.latitude)) || Math.abs(Number(b.latitude)) > 90)) e.push('latitude must be between -90 and 90');
  if (has(b.longitude) && (Number.isNaN(Number(b.longitude)) || Math.abs(Number(b.longitude)) > 180)) e.push('longitude must be between -180 and 180');
  return e;
});

exports.purchase = check((b) => {
  const e = [];
  if (!isPosInt(b.supplier_id)) e.push('supplier_id is required');
  validateItems(b.items, e);
  if (Array.isArray(b.items)) b.items.forEach((it, i) => { if (!isPosNum(it.unit_cost)) e.push(`items[${i}].unit_cost must be a positive number`); });
  return e;
});

exports.sale = check((b) => {
  const e = [];
  if (!isPosInt(b.vendor_id)) e.push('vendor_id is required');
  validateItems(b.items, e);
  if (Array.isArray(b.items)) b.items.forEach((it, i) => { if (it.unit_price !== undefined && !isPosNum(it.unit_price)) e.push(`items[${i}].unit_price must be a positive number`); });
  if (b.payment_method !== undefined && !PAYMENT_METHODS.includes(b.payment_method)) e.push(`payment_method must be one of ${PAYMENT_METHODS.join(', ')}`);
  if (b.amount_paid !== undefined && (Number.isNaN(Number(b.amount_paid)) || Number(b.amount_paid) < 0)) e.push('amount_paid must be zero or more');
  return e;
});

exports.payment = check((b) => {
  const e = [];
  if (!isPosNum(b.amount)) e.push('amount must be a positive number');
  if (!['CASH', 'MOBILE_MONEY'].includes(b.method)) e.push('method must be CASH or MOBILE_MONEY');
  return e;
});
