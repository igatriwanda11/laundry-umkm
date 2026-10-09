CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL CHECK (price >= 0),
  unit VARCHAR(40) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_code VARCHAR(20) NOT NULL UNIQUE,
  customer_name VARCHAR(160) NOT NULL,
  customer_phone VARCHAR(30) NOT NULL,
  service_id INTEGER NOT NULL REFERENCES services(id),
  qty NUMERIC(10,2) NOT NULL CHECK (qty > 0),
  pickup_method VARCHAR(30) NOT NULL CHECK (pickup_method IN ('antar', 'jemput')),
  delivery_method VARCHAR(30) NOT NULL CHECK (delivery_method IN ('diantar', 'ambil')),
  address TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'belum' CHECK (status IN ('belum', 'proses', 'selesai')),
  total_price INTEGER NOT NULL CHECK (total_price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO services (name, description, price, unit)
SELECT v.name, v.description, v.price, v.unit
FROM (VALUES
  ('Cuci Reguler', 'Cucian harian bersih dan rapi. Estimasi 2–3 hari.', 7000, 'kg'),
  ('Cuci Express', 'Cucian prioritas untuk kebutuhan lebih cepat.', 12000, 'kg'),
  ('Cuci Sepatu', 'Pembersihan sepatu sesuai material.', 25000, 'pasang'),
  ('Cuci Sprei', 'Perawatan sprei agar bersih dan segar.', 15000, 'pcs'),
  ('Cuci Karpet', 'Pembersihan karpet rumah atau kantor.', 20000, 'meter'),
  ('Cuci Boneka', 'Pembersihan boneka dengan penanganan lembut.', 15000, 'pcs')
) AS v(name, description, price, unit)
WHERE NOT EXISTS (SELECT 1 FROM services s WHERE s.name = v.name);