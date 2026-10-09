const { db, send, methodNotAllowed, requireAdmin, normalizePhone, waLink } = require('../_utils');

function makeCode() {
  const part = Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, 'X');
  return `LDY-${part}`;
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    if (!requireAdmin(req, res)) return;
    try {
      const sql = db();
      const rows = await sql`
        SELECT o.id, o.order_code, o.customer_name, o.customer_phone, o.service_id,
               o.qty, o.pickup_method, o.delivery_method, o.address, o.notes, o.status,
               o.total_price, o.created_at, o.updated_at,
               s.name AS service_name, s.unit AS service_unit
        FROM orders o JOIN services s ON s.id = o.service_id
        ORDER BY o.created_at DESC
      `;
      return send(res, 200, { orders: rows });
    } catch (error) {
      console.error('GET orders:', error);
      return send(res, 500, { error: 'Pesanan belum dapat dimuat.' });
    }
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const customerName = String(body.customer_name || '').trim();
    const rawPhone = String(body.customer_phone || '').trim();
    const phone = normalizePhone(rawPhone);
    const serviceId = Number(body.service_id);
    const qty = Number(body.qty);
    const pickup = body.pickup_method;
    const delivery = body.delivery_method;
    const address = String(body.address || '').trim();
    const notes = String(body.notes || '').trim();

    if (customerName.length < 2 || customerName.length > 160)
      return send(res, 400, { error: 'Nama lengkap wajib diisi (2–160 karakter).' });
    if (!/^62\d{8,13}$/.test(phone))
      return send(res, 400, { error: 'Nomor WhatsApp tidak valid. Periksa kembali nomor yang dimasukkan.' });
    if (!Number.isInteger(serviceId) || serviceId < 1)
      return send(res, 400, { error: 'Pilih layanan laundry terlebih dahulu.' });
    if (!Number.isFinite(qty) || qty <= 0 || qty > 10000)
      return send(res, 400, { error: 'Jumlah/berat harus lebih dari 0 dan maksimal 10.000.' });
    if (!['antar', 'jemput'].includes(pickup))
      return send(res, 400, { error: 'Pilih metode penyerahan.' });
    if (!['diantar', 'ambil'].includes(delivery))
      return send(res, 400, { error: 'Pilih metode pengiriman.' });
    if (!address || address.length > 1000)
      return send(res, 400, { error: 'Alamat wajib diisi (maksimal 1.000 karakter).' });
    if (notes.length > 2000)
      return send(res, 400, { error: 'Catatan maksimal 2.000 karakter.' });

    try {
      const sql = db();
      const services = await sql`
        SELECT id, name, price, unit FROM services
        WHERE id = ${serviceId} AND active = TRUE LIMIT 1
      `;
      if (!services.length) return send(res, 400, { error: 'Layanan tidak ditemukan atau sedang tidak aktif.' });
      const service = services[0];
      const totalPrice = Math.round(Number(service.price) * qty);
      let order;
      // Retry in the unlikely event that a generated order code collides.
      for (let attempt = 0; attempt < 3; attempt++) {
        const code = makeCode();
        try {
          const inserted = await sql`
            INSERT INTO orders
              (order_code, customer_name, customer_phone, service_id, qty,
               pickup_method, delivery_method, address, notes, total_price)
            VALUES
              (${code}, ${customerName}, ${phone}, ${serviceId}, ${qty},
               ${pickup}, ${delivery}, ${address}, ${notes}, ${totalPrice})
            RETURNING id, order_code, customer_name, customer_phone, qty, total_price, status
          `;
          order = inserted[0];
          break;
        } catch (insertError) {
          if (attempt === 2) throw insertError;
        }
      }
      const waAdmin = normalizePhone(process.env.WA_ADMIN || '');
      const message = [
        'Halo Admin Laundry, saya ingin konfirmasi pesanan.',
        `Kode pesanan: ${order.order_code}`,
        `Nama: ${customerName}`,
        `WhatsApp: ${rawPhone}`,
        `Layanan: ${service.name}`,
        `Jumlah: ${qty} ${service.unit}`,
        `Metode penyerahan: ${pickup === 'jemput' ? 'Jemput ke rumah' : 'Antar ke tempat laundry'}`,
        `Metode pengiriman: ${delivery === 'diantar' ? 'Diantar ke alamat' : 'Ambil di tempat laundry'}`,
        `Alamat: ${address}`,
        `Catatan: ${notes || '-'}`,
        `Estimasi total: Rp${totalPrice.toLocaleString('id-ID')}`
      ].join('\n');
      return send(res, 201, {
        message: 'Pesanan berhasil dibuat.',
        order,
        wa_link: waAdmin ? waLink(waAdmin, message) : null
      });
    } catch (error) {
      console.error('POST orders:', error);
      return send(res, 500, { error: 'Pesanan gagal disimpan. Silakan coba kembali.' });
    }
  }

  return methodNotAllowed(res, ['GET', 'POST']);
};