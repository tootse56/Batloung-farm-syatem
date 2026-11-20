
const crypto = require('crypto');
const { query } = require('../config/db');
const AppError = require('../utils/AppError');
const { sign } = require('../middleware/auth');

const same = (a, b) => {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

exports.login = async (req, res, next) => {
  try {
    const { role, username, password, vendor_id, phone_number } = req.body || {};
    if (role === 'vendor') {
      if (!vendor_id || !phone_number) throw new AppError(400, 'Enter your vendor ID and registered phone number');
      const rows = await query('SELECT vendor_id, vendor_name, phone_number FROM vendors WHERE vendor_id = ? AND phone_number = ?', [vendor_id, String(phone_number).trim()]);
      if (!rows.length) throw new AppError(401, 'Vendor ID or phone number is incorrect');
      const vendor = rows[0];
      const token = sign({ role: 'vendor', vendor_id: vendor.vendor_id, name: vendor.vendor_name });
      return res.json({ success: true, token, user: { role: 'vendor', vendor_id: vendor.vendor_id, name: vendor.vendor_name } });
    }

    const isAdmin = role === 'admin' &&
      same(username, process.env.ADMIN_USERNAME || 'admin') &&
      same(password, process.env.ADMIN_PASSWORD || '5658');
    const isSales = role === 'sales' &&
      same(username, process.env.SALES_USERNAME || 'sales') &&
      same(password, process.env.SALES_PASSWORD || '0766');
    if (!isAdmin && !isSales) throw new AppError(401, 'Username or password is incorrect');
    const user = { role, name: role === 'admin' ? 'Administrator' : 'Sales staff' };
    return res.json({ success: true, token: sign(user), user });
  } catch (e) { next(e); }
};
