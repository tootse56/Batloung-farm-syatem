
const crypto = require('crypto');
const AppError = require('../utils/AppError');

const secret = () => process.env.JWT_SECRET || 'replace-this-secret-before-deployment';

function sign(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12 })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret()).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verify(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const expected = crypto.createHmac('sha256', secret()).update(`${parts[0]}.${parts[1]}`).digest();
  let actual;
  try { actual = Buffer.from(parts[2], 'base64url'); } catch { return null; }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

function authenticate(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const user = verify(token);
  if (!user) return next(new AppError(401, 'Please log in to continue'));
  req.user = user;
  next();
}

function staffOnly(req, res, next) {
  if (!req.user || !['admin', 'sales'].includes(req.user.role)) return next(new AppError(403, 'This page is only available to admin and sales staff'));
  next();
}

module.exports = { sign, authenticate, staffOnly };
