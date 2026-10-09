const jwt = require('jsonwebtoken');
const { send, methodNotAllowed } = require('../_utils');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  const { username, password } = req.body || {};
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
    return send(res, 500, { error: 'Konfigurasi login admin belum lengkap.' });
  }
  if (typeof username !== 'string' || typeof password !== 'string' ||
      username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
    return send(res, 401, { error: 'Username atau password salah.' });
  }
  const token = jwt.sign({ role: 'admin', username }, process.env.JWT_SECRET, { expiresIn: '12h' });
  return send(res, 200, { token, expiresIn: 43200 });
};