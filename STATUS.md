---
title: kasir-POS — Status Implementasi
last_verified: 2026-07-30
current_task: "addendum_29-36 (diperluas ke Temuan 1-36) sesi 1 dan 2 selesai, lanjut sesi 3"
---

# STATUS.md — Progress Implementasi (Single Source of Truth)

> Satu-satunya source of truth "sudah sampai mana?" untuk seluruh proyek kasir-POS.
> Update baris terkait SETIAP task/subtask selesai (atau berubah status) — pakai
> `automation/status.py` (lihat `AI_CONTEXT.md`), jangan edit manual. Jangan hapus baris lama,
> cukup ubah kolom Status/Mulai/Selesai/Bundle/Catatan.
>
> Kolom **Rencana** membedakan dua siklus kerja yang tidak saling menimpa penomoran Task ID:
> - `Migrasi Awal` — implementasi_plan/00_index.yaml (task 0-9), SEMUA sudah `done`.
> - `Addendum 29-36` — docs/rfc/bug_fix [ progress ]/00_index.yaml (sesi 0-7, perbaikan seluruh Temuan
>   1-36). Sesi 1 dan 2 sudah selesai, lanjut ke sesi berikutnya sesuai dokumen RFC.

| Rencana | Task ID | Judul | Status | Mulai | Selesai | Bundle Zip | Catatan |
|---|---|---|---|---|---|---|---|
| Addendum 29-36 | 0.1 | Setup folder implementasi_plan/addendum_29-36 (rencana ini sendiri) | done | 2026-07-30 | 2026-07-30 | implementasi_plan/addendum_29-36/bundles/ksp-0.1.zip |  |
| Addendum 29-36 | 0.2 | CI menjalankan seluruh test backend (Temuan 29) | done | 2026-07-30 | 2026-07-30 | implementasi_plan/addendum_29-36/bundles/ksp-0.2.zip | Verifikasi statis (tidak ada testpaths override) - eksekusi pytest tidak bisa dijalankan di sandbox ini (tanpa akses jaringan utk pip install). Perlu dikonfirmasi lulus di CI run sungguhan. |
| Migrasi Awal | 9.7 | Halaman Backup frontend + keputusan scope kalkulator.py | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/9.7.zip |  |
| Migrasi Awal | 9.6 | Restore dengan safety backup wajib | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/9.6.zip |  |
| Migrasi Awal | 9.5 | Backup: buat, list, download | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/9.5.zip |  |
| Migrasi Awal | 9.4 | Halaman Activity Log frontend | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/9.4.zip |  |
| Migrasi Awal | 9.3 | Activity log otomatis di layer service | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/9.3.zip |  |
| Migrasi Awal | 9.2 | Hapus user: soft/hard delete sesuai riwayat | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/9.2.zip |  |
| Migrasi Awal | 9.1 | CRUD user + proteksi diri sendiri | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/9.1.zip |  |
| Migrasi Awal | 8.6 | Halaman Intelligence/ML frontend | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/8.6.zip |  |
| Migrasi Awal | 8.5 | Rekomendasi promo/bonus & Apriori bundling | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/8.5.zip |  |
| Migrasi Awal | 8.4 | Prediksi demand & bonus kasir | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/8.4.zip |  |
| Migrasi Awal | 8.3 | Prediksi omzet HoltES/RandomForest | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/8.3.zip |  |
| Migrasi Awal | 8.2 | Prediksi stok moving average | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/8.2.zip |  |
| Migrasi Awal | 8.1 | Infrastruktur job async & cache ML | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/8.1.zip |  |
| Migrasi Awal | 7.7 | Halaman Laporan frontend 6 tab | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/7.7.zip |  |
| Migrasi Awal | 7.6 | Ekspor laporan xlsx dark-theme | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/7.6.zip |  |
| Migrasi Awal | 7.5 | Endpoint laporan pelanggan/stok/pengeluaran | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/7.5.zip |  |
| Migrasi Awal | 7.4 | Endpoint laporan ringkasan/transaksi/produk | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/7.4.zip |  |
| Migrasi Awal | 7.3 | Halaman Dashboard frontend | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/7.3.zip |  |
| Migrasi Awal | 7.2 | Endpoint chart dashboard | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/7.2.zip |  |
| Migrasi Awal | 7.1 | Endpoint dashboard stat & growth card | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/7.1.zip |  |
| Migrasi Awal | 6.5 | Halaman Pengeluaran frontend | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/6.5.zip |  |
| Migrasi Awal | 6.4 | CRUD pengeluaran kategori tunggal | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/6.4.zip |  |
| Migrasi Awal | 6.3 | Halaman Pelanggan + dialog detail riwayat | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/6.3.zip |  |
| Migrasi Awal | 6.2 | Hapus pelanggan diblokir jika ada riwayat | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/6.2.zip |  |
| Migrasi Awal | 6.1 | CRUD pelanggan | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/6.1.zip |  |
| Migrasi Awal | 5.6 | Test end-to-end retur stok | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/5.6.zip |  |
| Migrasi Awal | 5.5 | Halaman Transaksi + dialog detail/edit | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/5.5.zip |  |
| Migrasi Awal | 5.4 | Ganti pelanggan pada transaksi | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/5.4.zip |  |
| Migrasi Awal | 5.3 | Edit item transaksi + recalculate | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/5.3.zip |  |
| Migrasi Awal | 5.2 | Hapus transaksi + retur stok otomatis | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/5.2.zip |  |
| Migrasi Awal | 5.1 | Endpoint list & filter riwayat transaksi | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/5.1.zip |  |
| Migrasi Awal | 4.8 | Test FIFO & inventory end-to-end | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/4.8.zip |  |
| Migrasi Awal | 4.7 | Dialog & endpoint batch stok per produk | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/4.7.zip |  |
| Migrasi Awal | 4.6 | Halaman Inventory frontend | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/4.6.zip |  |
| Migrasi Awal | 4.5 | Import Excel produk massal | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/4.5.zip |  |
| Migrasi Awal | 4.4 | Stock adjustment tambah/kurangi | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/4.4.zip |  |
| Migrasi Awal | 4.3 | Keputusan & implementasi hapus produk | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/4.3.zip |  |
| Migrasi Awal | 4.2 | CRUD produk dengan validasi | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/4.2.zip |  |
| Migrasi Awal | 4.1 | Service FIFO keluar_fifo & tambah_stok | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/4.1.zip |  |
| Migrasi Awal | 3.8 | Test end-to-end modul kasir | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/3.8.zip |  |
| Migrasi Awal | 3.7 | Struk transaksi: cetak + copy WA | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/3.7.zip |  |
| Migrasi Awal | 3.6 | Dialog pembayaran | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/3.6.zip |  |
| Migrasi Awal | 3.5 | Halaman kasir utama | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/3.5.zip |  |
| Migrasi Awal | 3.4 | Dialog tambah ke keranjang | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/3.4.zip |  |
| Migrasi Awal | 3.3 | Endpoint checkout + fix kode transaksi di response | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/3.3.zip |  |
| Migrasi Awal | 3.2 | Service checkout atomic | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/3.2.zip |  |
| Migrasi Awal | 3.1 | Endpoint daftar produk kasir | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/3.1.zip |  |
| Migrasi Awal | 2.5 | Halaman login frontend | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/2.5.zip |  |
| Migrasi Awal | 2.4 | Middleware otorisasi per-role di setiap endpoint | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/2.4.zip |  |
| Migrasi Awal | 2.3 | Session/JWT + idle timeout 60 menit | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/2.3.zip |  |
| Migrasi Awal | 2.2 | Lockout 5x gagal / 5 menit | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/2.2.zip |  |
| Migrasi Awal | 2.1 | Endpoint login + password hashing | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/2.1.zip |  |
| Migrasi Awal | 1.5 | Script migrasi data lama SQLite -> RDBMS baru | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/1.5.zip |  |
| Migrasi Awal | 1.4 | Keputusan & migrasi bonus_kasir/transaksi_bonus | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/1.4.zip |  |
| Migrasi Awal | 1.3 | Migrasi tabel pengeluaran, users, activity_log | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/1.3.zip |  |
| Migrasi Awal | 1.2 | Migrasi tabel transaksi & transaksi_detail | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/1.2.zip |  |
| Migrasi Awal | 1.1 | Migrasi tabel produk, produk_batch, pelanggan | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/1.1.zip |  |
| Migrasi Awal | 0.1 | Setup folder implementasi_plan, status.md, patchlog.md | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/0.1.zip |  |
| Migrasi Awal | 0.2 | Keputusan tech stack migrasi | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/0.2.zip |  |
| Migrasi Awal | 0.3 | Scaffold repo baru & CI dasar | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/0.3.zip |  |
| Migrasi Awal | 0.4 | Setup environment lokal (docker-compose) & seed data dummy | done | 2026-07-30 | 2026-07-30 | implementasi_plan/bundles/0.4.zip | Perlu verifikasi manual: docker compose up --build lalu python backend/scripts/seed.py, di lingkungan yang punya Docker. |
| Dokumentasi | SSOT-1 | Konsolidasi PATCHLOG/STATUS/tests/AI_CONTEXT ke Single Source of Truth | done | 2026-07-31 | 2026-07-31 |  | Lihat PATCH-2026-07-31-064 di PATCHLOG.md untuk detail lengkap |
| Addendum 29-36 | 1.1 | Validasi qty>0 pada CheckoutItem + perbaiki agregasi validasi stok | done | 2026-07-31 | 2026-07-31 |  | Field(gt=0) pada CheckoutItem.qty + guard eksplisit, tutup bypass validasi stok (Temuan 30) |
| Addendum 29-36 | 1.2 | Validasi harga_jual/diskon checkout terhadap harga acuan produk | done | 2026-07-31 | 2026-07-31 |  | Bandingkan harga_jual client dengan produk.harga_jual di server, tolak diskon/tinta negatif (Temuan 31) |
| Addendum 29-36 | 1.3 | Menyertakan qty_masuk di seluruh INSERT produk_batch | done | 2026-07-31 | 2026-07-31 |  | Menyelesaikan bug critical NOT NULL constraint |
| Addendum 29-36 | 1.4 | Ganti fungsi tanggal SQLite ke native PostgreSQL | done | 2026-07-31 | 2026-07-31 |  | Menyelesaikan bug critical Temuan 2 |
| Addendum 29-36 | 1.5 | Fix perbandingan BOOLEAN is_bonus | done | 2026-07-31 | 2026-07-31 |  | Menyelesaikan Temuan 3 |
| Addendum 29-36 | 1.6 | Fix bug kolom keterangan di Pelanggan | done | 2026-07-31 | 2026-07-31 |  | Menyelesaikan Temuan 4 |
| Addendum 29-36 | 1.7 | Fix DATABASE_URL parser pada modul Backup | done | 2026-07-31 | 2026-07-31 |  | Menyelesaikan Temuan 5 |
| Addendum 29-36 | 1.8 | Fix TOCTOU Race Condition Stok | done | 2026-07-31 | 2026-07-31 |  | Menyelesaikan Temuan 6 dengan FOR UPDATE dan CHECK constraint |
| Addendum 29-36 | 1.9 | Fix Hardcoded SECRET_KEY | done | 2026-07-31 | 2026-07-31 |  | Menyelesaikan Temuan 7 dengan fail-fast |
| Addendum 29-36 | 1.10 | Fix In-Memory Lockout | done | 2026-07-31 | 2026-07-31 |  | Menyelesaikan Temuan 8 menggunakan Redis |
| Addendum 29-36 | 2.1 | Ubah test engine dari sqlite in-memory ke PostgreSQL + hapus folder lama | done | 2026-07-31 | 2026-07-31 |  |  |
| Addendum 29-36 | 2.2 | build_date_filter() -> sintaks tanggal PostgreSQL | done | 2026-07-31 | 2026-07-31 |  |  |
| Addendum 29-36 | 2.3 | Fungsi tanggal SQLite di modul Dashboard | done | 2026-07-31 | 2026-07-31 |  |  |
| Addendum 29-36 | 2.4 | Fungsi tanggal SQLite di transaksi/pengeluaran/activity_log | done | 2026-07-31 | 2026-07-31 |  |  |
| Addendum 29-36 | 2.5 | Fungsi tanggal SQLite di modul ML: prediksi stok/demand/omzet | done | 2026-07-31 | 2026-07-31 |  |  |
| Addendum 29-36 | 2.6 | Fungsi tanggal SQLite di modul ML: promo_recommendation & bonus_kasir | done | 2026-07-31 | 2026-07-31 |  |  |
| Addendum 29-36 | 3.1 | Satukan formula total/profit (harga_tinta) di satu helper bersama | done | 2026-07-31 | 2026-07-31 |  |  |
| Addendum 29-36 | 3.2 | HPP weighted-average saat qty item naik (pakai hasil keluar_fifo) | done | 2026-07-31 | 2026-07-31 |  |  |
| Addendum 29-36 | 3.3 | Row locking (SELECT...FOR UPDATE) pada validasi & pemotongan stok | done | 2026-07-31 | 2026-07-31 |  |  |
| Addendum 29-36 | 4.2 | Hapus default kredensial DATABASE_URL hardcoded | done | 2026-07-31 | 2026-07-31 |  |  |
| Addendum 29-36 | 4.4 | Invalidasi token via token_version | done | 2026-07-31 | 2026-07-31 |  |  |
| Addendum 29-36 | 4.5 | Jangan expose pesan exception internal mentah ke client | done | 2026-07-31 | 2026-07-31 |  |  |
| Addendum 29-36 | 5.1 | Restore all-or-nothing: ON_ERROR_STOP | done | 2026-07-31 | 2026-07-31 |  |  |
| Addendum 29-36 | 5.2 | engine.dispose() sebelum restore | done | 2026-07-31 | 2026-07-31 |  |  |
| Addendum 29-36 | 5.3 | Tangani exception dari do_backup() | done | 2026-07-31 | 2026-07-31 |  |  |
| Addendum 29-36 | 5.4 | Timeout subprocess pg_dump/psql | done | 2026-07-31 | 2026-07-31 |  |  |
| Addendum 29-36 | 5.5 | Named volume persistent untuk backup | done | 2026-07-31 | 2026-07-31 |  |  |
| Addendum 29-36 | 6.1 | Race condition trigger job ML | done | 2026-07-31 | 2026-07-31 |  |  |
| Addendum 29-36 | 6.2 | Perbaiki bare except NameError | done | 2026-07-31 | 2026-07-31 |  |  |
| Addendum 29-36 | 6.3 | Tambahkan numpy/scikit-learn | done | 2026-07-31 | 2026-07-31 |  |  |
| Addendum 29-36 | 7.1 | CheckoutRequest.pelanggan_id: int|None (Temuan 10) | done | 2026-07-31 | 2026-07-31 |  | Ternyata sudah diperbaiki sebelumnya, diverifikasi |
| Addendum 29-36 | 7.2 | Validasi role user lewat Pydantic field_validator | done | 2026-07-31 | 2026-07-31 |  | Ternyata sudah diperbaiki sebelumnya, diverifikasi |
| Addendum 29-36 | 7.3 | Import Excel: savepoint per baris | done | 2026-07-31 | 2026-07-31 |  | Sudah diperbaiki sebelumnya, diverifikasi |
| Addendum 29-36 | 7.4 | Wajibkan alasan saat hapus batch dengan qty_sisa > 0 | done | 2026-07-31 | 2026-07-31 |  | Sudah diperbaiki sebelumnya, diverifikasi |
| Addendum 29-36 | 7.5 | Konsolidasi activity log lewat helper log_action() | done | 2026-07-31 | 2026-07-31 |  | Sudah diperbaiki sebelumnya, diverifikasi |
| Addendum 29-36 | 7.6 | Ganti print() dengan modul logging standar | done | 2026-07-31 | 2026-07-31 |  | Sudah diperbaiki sebelumnya, diverifikasi |
| Addendum 29-36 | 7.7 | Hapus dependency passlib[bcrypt] | done | 2026-07-31 | 2026-07-31 |  | Sudah diperbaiki sebelumnya, diverifikasi |
| Addendum 29-36 | 7.8 | Keputusan & dokumentasi status service Redis | done | 2026-07-31 | 2026-07-31 |  | Sudah diperbaiki sebelumnya, diverifikasi |
| Addendum 29-36 | 7.9 | Perbaiki unit SESSION_TIMEOUT | done | 2026-07-31 | 2026-07-31 |  | Sudah diperbaiki sebelumnya, diverifikasi |
| Addendum 29-36 | 7.10 | datetime.now() naive vs UTC | done | 2026-07-31 | 2026-07-31 |  | Sudah diperbaiki sebelumnya, diverifikasi |

Legenda Status: `pending` → `in_progress` → `done` (atau `blocked` jika terhambat, jelaskan di Catatan).

> Sesi addendum (perbaikan Temuan 1-36) ditambahkan otomatis oleh `automation/status.py` saat task dikerjakan.
