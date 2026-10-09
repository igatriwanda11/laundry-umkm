# Lavanda Laundry — Website UMKM

Website pemesanan laundry dengan HTML, CSS, JavaScript, Bootstrap 5, Vercel Functions (Node.js CommonJS), Neon PostgreSQL, dan JWT untuk admin.

## Struktur proyek

```text
laundry-umkm/
├── api/
│   ├── _utils.js
│   ├── auth/login.js
│   ├── orders/index.js
│   ├── orders/[id].js
│   └── services/index.js
├── db/schema.sql
├── public/
│   ├── index.html
│   └── admin.html
├── .env.example
├── package.json
├── vercel.json
└── README.md
```

## 1. Siapkan database Neon

1. Buat project PostgreSQL di [Neon](https://neon.tech/).
2. Buka dashboard Neon, pilih database, lalu salin connection string dari bagian **Connect**. Gunakan URL pooled atau direct yang disediakan Neon dan pastikan SSL aktif.
3. Buka SQL Editor Neon.
4. Salin seluruh isi `db/schema.sql`, lalu jalankan. Skrip membuat tabel `services` dan `orders` serta memasukkan enam layanan awal. Seed tidak menggandakan layanan bernama sama.
5. Simpan connection string sebagai `DATABASE_URL`; jangan pernah memasukkannya ke HTML atau commit nilai rahasia ke Git.

Harga awal di `db/schema.sql` hanya contoh dan dapat diubah sesuai harga usaha.

## 2. Siapkan environment variables

Salin `.env.example` menjadi `.env` untuk pengembangan lokal, lalu isi nilai sebenarnya:

```env
DATABASE_URL="postgresql://..."
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="gunakan-password-yang-kuat"
JWT_SECRET="gunakan-random-secret-yang-panjang-dan-unik"
WA_ADMIN="6281234567890"
```

- `DATABASE_URL`: connection string Neon.
- `ADMIN_USERNAME` dan `ADMIN_PASSWORD`: kredensial login admin.
- `JWT_SECRET`: rahasia untuk menandatangani token JWT. Buat nilai acak yang panjang.
- `WA_ADMIN`: nomor WhatsApp admin. Disarankan format internasional tanpa `+`, misalnya `6281234567890`.

Jangan commit `.env` ke repository. Vercel Functions membaca environment variables dari project settings.

## 3. Jalankan lokal

Pastikan Node.js 20.x sudah terpasang. Dari root proyek:

```bash
npm install
npx vercel dev
```

Jika CLI meminta untuk menghubungkan folder dengan project Vercel, ikuti langkahnya. Pastikan environment variables tersedia untuk proses lokal. Bila diperlukan, jalankan `vercel env pull .env.local` setelah menghubungkan project, atau gunakan `.env` lokal yang tidak di-commit.

Buka URL lokal yang ditampilkan Vercel CLI, biasanya `http://localhost:3000`. Halaman admin tersedia di `/admin` atau `/admin.html`.

## 4. Deploy ke Vercel

1. Push folder proyek ke repository Git, atau jalankan `vercel` dari root proyek.
2. Di Vercel, buat/import project dari repository tersebut. Gunakan root directory proyek (folder yang berisi `vercel.json`).
3. Buka **Project Settings → Environment Variables** dan tambahkan `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`, serta `WA_ADMIN` untuk environment yang dibutuhkan (Production, Preview, dan/atau Development).
4. Redeploy setelah menambah atau mengubah environment variables.
5. Buka URL deployment dan uji halaman utama, `/api/services`, login `/admin`, pembuatan pesanan, serta pembaruan status.

`vercel.json` menetapkan `public/` sebagai output directory dan rewrite `/admin` ke `/admin.html`. Endpoint API berada di folder `api/` dan berjalan sebagai Vercel Functions.

## Endpoint API

| Method | Endpoint | Akses | Fungsi |
|---|---|---|---|
| GET | `/api/services` | Publik | Daftar layanan aktif |
| POST | `/api/auth/login` | Publik | Login admin dan terbitkan JWT 12 jam |
| POST | `/api/orders` | Publik | Buat pesanan, hitung harga dari database |
| GET | `/api/orders` | Admin | Daftar seluruh pesanan |
| GET | `/api/orders/:id` | Admin | Detail pesanan |
| PUT | `/api/orders/:id` | Admin | Ubah status (`belum`, `proses`, `selesai`) |
| DELETE | `/api/orders/:id` | Admin | Hapus pesanan |

Untuk endpoint admin, kirim header `Authorization: Bearer <token>`.

## Catatan operasional dan keamanan

- Nomor pelanggan dan nomor admin dinormalisasi dari format `08xx` menjadi `62xx` saat membuat tautan WhatsApp.
- Harga pesanan dihitung ulang di server menggunakan harga layanan dari database; angka total dari browser tidak dipercaya.
- Token admin disimpan di `localStorage` sesuai spesifikasi. Untuk sistem produksi yang menangani data sensitif, pertimbangkan cookie `HttpOnly`, rate limiting untuk login, audit log, serta perlindungan brute-force.
- Endpoint `DELETE` disediakan untuk admin melalui API; UI dashboard sengaja tidak menampilkan tombol hapus agar penghapusan tidak terjadi tanpa sengaja.
- Pastikan `WA_ADMIN` berisi nomor aktif. Jika belum diatur, pesanan tetap tersimpan tetapi tombol chat admin tidak ditampilkan.
- Harga total dihitung sebagai harga satuan dikali qty dan dibulatkan ke integer Rupiah. Untuk layanan per kg, konfirmasi kebijakan pembulatan berat (misalnya per 0,1 kg atau minimal 1 kg) dengan pelanggan sebelum dipakai operasional.
- Perubahan struktur database selanjutnya perlu diterapkan di Neon secara terpisah; deployment tidak menjalankan migrasi otomatis.
