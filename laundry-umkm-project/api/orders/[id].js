const { db, send, methodNotAllowed, requireAdmin } = require('../_utils');

module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id < 1) return send(res, 400, { error: 'ID pesanan tidak valid.' });

  try {
    const sql = db();
    if (req.method === 'GET') {
      const rows = await sql`
        SELECT o.*, s.name AS service_name, s.unit AS service_unit, s.price AS service_price
        FROM orders o JOIN services s ON s.id = o.service_id
        WHERE o.id = ${id} LIMIT 1
      `;
      if (!rows.length) return send(res, 404, { error: 'Pesanan tidak ditemukan.' });
      return send(res, 200, { order: rows[0] });
    }

    if (req.method === 'PUT') {
      const status = req.body && req.body.status;
      if (!['belum', 'proses', 'selesai'].includes(status))
        return send(res, 400, { error: 'Status hanya boleh: belum, proses, atau selesai.' });
      const rows = await sql`
        UPDATE orders SET status = ${status}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, order_code, status, updated_at
      `;
      if (!rows.length) return send(res, 404, { error: 'Pesanan tidak ditemukan.' });
      return send(res, 200, { message: 'Status pesanan berhasil diperbarui.', order: rows[0] });
    }

    if (req.method === 'DELETE') {
      const rows = await sql`DELETE FROM orders WHERE id = ${id} RETURNING id, order_code`;
      if (!rows.length) return send(res, 404, { error: 'Pesanan tidak ditemukan.' });
      return send(res, 200, { message: 'Pesanan berhasil dihapus.', order: rows[0] });
    }

    return methodNotAllowed(res, ['GET', 'PUT', 'DELETE']);
  } catch (error) {
    console.error('Order detail/update:', error);
    return send(res, 500, { error: 'Terjadi kesalahan saat memproses pesanan.' });
  }
};