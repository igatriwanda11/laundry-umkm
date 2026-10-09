const { neon } = require('@neondatabase/serverless');
const jwt = require('jsonwebtoken');

function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL belum dikonfigurasi.');
  return neon(process.env.DATABASE_URL);
}

function send(res, status, payload) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed.join(', '));
  return send(res, 405, { error: 'Metode tidak diizinkan.' });
}

function getToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

function requireAdmin(req, res) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    send(res, 500, { error: 'JWT_SECRET belum dikonfigurasi.' });
    return null;
  }
  const token = getToken(req);
  if (!token) {
    send(res, 401, { error: 'Silakan login sebagai admin.' });
    return null;
  }
  try {
    const payload = jwt.verify(token, secret);
    if (payload.role !== 'admin') throw new Error('Role tidak valid');
    return payload;
  } catch (_) {
    send(res, 401, { error: 'Token tidak valid atau sudah kedaluwarsa. Silakan login kembali.' });
    return null;
  }
}

function normalizePhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('0')) digits = '62' + digits.slice(1);
  else if (digits.startsWith('8')) digits = '62' + digits;
  return digits;
}

function waLink(phone, message) {
  const number = normalizePhone(phone);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

module.exports = { db, send, methodNotAllowed, requireAdmin, normalizePhone, waLink };