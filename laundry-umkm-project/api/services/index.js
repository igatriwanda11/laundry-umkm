const { db, send, methodNotAllowed } = require('../_utils');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  try {
    const sql = db();
    const rows = await sql`
      SELECT id, name, description, price, unit
      FROM services WHERE active = TRUE ORDER BY id ASC
    `;
    return send(res, 200, { services: rows });
  } catch (error) {
    console.error('GET services:', error);
    return send(res, 500, { error: 'Layanan belum dapat dimuat.' });
  }
};