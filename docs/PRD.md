# PRD & Spesifikasi Teknis — Super App Management Toko (Aplikasi Kasir)

> **Dokumen ini adalah *source of truth*** hasil reverse-engineering menyeluruh dari kode sumber aplikasi kasir desktop yang sudah berjalan (Python + PyQt5 + SQLite). Tujuannya: mendokumentasikan **setiap fitur, setiap halaman, setiap tombol, dan seluruh logika bisnis** secara presisi, agar aplikasi ini bisa dibangun ulang (migrasi ke web atau platform lain) dengan fungsionalitas dan logika yang **identik**, tanpa menebak-nebak.
>
> Status sumber: aplikasi dibangun secara trial-and-error tanpa PRD awal. Dokumen ini disusun dengan membaca ~17.000 baris kode di seluruh layer (model, repository, service, UI) sehingga mencerminkan **perilaku nyata aplikasi saat ini**, termasuk bug dan inkonsistensi yang sudah "ter-battle-test" di produksi — bukan desain ideal. Bagian [15. Known Issues & Technical Debt](#15-known-issues--technical-debt) mendaftar semua penyimpangan yang ditemukan.

---

## Daftar Isi

1. [Ringkasan Produk](#1-ringkasan-produk)
2. [Arsitektur & Tech Stack Saat Ini](#2-arsitektur--tech-stack-saat-ini)
3. [Model Data & Skema Database](#3-model-data--skema-database)
4. [Peran Pengguna & Kontrol Akses](#4-peran-pengguna--kontrol-akses)
5. [Alur Aplikasi Global](#5-alur-aplikasi-global)
6. [Modul: Login](#6-modul-login)
7. [Modul: Dashboard](#7-modul-dashboard)
8. [Modul: Inventory (Produk & Stok)](#8-modul-inventory-produk--stok)
9. [Modul: Kasir (Point of Sale)](#9-modul-kasir-point-of-sale)
10. [Modul: Pelanggan](#10-modul-pelanggan)
11. [Modul: Transaksi (Riwayat)](#11-modul-transaksi-riwayat)
12. [Modul: Pengeluaran](#12-modul-pengeluaran)
13. [Modul: Laporan & Analisis](#13-modul-laporan--analisis)
14. [Modul: Intelligence / ML](#14-modul-intelligence--ml)
14b. [Modul: Pengguna (User Management)](#14b-modul-pengguna-user-management)
14c. [Modul: Log Aktivitas (Audit Trail)](#14c-modul-log-aktivitas-audit-trail)
14d. [Modul: Backup & Restore](#14d-modul-backup--restore)
15. [Known Issues & Technical Debt](#15-known-issues--technical-debt)
16. [Aturan Bisnis Lintas Modul (Cross-Cutting Rules)](#16-aturan-bisnis-lintas-modul-cross-cutting-rules)
17. [Design System / UI Tokens](#17-design-system--ui-tokens)
18. [Panduan Migrasi](#18-panduan-migrasi)

---

## 1. Ringkasan Produk

**Nama aplikasi:** Super App — Management Toko
**Jenis usaha nyata di balik data:** Toko percetakan/sablon (terlihat dari field "harga tinta", "warna" pada item transaksi, dan nama toko di struk: *"Putra Jaya Limbangan"*, Ruko Lio No.1 Limbangan Barat).
**Bentuk aplikasi saat ini:** Aplikasi desktop Windows, single-tenant, single-database-file, dijalankan full-screen, dengan sistem login multi-user dan multi-role.
**Tujuan bisnis:** Mengelola operasi toko end-to-end — stok/inventori, transaksi kasir (POS), pelanggan, pengeluaran kas, laporan keuangan, prediksi berbasis ML, manajemen pengguna, audit trail, dan backup/restore database.

### Modul-modul aplikasi (menu sidebar)
| # | Menu | Kunci internal | Role yang bisa akses |
|---|------|-----------------|------------------------|
| 1 | Dashboard | `dashboard` | admin, gudang |
| 2 | Inventory | `inventory` | admin, kasir, gudang |
| 3 | Kasir | `kasir` | admin, kasir |
| 4 | Pelanggan | `pelanggan` | admin, kasir |
| 5 | Transaksi | `transaksi` | admin, kasir |
| 6 | Pengeluaran | `pengeluaran` | admin, gudang |
| 7 | Laporan | `laporan` | admin, gudang |
| 8 | Intelligence (ML) | `ml` | admin |
| 9 | Pengguna | `users` | admin |
| 10 | Log Aktivitas | `activity_log` | admin |
| 11 | Backup | `backup` | admin |

---

## 2. Arsitektur & Tech Stack Saat Ini

| Layer | Teknologi aktual | Catatan penting untuk migrasi |
|---|---|---|
| Bahasa | Python 3 | — |
| GUI Framework | **PyQt5** (bukan PySide6, meskipun proyek ini kadang disebut "PySide6" — semua import di kode adalah `from PyQt5.QtWidgets import ...`) | Saat migrasi ke web, setiap `QWidget` dipetakan ke komponen UI web setara (lihat tabel per-halaman di bawah). |
| Styling | QSS (Qt Style Sheet, mirip CSS) — global di `ui/theme.py` (`GLOBAL_QSS`) + inline style per komponen | Palet warna "Deep Navy" dark-mode saja, tidak ada light mode. Lihat [§17](#17-design-system--ui-tokens). |
| Database | **SQLite** file tunggal `toko.db`, mode **WAL** (`journal_mode=WAL`), `foreign_keys=ON`, `synchronous=NORMAL` | Cocok untuk single-tenant. Migrasi ke web sebaiknya ke Postgres/MySQL; WAL/FK constraints harus direplikasi sebagai constraint DB relasional biasa. |
| Migrasi skema | Custom migration runner (`bootstrap.py`) yang menjalankan file `.sql` di folder `migrations/` secara berurutan, dicatat di tabel `schema_migrations` | Riwayat 20 migrasi ditemukan; beberapa bernama `_DISABLED` / `.sqlDISABLED` (migrasi gagal yang dinonaktifkan manual) — bukti proses trial-and-error. Skema final ada di [§3](#3-model-data--skema-database). |
| Password hashing | PBKDF2-HMAC-SHA256, 310.000 iterasi, salt 32-byte acak, disimpan sebagai `"<salt_hex>:<key_hex>"`, verifikasi pakai `hmac.compare_digest` (constant-time) | Standar OWASP 2023. Bisa diganti bcrypt/argon2 di migrasi asal parameter kekuatan setara. |
| Session | Singleton in-memory `core/session.py`, timeout 60 menit tidak aktif (`SESSION_TIMEOUT_MINUTES`, env `SESSION_TIMEOUT`) | Saat migrasi web → JWT/session token dengan idle-timeout yang sama. |
| Excel I/O | `pandas` + `openpyxl` (opsional, dibungkus try/except — jika tidak terinstall, fitur impor/ekspor akan gagal dengan pesan error, bukan crash total) | Dipakai untuk: impor produk massal, ekspor semua tab laporan ke `.xlsx` dengan styling dark-theme. |
| PDF/Print | `QPrinter`/`QPrintDialog`/`QTextDocument` bawaan Qt (native OS print dialog), meng-generate HTML struk lalu print langsung — **tidak ada file PDF disimpan ke disk**, murni print-to-printer/PDF-driver OS | Migrasi web: gunakan `window.print()` atau generate PDF di server (mis. dari HTML struk yang sama). |
| Packaging | PyInstaller (`build.py`, `SuperApp.spec`) → single folder distributable EXE, ikon `ui/resources/icons/app.ico` | Tidak relevan untuk migrasi web. |
| Charting | **Tidak ada library chart eksternal** — semua chart (pie, bar, grouped bar) digambar manual dengan `QPainter` (custom `paintEvent`) di dalam `dashboard_page.py` | Saat migrasi web, ganti dengan Chart.js/Recharts/D3 — logika data & warna harus dipertahankan (lihat [§7](#7-modul-dashboard)). |
| Testing | File `tests/test_inventory.py`, `test_kasir.py`, `test_laporan.py` ada tapi **KOSONG (0 baris)** — tidak ada test otomatis sama sekali | Migrasi harus menulis test suite dari nol berdasarkan aturan bisnis di dokumen ini. |
| requirements.txt | Hanya mendaftar `PyQt5` — padahal `pandas`, `openpyxl` dipakai di runtime (guarded try/except) | Daftar dependency produksi sebenarnya lebih luas dari yang tercatat. |

### Struktur folder kode sumber (untuk referensi silang saat migrasi)
```
main.py                      # Entry point: init DB → login dialog → main window
bootstrap.py                 # Runner migrasi SQL
config.py / core/config.py   # Path DB, judul app, timeout session
core/database.py             # Wrapper koneksi SQLite (get_cursor, transaction, execute, fetch_*)
core/security.py             # Hash & verifikasi password
core/session.py              # Singleton sesi user aktif
core/logger.py                # Logging ke console + file (saat frozen exe)
core/exceptions.py            # Custom exception classes (didefinisikan, jarang dipakai eksplisit)
models/                       # Dataclass/plain-class representasi baris tabel (tidak selalu dipakai; banyak layer pakai dict langsung)
repositories/                 # Query SQL mentah per entitas + logging aktivitas
services/                    # Logika bisnis per domain (kasir, inventory, laporan, ml, backup, dst.)
ui/main_window.py             # Shell utama: sidebar + QStackedWidget berisi semua halaman
ui/components/                 # Sidebar, tombol, tabel, kartu, modal reusable
ui/theme.py                    # Design tokens + GLOBAL_QSS + helper widget (ActionMenu, btn_primary, dst.)
ui/pages/                      # Satu file/folder per halaman utama
ui/dialogs/                    # Semua dialog modal (form tambah/edit, konfirmasi, dsb.)
migrations/                    # File .sql evolusi skema (lihat §3)
kalkulator.py                  # APLIKASI TERPISAH (Tkinter) — kalkulator kebutuhan cat, TIDAK terhubung ke app utama
importx.py, migrate_excel_to_db.py  # Script migrasi data one-off dari Excel lama, dijalankan manual di CLI, bukan bagian UI
build.py, SuperApp.spec        # Build PyInstaller
```

---

## 3. Model Data & Skema Database

Skema final (setelah seluruh migrasi 001–020 diterapkan berurutan; termasuk migrasi yang menambah kolom ke tabel yang sudah ada). Ini adalah **kontrak data** yang harus direplikasi persis di sistem baru (nama kolom boleh diterjemahkan, tapi semantiknya harus sama).

### 3.1 `produk`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | PK autoincrement | |
| kode | TEXT UNIQUE NOT NULL | Kode SKU, disimpan **UPPERCASE** (dipaksa oleh service saat create) |
| nama | TEXT NOT NULL | |
| ukuran | TEXT nullable | Varian/ukuran produk, opsional |
| harga_beli | REAL default 0 | Harga beli referensi (HPP acuan; HPP aktual per unit dihitung FIFO dari batch, lihat §3.2) |
| harga_jual | REAL NOT NULL | Harga jual acuan/default |
| is_bonus_eligible | INTEGER default 1 | Ditambahkan migrasi 018; flag produk boleh dijadikan bonus/promo — **field ini didefinisikan tapi tidak pernah dibaca di manapun di kode UI/service saat ini** (dead field) |
| is_active | INTEGER default 1 | Soft-delete flag; ada method `set_active()` di repo tapi **tidak dipanggil dari UI manapun** — UI Inventory melakukan **hard delete** langsung |
| created_at | TIMESTAMP default now | |
| *(virtual, hasil query)* stok_total | INTEGER | `SUM(produk_batch.qty_sisa)` dihitung on-the-fly via LEFT JOIN, bukan kolom fisik |

### 3.2 `produk_batch` (lot stok — basis metode FIFO)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | PK autoincrement | |
| produk_id | FK → produk(id), ON DELETE CASCADE | |
| supplier | TEXT | Bebas teks; juga dipakai untuk mencatat alasan penyesuaian stok manual (mis. `"Adjustment: Rusak"`, `"Retur Hapus Transaksi TRX-..."`) |
| qty_masuk | INTEGER | Qty awal saat batch dibuat (tidak berubah setelah insert) |
| qty_sisa | INTEGER | Qty tersisa; berkurang tiap kali FIFO keluar; **baris batch dihapus otomatis saat qty_sisa mencapai 0** |
| harga_beli | REAL | HPP per unit **khusus batch ini** — inilah sumber kebenaran HPP aktual (bukan `produk.harga_beli`) |
| tanggal_masuk | TIMESTAMP default now | Dipakai sebagai urutan FIFO (`ORDER BY tanggal_masuk ASC`) |

**Setiap kejadian berikut membuat baris `produk_batch` baru (bukan update stok langsung):**
- Tambah stok manual dari halaman Inventory
- Import stok awal
- Penyesuaian stok (+) di Stock Adjustment dialog
- Retur otomatis saat transaksi/item transaksi dihapus atau di-edit menjadi qty lebih kecil

### 3.3 `pelanggan`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | PK | |
| nama | TEXT NOT NULL | |
| alamat | TEXT nullable | |
| no_hp | TEXT nullable | Divalidasi unik di level service (`PelangganService.tambah`), **bukan constraint DB** |
| created_at | TIMESTAMP default now | |

### 3.4 `transaksi` (header transaksi kasir)
| Kolom | Tipe | Ditambahkan migrasi | Keterangan |
|---|---|---|---|
| id | PK | 007 | |
| kode | TEXT UNIQUE NOT NULL | 007 | Format `TRX-YYYYMMDD-XXXXXXXX` (8 hex uppercase dari UUID4, untuk menghindari collision multi-kasir) |
| tanggal | TIMESTAMP default now | 007 | Format string `"YYYY-MM-DD HH:MM:SS"` |
| total | REAL NOT NULL | 007 | Total omzet transaksi (**tidak termasuk** item bonus, yang selalu Rp 0) |
| profit | REAL default 0 | 007 | `total − Σ(HPP FIFO aktual per item) − Σ(harga_tinta per item)` |
| pelanggan_id | INTEGER nullable | 015 | FK ke pelanggan; null = pelanggan "Umum" |
| kasir_id | INTEGER nullable | 018 | FK ke users; siapa yang memproses |
| metode_bayar | TEXT default 'Tunai' | 018 | Salah satu: Tunai, Transfer, QRIS, Debit, Kredit |
| catatan | TEXT nullable | 018 | Didefinisikan di skema tapi **tidak pernah diisi/dibaca dari UI manapun** — dead column |
| kasir_nama | TEXT nullable | 019 | **Snapshot** nama kasir saat transaksi terjadi (agar riwayat tetap tampil walau user dihapus/diubah nama) |
| created_at | TIMESTAMP default now | 015 | Duplikat semantik dengan `tanggal` (technical debt, lihat §15) |

### 3.5 `transaksi_detail` (item per transaksi)
| Kolom | Tipe | Ditambahkan migrasi | Keterangan |
|---|---|---|---|
| id | PK | 005 | |
| transaksi_id | FK → transaksi(id) ON DELETE CASCADE | 005 | |
| produk_id | FK → produk(id) | 005 | |
| qty | INTEGER NOT NULL | 005 | |
| harga_jual | REAL NOT NULL | 005 | Harga jual **efektif** (setelah dikurangi diskon); untuk item bonus = 0 |
| harga_beli | REAL NOT NULL | 005 | HPP **aktual per unit** hasil keluar FIFO (bukan harga_beli acuan produk) |
| warna | TEXT nullable | 012 | Varian warna (khas produk percetakan) |
| harga_tinta | REAL default 0 | 013 | Biaya tinta tambahan per item; **mengurangi profit**, tidak menambah `harga_jual`/omzet |
| diskon | REAL default 0 | 016 | Nominal diskon per unit (dalam Rupiah, bukan persen — persen dikonversi ke Rupiah sebelum disimpan) |
| harga_asli | REAL default 0 | 016 | Harga sebelum diskon (untuk tampilan struk & audit) |
| created_at | TIMESTAMP default now | 005 | |

**Item bonus/gratis** disimpan sebagai baris `transaksi_detail` biasa dengan `harga_jual = 0`, `harga_beli = 0` (karena kasir_page.py menghitung HPP hanya untuk item non-bonus — lihat §9), **tidak ada kolom `is_bonus` di database** — status bonus hanya ada sementara di keranjang belanja (in-memory), lalu "hilang" begitu tersimpan ke DB kecuali disimpulkan ulang dari `harga_jual == 0`.

### 3.6 `pengeluaran`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | PK | |
| tanggal | DATE NOT NULL | |
| kategori | TEXT NOT NULL | Lihat 2 daftar kategori berbeda di §15 (inkonsistensi) |
| keterangan | TEXT nullable | |
| jumlah | REAL NOT NULL | |
| created_at | TIMESTAMP default now | |

### 3.7 `users`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | PK | |
| username | TEXT UNIQUE NOT NULL COLLATE NOCASE | Case-insensitive unique |
| password_hash | TEXT NOT NULL | Format PBKDF2 lihat §2 |
| nama_lengkap | TEXT NOT NULL | |
| role | TEXT NOT NULL CHECK IN ('admin','kasir','gudang') | |
| is_active | INTEGER default 1 | |
| created_at | TIMESTAMP default now | |
| last_login | TIMESTAMP nullable | Update otomatis tiap login sukses |

Akun admin default dibuat otomatis saat pertama kali app jalan: `username=admin`, password sementara **`Admin@2025!`** (dicetak ke console/log, wajib diganti).

### 3.8 `bonus_kasir` (ditambahkan migrasi 018 — **skema ada, TIDAK dipakai di UI/service manapun**)
Kolom: id, user_id, bulan (YYYY-MM), omzet_bulan, jumlah_transaksi, bonus_tier, bonus_pct, bonus_nominal, status (pending/approved/paid), catatan, created_at, approved_by, approved_at.
> Tabel ini didesain untuk histori bonus kasir yang **disetujui/dibayarkan**, tapi fitur ML "Bonus Kasir" (§14) hanya menghitung skor **secara real-time on-the-fly** — tidak pernah menulis ke tabel ini. Ini adalah fitur yang direncanakan tapi tidak selesai diimplementasikan.

### 3.9 `transaksi_bonus` (migrasi 018 — **skema ada, TIDAK dipakai**)
Kolom: id, transaksi_id, produk_id, qty, tipe (bonus_gratis/tebus_murah/upsell), harga_normal, harga_bonus, catatan, created_at.
> Didesain untuk mencatat item bonus secara terstruktur, tapi implementasi aktual menyimpan item bonus langsung sebagai baris `transaksi_detail` biasa dengan harga 0 (lihat §3.5). Tabel ini kosong selamanya di kode saat ini.

### 3.10 `activity_log` (audit trail — migrasi 020)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | PK | |
| waktu | TIMESTAMP NOT NULL default now | |
| user_id | INTEGER nullable, FK → users ON DELETE SET NULL | |
| username | TEXT NOT NULL default '—' | Snapshot |
| role | TEXT NOT NULL default '—' | Snapshot |
| aksi | TEXT NOT NULL | Salah satu: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, BACKUP, RESTORE |
| modul | TEXT NOT NULL | transaksi, transaksi_detail, produk, batch, pelanggan, pengeluaran, user, auth, backup |
| target_id | TEXT nullable | |
| target_info | TEXT nullable | Deskripsi ringkas (mis. "KODE - nama produk") |
| detail | TEXT nullable | Bebas teks atau JSON `{"sebelum": {...}, "sesudah": {...}}` untuk UPDATE |
| ip_address | TEXT nullable | Didefinisikan tapi **tidak pernah diisi** |

Indexed by: waktu DESC, user_id, modul, aksi.

### 3.11 `schema_migrations`
`filename TEXT PRIMARY KEY, applied_at TIMESTAMP` — bookkeeping migrasi, dibuat otomatis oleh `bootstrap.py`.

### 3.12 Diagram relasi (ringkas)
```
users 1──* transaksi *──1 pelanggan
users 1──* activity_log
produk 1──* produk_batch
produk 1──* transaksi_detail *──1 transaksi
```

---

## 4. Peran Pengguna & Kontrol Akses

Tiga role: **admin**, **kasir**, **gudang**. Kontrol akses dilakukan di dua tempat yang **harus konsisten** (rawan drift saat migrasi):
1. `core/session.py` → property `allowed_pages` menentukan daftar halaman per role.
2. `ui/components/sidebar.py` → filter menu yang dirender berdasarkan `session.allowed_pages` yang sama.

Tidak ada pengecekan akses tingkat-aksi (mis. tombol "Hapus" tidak dicek permission granular) — kontrol akses murni berbasis **halaman mana yang boleh dibuka**. Sekali halaman terbuka, semua aksi di halaman itu bisa dilakukan siapa saja yang melihatnya.

**Matriks akses final:**
- **admin**: dashboard, inventory, kasir, pelanggan, transaksi, pengeluaran, laporan, ml, users, activity_log, backup (semua)
- **kasir**: inventory, kasir, pelanggan, transaksi (fokus operasional harian, tanpa dashboard/laporan/keuangan)
- **gudang**: dashboard, inventory, pengeluaran, laporan (fokus stok & keuangan, tanpa akses kasir)

**Login:**
- Lockout otomatis: 5x gagal berturut-turut → kunci 5 menit (300 detik), counter direset saat login sukses.
- Session timeout idle: 60 menit default (`SESSION_TIMEOUT` env var, 0 = nonaktif).
- Menutup dialog login dengan tombol close (X) atau tombol Escape **langsung mengeluarkan aplikasi** (`sys.exit(0)` / event diabaikan) — bukan reject biasa.

---

## 5. Alur Aplikasi Global

```
main.py start
  → init_app(): jalankan migrasi SQL yang belum diterapkan
  → ensure_admin_exists(): buat akun admin default jika belum ada
  → tampilkan LoginDialog (modal, wajib sukses login untuk lanjut)
  → jika sukses: session.login(...) diisi, MainWindow dibuka fullscreen
      → Sidebar dirender sesuai session.allowed_pages
      → Semua halaman yang diizinkan langsung di-instantiate semua di awal
        (QStackedWidget preloaded — bukan lazy load), disimpan di dict {page_key: index}
      → Halaman pertama dalam allowed_pages otomatis ditampilkan
  → Logout: konfirmasi dialog → session.logout() → tutup MainWindow → tampilkan
    LoginDialog baru → jika sukses, buat instance MainWindow baru dari nol
    (state halaman lama sepenuhnya dibuang, tidak ada persistensi state UI antar sesi)
  → F11 toggle fullscreen/maximized
```

**Penting untuk migrasi:** karena semua halaman di-preload sekaligus saat login (bukan on-demand per route), setiap halaman melakukan query database-nya sendiri di constructor. Pada arsitektur web, ini setara dengan "load semua data semua modul sekaligus saat pertama masuk" — sebaiknya **diganti dengan lazy-loading per-route** di migrasi (peningkatan performa), tapi pastikan urutan/isi data awal tiap halaman tetap sama functionally.

---

## 6. Modul: Login

**File asal:** `ui/dialogs/login_dialog.py`

### Elemen UI
- Header: logo "◈" + judul "SUPER APP"
- Input **Username** (placeholder: "Masukkan username...")
- Input **Password** (masked) + tombol toggle show/hide (👁/🙈)
- Label error (merah, muncul kondisional)
- Tombol **"Masuk"** (submit via klik atau Enter di kedua field)
- Footer: "Hubungi admin jika lupa password"

### Logika
1. Validasi client-side: username & password wajib diisi.
2. Panggil `UserRepository.authenticate(username, password)`:
   - Query `users WHERE username=? AND is_active=1` (case-insensitive karena `COLLATE NOCASE`)
   - Verifikasi password via PBKDF2 compare
   - Jika sukses: update `last_login` ke waktu sekarang
3. Jika sukses: `session.login(user_id, username, nama_lengkap, role)`, dialog **accept**.
4. Jika gagal:
   - Tampilkan pesan error + sisa percobaan (`5 - attempt`)
   - Field password dikosongkan otomatis & fokus ulang
   - Setelah **5x gagal berturut-turut**: kunci login selama **300 detik**, counter reset ke 0
   - Selama masa kunci, mencoba login menampilkan sisa waktu kunci (detik) dan tidak memanggil auth sama sekali
5. Tombol close/Escape pada dialog ini **keluar dari aplikasi sepenuhnya** (bukan sekadar batal login).

---

## 7. Modul: Dashboard

**File asal:** `ui/pages/dashboard_page.py` (halaman aktif) — catatan: ada `dashboard_pagebc.py` yang merupakan versi lama/duplikat, tidak digunakan `main_window.py`, hanya nyangkut di daftar hidden-import PyInstaller (dead code, abaikan saat migrasi).

Auto-refresh setiap 60 detik (`QTimer`). Jam & tanggal di header juga auto-update tiap 60 detik.

### Elemen & logika
1. **Header**: judul "Dashboard" + tanggal-hari-jam (format Indonesia: "Senin, 30 Juli 2026 · 14:05") + dropdown filter bulan (Bulan ini + 12 bulan ke belakang) + tombol refresh manual (↻).
2. **4 Stat Card** (grid 1×4), semua dihitung untuk **periode terpilih** (bulan berjalan atau bulan lain dari dropdown):
   - 💰 **Omzet Bulan Ini** = `SUM(transaksi.total)` pada rentang tanggal → sub-teks: jumlah transaksi
   - 📈 **Laba Kotor** = `SUM(transaksi.profit)` → sub-teks: "omzet − HPP"
   - ✨ **Laba Bersih** = `omzet − total_HPP − total_tinta − total_pengeluaran` → sub-teks: "laba kotor − tinta − pengeluaran"
   - 💸 **Total Pengeluaran** = `SUM(pengeluaran.jumlah)` pada periode → sub-teks: "semua kategori"
3. **3 Growth Card** (bulan ini vs bulan lalu, **selalu** dibandingkan terhadap bulan kalender sebelumnya — tidak mengikuti filter dropdown):
   - Omzet vs bulan lalu, Profit (bersih) vs bulan lalu, Jumlah Transaksi vs bulan lalu
   - Growth % dihitung `(cur-prev)/prev*100`; jika `prev==0` → tidak ditampilkan (null, bukan infinity)
   - Panah ▲ hijau jika naik, ▼ merah jika turun, "── 0%" abu jika sama
4. **Grafik Bulanan (12 bulan terakhir)**: grouped bar chart custom (`QPainter`) — **Omzet** (biru `#6366f1`) vs **Profit Bersih** = `profit − pengeluaran_bulan_itu` (cyan `#22d3ee`), digambar per bulan kalender terakhir (`date('now','-11 months','start of month')` s/d sekarang), grid 4 garis horizontal dengan label singkatan (`1.2Jt`, `500K`).
5. **Pie Chart "Komposisi Bulan Ini"**: potongan (jika > 0): Laba Bersih (cyan), Beli/HPP (merah `#c0392b`), Tinta (amber `#f59e0b`), Pengeluaran (ungu `#8b5cf6`). Jika semua nol → tampilkan slice abu-abu "Belum ada data".
6. **Bar Chart Mini "Omzet 7 Hari Terakhir"**: 7 batang harian, label 3-huruf hari.
7. **Panel "Transaksi Terbaru"**: 5 transaksi terakhir (semua waktu, bukan periode filter) — kode, nama pelanggan, total (hijau), tanggal (16 karakter pertama timestamp).
8. **Panel "Stok Hampir Habis"**: produk dengan total stok < 20 (limit 6, urut naik), warna merah jika ≤5, amber jika 6–19. Ini **query terpisah** dari fitur "stok kritis" ML/Inventory yang memakai threshold berbeda (5) — lihat §15.

---

## 8. Modul: Inventory (Produk & Stok)

**File asal:** `ui/pages/inventory_page.py` + dialog terkait.

### Header & aksi global
- Judul "Inventory"
- Tombol **↻ Refresh** — reload semua data produk dari DB
- Tombol **＋ Tambah Produk** — buka `TambahProdukDialog` mode create
- Tombol **⬇ Import Excel** — buka file picker, baca sheet bernama `"produk"` (fallback: sheet pertama), kolom wajib: `kode, nama, harga_beli, harga_jual` (case-insensitive, di-strip). Baris tanpa kode/nama valid dilewati (skip); kode duplikat dengan data yang sudah ada dilewati; harga_jual ≤ 0 dicatat sebagai error baris. Progress dialog modal dengan tombol Batal. Ringkasan akhir: jumlah berhasil/dilewati/error (maks 10 baris error ditampilkan).

### Filter & pencarian
- **Dropdown Filter Stok**: Semua Stok / Normal (≥5) / Rendah (<5, >0) / Habis (=0)
- **Dropdown Sort**: Default / Nama A→Z / Nama Z→A / Stok ↑ / Stok ↓ / Harga ↑ / Harga ↓
- Tombol **Reset** — kembalikan semua filter & pencarian ke default
- **Search bar**: filter real-time di kolom kode dan nama (case-insensitive substring)

### Stat bar (4 kartu, dihitung dari **seluruh data**, tidak terpengaruh filter tampil)
TOTAL PRODUK · STOK HABIS (=0) · STOK RENDAH (0<stok<5) · DITAMPILKAN (jumlah baris setelah filter aktif)

### Tabel produk
Kolom: `#, Kode, Nama Produk, Ukuran, Harga Beli, Harga Jual, Stok, [Aksi]`
- Stok = 0 → teks merah (SEM_DANGER), bold jika ≤5; Stok 1–4 → amber (SEM_WARNING) bold
- Kolom Aksi: menu titik-tiga berisi **Edit**, **Tambah Batch**, **Adjust Stok**, **Hapus** (danger, merah)

### Aksi per baris
1. **Edit** → `TambahProdukDialog` mode edit, prefill data, simpan via `ProdukRepository.update()`. Validasi: kode unik (kecuali dirinya sendiri), harga jual > 0, harga jual ≥ harga beli (peringatan blokir jika lebih kecil).
2. **Tambah Batch** → `BatchProdukDialog` (lihat sub-dialog di bawah).
3. **Adjust Stok** → `StockAdjustmentDialog`:
   - Pilih jenis: Tambah (+) atau Kurangi (−)
   - Input jumlah (1–10000), **Alasan** wajib diisi (free text, mis. "Rusak", "Hilang", "Retur", "Koreksi"), catatan opsional
   - Jika Tambah → buat batch baru via `StokService.tambah_stok()` dengan `harga_beli=0` dan supplier `"Penyesuaian (+): {alasan}"`
   - Jika Kurangi → keluar stok FIFO via `StokService.keluar_fifo()`; validasi stok baru tidak boleh negatif sebelum eksekusi
4. **Hapus produk**: 
   - Konfirmasi dialog menampilkan jumlah riwayat transaksi terkait (jika ada) sebagai peringatan tambahan, **tapi tetap mengizinkan hard-delete** (lihat §15 — kontradiksi dengan aturan repository yang seharusnya memblokir penghapusan produk yang sudah pernah terjual).
   - Eksekusi: `DELETE FROM produk_batch WHERE produk_id=?` lalu `DELETE FROM produk WHERE id=?` (langsung via SQL raw di halaman, **tidak lewat** `ProdukRepository.delete()` yang punya guard transaksi — lihat §15).

### Dialog: Tambah/Edit Produk (`tambah_produk_dialog.py`)
Field: Kode Produk*, Nama Produk*, Ukuran/Varian, Harga Beli* (Rp, step 1.000), Harga Jual* (Rp, step 5.000).
Validasi submit: kode & nama wajib; harga beli & harga jual harus > 0; harga jual tidak boleh < harga beli (block dengan warning).

### Dialog: Batch Stok per Produk (`batch_produk_dialog.py`)
Menampilkan seluruh riwayat batch untuk 1 produk (urut terbaru dulu): ID, Supplier, Tgl Masuk, Qty Masuk, Qty Sisa (merah jika 0), Harga Beli, tombol Hapus per baris.
- Info header: total batch + total stok sisa.
- Tombol **➕ Tambah Batch Baru** → buka `TambahBatchDialog` (form: supplier, qty, harga beli) → simpan via `BatchRepository.create()`.
- Hapus batch: konfirmasi ekstra jika qty_sisa > 0 ("masih ada stok sisa, tetap hapus?") — **hard delete langsung**, tidak mengoreksi stok produk melalui FIFO service (potensi data stok "menghilang" tanpa jejak audit dampak).

---

## 9. Modul: Kasir (Point of Sale)

**File asal:** `ui/pages/kasir_page.py` (halaman utama, ~430 baris) + 4 dialog pendukung.

> ⚠️ **Catatan arsitektural penting**: halaman ini **tidak memakai** `KasirService.checkout()` yang sudah ada di layer service (lihat isinya di bawah) — logikanya diduplikasi ulang langsung di dalam `kasir_page.py`. Kedua implementasi **hampir identik tapi tidak 100% sama** (lihat §15). Saat migrasi, **gunakan versi di `kasir_page.py` sebagai sumber kebenaran** karena itu yang benar-benar dieksekusi pengguna sehari-hari.

### Layout
- **Header**: judul "🛒 Kasir / Point of Sale" + tombol 👤 (Pilih Pelanggan), 🗑️ (Kosongkan Keranjang), ↻ (Refresh produk), label pelanggan aktif (default "Umum")
- **Search bar** produk (kode/nama, real-time, case-insensitive)
- **Split layout kiri-kanan (45/55)**:
  - **Kiri — Daftar Produk**: tabel Kode/Nama/Harga Jual/Stok. **Produk dengan stok ≤ 0 disembunyikan otomatis** dari daftar (baik tampilan awal maupun hasil pencarian). Double-click baris → buka dialog "Tambah ke Keranjang".
  - **Kanan — Keranjang Belanja**: tabel Kode/Nama/Qty (spinner)/Harga Jual (editable inline)/Tinta/Warna/Subtotal/Aksi(hapus). Baris item **bonus** diberi background hijau gelap (`#0d2e1a`) dan teks hijau muda, label "🎁 [BONUS]", harga ditampilkan "GRATIS" (non-editable), qty tetap bisa diubah.
  - **Footer keranjang**: Total (hanya item non-bonus) + info "+N bonus gratis" bila ada + tombol besar **"💰 Bayar Sekarang"**.

### Dialog: Tambah ke Keranjang (`tambah_ke_keranjang_dialog.py`)
Dipicu double-click produk. Menampilkan: nama produk, kode, stok tersedia, harga referensi.
- **Checkbox "🎁 Berikan sebagai BONUS GRATIS"**: saat dicentang → mengunci (disable) field Harga, Diskon, dan Tinta; set semuanya ke 0; label tombol submit berubah jadi "🎁 Tambahkan sebagai Bonus" dengan warna hijau. Stok tetap berkurang normal (bonus bukan berarti tidak keluar stok).
- Field **Harga Jual** (Rp, editable, klik-pertama otomatis clear nilai lama untuk mempercepat input)
- Field **Diskon**: dua mode via dropdown — "Rp" (nominal) atau "%" (persen, dikonversi ke Rp sebelum disimpan: `harga_jual × pct/100`)
- Field **Harga Tinta** (Rp) — biaya tambahan yang mengurangi profit tapi tidak masuk harga jual
- Field **Qty** (spinner, max = stok tersedia)
- Field **Warna** (teks bebas, opsional)
- **Live preview** di bawah form: menampilkan harga akhir × qty = subtotal (atau "🎁 BONUS GRATIS ×N — Rp 0" jika bonus)
- Validasi submit: harga jual harus > 0 kecuali mode bonus (jika 0 dan bukan bonus → warning "gunakan opsi Bonus Gratis")
- **Item digabung otomatis** ke baris keranjang yang sama jika kode+warna identik dan sama-sama bukan bonus (qty dijumlahkan). **Item bonus TIDAK PERNAH digabung** — selalu baris baru meski produk & warna sama.

### Dialog: Pilih Pelanggan (`pilih_pelanggan_dialog.py`)
Tabel semua pelanggan (ID/Nama/Alamat/No.HP), search real-time by nama/no HP, double-click atau tombol "✅ Pilih Pelanggan" untuk memilih. Emit signal berisi dict pelanggan lengkap → halaman kasir update label & simpan `pelanggan_id`.

### Dialog: Pembayaran (`pembayaran_dialog.py`)
- Tabel ringkasan item (Produk, Qty, Harga, Subtotal) — read-only preview
- Total ditampilkan besar dan hijau
- Input **"Uang Bayar"** (integer only via validator)
- **4 tombol nominal cepat** dihasilkan otomatis: total exact + kelipatan pembulatan ke atas dari `[5.000, 10.000, 50.000, 100.000]` (ambil sampai 4 nilai unik)
- Kalkulasi kembalian real-time saat mengetik:
  - Bayar = 0 → tampil "Rp 0" kuning, tombol konfirmasi disabled
  - Bayar < total → "Kurang Rp X" merah, tombol disabled
  - Bayar ≥ total → kembalian hijau, tombol enabled
- Tombol **"KONFIRMASI BAYAR"** hanya aktif jika bayar cukup. Enter di field bayar = submit langsung.

### Proses Checkout (logika lengkap, method `proses_pembayaran` di `kasir_page.py`)
1. Validasi keranjang tidak kosong.
2. Buka `PembayaranDialog`; jika user batal → keluar tanpa efek apapun.
3. Untuk setiap item keranjang (**termasuk item bonus**, karena loop tidak mengecek `is_bonus` di sini):
   a. Cari data produk lengkap by kode dari cache `all_produk`.
   b. Panggil `StokService.keluar_fifo(produk_id, qty)` → **mengurangi stok nyata & mengembalikan total HPP aktual** dari kombinasi batch FIFO yang dipakai.
   c. Akumulasi `total_hpp += hpp` dan `total_tinta += item['harga_tinta']`.
4. Hitung `profit = total(non-bonus) - total_hpp - total_tinta`.
5. Buat header transaksi (`TransaksiRepository.create`) dengan total, profit, pelanggan_id, kasir_id (dari session), metode_bayar dari dialog.
6. Untuk setiap item: simpan baris `transaksi_detail` (kode, produk_id, qty, harga_jual efektif, harga_beli **acuan produk** — bukan HPP FIFO aktual per item individual, warna, harga_tinta, diskon, harga_asli).
7. Tampilkan `StrukDialog` (struk transaksi).
8. Kosongkan keranjang, reload daftar produk (agar stok ter-update di tampilan), tampilkan message box sukses "Transaksi berhasil! Kode: TRX-{id}" (catatan: kode ditampilkan sebagai `TRX-{transaksi_id_numerik}`, **bukan** kode string asli `TRX-YYYYMMDD-XXXXXXXX` yang tersimpan di DB — lihat §15).
9. Jika terjadi exception di tengah proses: tampilkan error dialog dengan pesan exception mentah. **Tidak ada rollback transaksional menyeluruh** — jika error terjadi setelah sebagian stok FIFO sudah dipotong tapi sebelum semua detail tersimpan, data bisa menjadi tidak konsisten (lihat §15).

### Service `KasirService.checkout()` (versi layer service — TIDAK dipakai UI, tapi didesain lebih baik)
Method ini melakukan hal yang serupa namun **lebih benar**:
- Mengecualikan item bonus dari perhitungan total & profit (`if item.get('is_bonus'): continue`)
- Validasi stok semua item **sebelum** mulai memotong apapun (fail-fast, mencegah partial-state)
- Validasi `bayar >= total` sebelum membuat transaksi apapun
- HPP untuk item bonus di-set 0 (tidak mengurangi HPP dari batch)
> **Rekomendasi migrasi**: gabungkan kedua implementasi — pakai struktur `KasirService.checkout()` (lebih aman & atomic) namun pastikan semantik "item bonus tetap mengurangi stok" tetap dipertahankan seperti perilaku `kasir_page.py` saat ini, karena itulah yang sudah dipakai di lapangan.

### Dialog: Struk Transaksi (`struk_dialog.py`, dipakai juga di halaman Transaksi)
- Menampilkan struk format monospace (font Courier New) meniru kertas struk kasir: header toko ("★ Putra Jaya Limbangan ★", alamat, telepon), No/Tgl/Pelanggan, daftar item (nama, qty×harga=subtotal, info diskon per-item jika ada, info tinta+warna jika ada), separator, subtotal barang vs total tinta (jika ada tinta), TOTAL besar hijau, footer terima kasih.
- **3 tombol aksi**:
  1. **📱 Copy ke WA** — generate teks format WhatsApp (markdown-lite dengan `*bold*` dan `_italic_`) ke clipboard, tampilkan konfirmasi.
  2. **🖨️ Cetak/Print** — buka native print dialog OS (`QPrintDialog`), render versi HTML dari struk (`QTextDocument.setHtml`) lalu print langsung ke printer/PDF-driver yang dipilih user.
  3. **✖ Tutup**.

---

## 10. Modul: Pelanggan

**File asal:** `ui/pages/pelanggan_page.py` + dialog terkait.

### Elemen
- Header: judul + tombol ↻ Refresh, ＋ Tambah Pelanggan
- 2 stat card: TOTAL PELANGGAN, DITAMPILKAN
- Search bar (real-time, filter nama atau no HP, case-insensitive substring)
- Tabel: ID, Nama, Alamat, No.HP, [Aksi]. Hint di bawah tabel: "double-click untuk riwayat transaksi"
- Menu aksi per baris: **Detail** (riwayat transaksi), **Edit**, **Hapus** (danger)

### Aturan bisnis
- Tambah/Edit: Nama wajib. No HP wajib **hanya di level dialog UI** (validasi di `TambahPelangganDialog`), namun di layer service (`PelangganService.tambah`) no_hp sebenarnya opsional — **inkonsistensi ringan, tapi karena dialog selalu jadi gerbang input, no_hp efektif selalu wajib dari UI**. No HP dicek duplikat (`WHERE no_hp=? AND no_hp!=''`) — jika sudah dipakai pelanggan lain, ditolak.
- Hapus: **diblokir** oleh service (`PelangganService.hapus`) jika pelanggan punya riwayat transaksi (`COUNT(*) FROM transaksi WHERE pelanggan_id=?` > 0) → return error, tidak ada override di UI. (Berbeda dari modul Produk yang membiarkan hard-delete meski ada riwayat — lihat §15.)

### Dialog Detail Pelanggan (`detail_pelanggan_dialog.py`)
Tabel riwayat transaksi pelanggan tsb (Kode Transaksi, Tanggal, Total, Profit) — double-click baris membuka `DetailTransaksiDialog` yang sama dipakai di modul Transaksi (reuse komponen).

---

## 11. Modul: Transaksi (Riwayat)

**File asal:** `ui/pages/transaksi_page.py` + `ui/dialogs/detail_transaksi_dialog.py`.

### Filter & tampilan
- Dropdown **Bulan** (Semua Bulan + 24 bulan ke belakang)
- Dropdown **Pelanggan** (Semua Pelanggan + daftar nama unik yang muncul di data — dibangun dinamis dari hasil query, bukan dari tabel pelanggan langsung)
- Tombol Reset filter
- Search bar (kode transaksi, nama pelanggan, atau tanggal — substring, case-insensitive)
- 4 stat card: TOTAL TRANSAKSI (fix, dari seluruh data tanpa filter), TOTAL OMZET (mengikuti filter aktif), TOTAL PROFIT (mengikuti filter), DITAMPILKAN
- Tabel: #, Kode, Tanggal, Pelanggan, Kasir (kuning), Total, Profit (hijau jika ≥0, merah jika negatif), [Aksi]
- Hint: "double-click untuk detail/edit"

### Aksi per baris (menu titik-tiga)
1. **🧾 Cetak Struk** → buka `StrukDialog` langsung dari histori.
2. **Detail/Edit** → buka `DetailTransaksiDialog`.
3. **Hapus** (danger) → konfirmasi eksplisit "stok item akan dikembalikan ke gudang" → untuk setiap detail item, panggil `StokService.tambah_stok()` (retur, supplier label `"Retur Hapus Transaksi {kode}"`, harga_beli dari HPP tersimpan di detail) → baru hapus baris `transaksi_detail` lalu `transaksi` (via `TransaksiRepository.delete()`, atomic transaction).

### Dialog Detail Transaksi (`detail_transaksi_dialog.py`)
- Info bar: Total & Profit transaksi, nama pelanggan, tombol **"👤 Ganti Pelanggan"** (buka `PilihPelangganDialog`, update `transaksi.pelanggan_id` langsung via SQL raw, tanpa re-hitung apapun).
- Tabel item: #, Kode, Nama Barang, Qty, Harga Asli, Diskon, Harga Jual (efektif), Harga Tinta, Warna, [Aksi: Edit ✏ / Hapus 🗑]
- **Edit item** (`EditItemTransaksiDialog`): ubah qty, harga jual, warna, harga tinta.
  - Jika qty baru > qty lama → selisihnya dipotong FIFO tambahan dari stok.
  - Jika qty baru < qty lama → selisihnya dikembalikan sebagai batch retur baru (`"Retur Edit Transaksi #{id}"`).
  - Setelah update detail → panggil `TransaksiRepository.recalculate_total_profit()` (hitung ulang total & profit header dari **semua** detail terkini, termasuk total_tinta).
- **Hapus item**: konfirmasi "stok akan dikembalikan" → retur stok penuh qty item tsb → hapus baris detail → recalculate total/profit header.

---

## 12. Modul: Pengeluaran

**File asal:** `ui/pages/pengeluaran_page.py`.

### Kategori pengeluaran (hardcoded di UI, lihat §15 untuk daftar berbeda di service)
`Operasional, Gaji Karyawan, Sewa Tempat, Listrik & Air, Transport, Pembelian Peralatan, Promosi & Iklan, Lainnya`

### Elemen
- Filter Bulan (Semua + 24 bulan ke belakang), Filter Kategori (dropdown 8 kategori di atas), tombol Reset
- 3 stat card: JUMLAH ITEM, TOTAL PENGELUARAN (merah), DITAMPILKAN
- Search bar (kategori atau keterangan, substring)
- Tabel: ID, Tanggal, Kategori, Keterangan, Jumlah, [Aksi: Edit/Hapus]
- Tombol **＋ Tambah Pengeluaran** → dialog form: Tanggal (date picker, default hari ini), Kategori (dropdown), Keterangan (opsional), Jumlah (Rp, wajib > 0)

### Validasi
Jumlah harus > 0 (baik di dialog maupun di service layer). Tanggal wajib.

---

## 13. Modul: Laporan & Analisis

**File asal:** `ui/pages/laporan/` (dipecah jadi 7 file: `laporan_page.py` orchestrator + `_helpers`, `_styles`, `_widgets`, `_tabs`, `_loaders`, `_exporters` sebagai mixin terpisah).

### Filter global (mempengaruhi semua tab)
- Mode: **"Pilih Bulan"** (dropdown 24 bulan ke belakang) atau **"Rentang Tanggal"** (date picker dari–sampai bebas)
- Tombol **"🔍 Tampilkan Laporan"** — trigger reload semua tab sekaligus

### 6 Tab
1. **Ringkasan** — KPI card + ringkasan eksekutif (teks naratif otomatis, komponen `lbl_exec`) + kemungkinan donut chart komposisi (via `_widgets.py` `DonutChart`)
2. **Transaksi** — tabel detail transaksi periode terpilih
3. **Produk** — produk terlaris/performa produk periode terpilih (qty, omzet, profit per produk — turunan dari `laporan_service.laporan_produk_terlaris`)
4. **Pelanggan** — analisis pelanggan periode terpilih (kemungkinan top spender, turunan dari `analytics_service.top_pelanggan`)
5. **Stok** — snapshot stok **real-time** (bukan per-periode; ada label eksplisit "ℹ️ Stok ditampilkan real-time, bukan per periode")
6. **Pengeluaran** — breakdown pengeluaran per kategori periode terpilih

### Ekspor
Setiap tab punya tombol ekspor sendiri (`_export_ringkasan`, `_export_transaksi`, `_export_produk`, `_export_pelanggan`, `_export_stok`, `_export_pengeluaran`) yang menghasilkan file **`.xlsx`** (via `openpyxl`, bukan `pandas.to_excel`) dengan styling manual: judul merge-cell bold di background navy gelap (`#0D0D3A`), header kolom bold di `#1A1A4E`, baris data alternating antara `#0E0E2A`/`#131330`, font "Segoe UI" putih pucat (`#C5CAE9`/`#E8EAF6`) — mereplikasi tema gelap aplikasi ke dalam file Excel itu sendiri. File disimpan via `QFileDialog.getSaveFileName` (user pilih lokasi).

### Sumber data laporan (layer service, lihat §2 arsitektur)
- `LaporanService`: `laporan_harian()`, `laporan_bulanan()`, `laporan_produk_terlaris()`, `laporan_kasir()`, `laporan_pengeluaran()`
- `AnalyticsService`: `tren_omzet_7_hari()`, `tren_omzet_30_hari()`, `ringkasan_dashboard()`, `top_pelanggan()`, `jam_tersibuk()` (distribusi transaksi per jam, 30 hari terakhir — **fitur ini dihitung di service tapi tidak terlihat dipakai eksplisit oleh tab manapun** yang teridentifikasi; kemungkinan dead code atau dipakai di widget yang tidak eksplisit ter-grep)

---

## 14. Modul: Intelligence / ML

**File asal:** `ui/pages/ml_page.py` + `services/ml/ml_service.py`, `ml_models.py`, `ml_preprocessor.py` (total ~1.700 baris — modul paling kompleks di aplikasi).

Hanya untuk role **admin**. Data dihitung di **background thread** (`MLWorker(QThread)`) agar UI tidak freeze; hasil dikirim balik via 6 sinyal Qt (`result_stok`, `result_omzet`, `result_demand`, `result_kasir`, `result_upsell`, `result_summary`) lalu `finished`.

### 5 Tab
| Tab | Isi & Algoritma |
|---|---|
| 📦 **Prediksi Stok** | Prediksi hari-habis-stok per produk berbasis **moving average 90 hari** (rolling window 7 hari terakhir untuk avg harian), confidence score dari kombinasi jumlah data historis + koefisien variasi (CV). Status: 🔴 Kritis (≤7 hari), 🟡 Rendah (≤14 hari), 🟢 Normal (≤30 hari), Aman (>30 hari), atau "tidak_bergerak"/"no_data". Juga menghasilkan **reorder_qty** yang disarankan = `max(0, avg_daily×14 − stok_sekarang)`. |
| 📈 **Prediksi Omzet** | Dua model dibandingkan otomatis dan **dipilih pemenang berdasarkan RMSE test-set**: **(a) HoltES** (Holt Exponential Smoothing manual, α=0.3 β=0.1) — dipakai jika data historis <35 hari valid; **(b) RandomForestRegressor via scikit-learn** (opsional, fallback ke regresi linear 3-fitur buatan sendiri jika sklearn tidak terinstall) dengan fitur: lag_1/7/30, rolling mean 7/30, rolling std 7, trend 7-hari (least-squares slope), hari_minggu, bulan, is_weekend. Prediksi walk-forward (hasil hari ke-N dipakai sebagai input hari ke-N+1). Confidence menurun linear `max(0.3, 0.9 - i*0.015)` makin jauh ke depan. Data 30 hari pertama historis dianggap tidak valid untuk training (butuh lag_30 penuh). Split train/test time-based (80/20). |
| 🎯 **Prediksi Demand** | Top-N produk berdasarkan skor kombinasi qty & tren (naik/turun/stabil dibanding 30 hari sebelumnya) + opsional **Gradient Boosting Regressor** untuk prediksi qty 30 hari ke depan jika data cukup. |
| 👤 **Bonus Kasir** | Skor performa tiap kasir 0–100: `50% × (omzet/omzet_max) + growth% (max 30 poin) + 20% × (avg_transaksi_kasir relatif)`. Tier: 🥇 **Platinum** (skor≥80 → bonus 3% omzet), 🥈 **Gold** (≥60 → 2%), 🥉 **Silver** (≥40 DAN omzet ≥ threshold top-1/3 kasir DAN transaksi≥5 → 1%), selain itu tidak layak bonus. **Ini murni kalkulasi tampilan real-time — tidak pernah ditulis ke tabel `bonus_kasir`** (lihat §3.8). |
| 🎁 **Promo & Bonus Item** | Dua rekomendasi: (a) **Bonus/Tebus Murah** — produk dengan stok menumpuk & tren lemah, direkomendasikan jadi bonus gratis (jika estimasi hari-habis stok >45 hari) atau tebus murah dengan diskon tertentu; (b) **Upselling** — produk fast-moving/tren naik untuk ditawarkan aktif ke pelanggan. Rekomendasi diskon dasar juga tersedia via `DiscountScorer` (menggabungkan skor produk + estimasi hari-habis stok). Terdapat juga model **Apriori** (association rule mining sederhana) untuk analisis pasangan produk yang sering dibeli bersamaan (`get_bundling_rules`, `get_upsell_recommendation`) — tersedia di service tapi tidak semua fungsinya divisualisasikan eksplisit di tab UI (kemungkinan partial-exposed).

### Catatan teknis penting untuk migrasi
- **scikit-learn adalah dependency opsional** (`SKLEARN_AVAILABLE` flag) — semua model punya fallback non-ML (regresi linear manual/heuristik) sehingga aplikasi tetap jalan tanpa sklearn terinstall, hanya akurasi lebih rendah.
- Training model **tidak persisten** — setiap kali halaman ML dibuka atau refresh diklik, semua model di-training ulang dari nol dari data transaksi terkini (tidak ada model file tersimpan di disk).
- Evaluasi model (MAE, RMSE, MAPE) tersimpan di `ml_service.last_eval` selama masa hidup instance service (hilang saat aplikasi ditutup).

---

## 14b. Modul: Pengguna (User Management)

**File asal:** `ui/pages/users_page.py`. Role admin saja.

- Tabel: Username, Nama Lengkap, Role (badge warna: admin=indigo, kasir=biru muda, gudang=abu), Status (Aktif/Nonaktif), Login Terakhir, [Aksi]
- User yang sedang login (diri sendiri) **tidak punya menu aksi** — tombol diganti label statis "Anda", untuk mencegah admin menghapus/menonaktifkan akunnya sendiri secara tidak sengaja.
- **Tambah/Edit** (dialog sama, mode berbeda):
  - Username **read-only saat edit** (tidak bisa diganti setelah dibuat)
  - Password **wajib** saat tambah baru; saat edit, **kosongkan = tidak diubah**
  - Role: admin/kasir/gudang (dropdown)
  - Checkbox "Akun Aktif"
- **Hapus user**:
  - Jika user tsb **pernah** memproses transaksi (`COUNT(*) FROM transaksi WHERE kasir_id=?` > 0) → **tidak dihapus fisik**, otomatis di-set `is_active=0` saja (soft-delete demi integritas histori transaksi/kasir_nama)
  - Jika belum pernah bertransaksi → hard delete permanen dari tabel `users`
  - Baik hard maupun soft delete tercatat di activity log dengan detail yang menjelaskan mana yang terjadi

---

## 14c. Modul: Log Aktivitas (Audit Trail)

**File asal:** `ui/pages/activity_log_page.py`. Role admin saja.

- 4 stat card: TOTAL LOG (keseluruhan, tidak terpengaruh filter), HARI INI, HAPUS DATA (jumlah entri aksi=DELETE **di dalam hasil filter saat ini**), EDIT DATA (jumlah aksi=UPDATE di hasil filter saat ini)
- Filter: Modul (9 pilihan: Transaksi, Item Transaksi, Produk, Batch Stok, Pelanggan, Pengeluaran, User, Auth, Backup/Restore), Aksi (LOGIN/LOGOUT/CREATE/UPDATE/DELETE/BACKUP/RESTORE), rentang tanggal Dari–Sampai (default 30 hari terakhir), search bebas (username/target/detail/modul/aksi)
- Query utama dibatasi `PAGE_SIZE=200` baris per load (tidak ada pagination UI eksplisit selain reload); search bar memfilter **client-side** dari 200 baris yang sudah dimuat, tidak query ulang ke DB.
- Double-click baris → dialog detail lengkap, termasuk **pretty-print JSON** jika field `detail` berisi JSON valid (mis. before/after untuk UPDATE), fallback tampil sebagai teks polos jika bukan JSON.
- Tombol **"🗑 Hapus Log Lama (>90 hari)"** — hapus permanen semua entri lebih tua dari 90 hari, dengan konfirmasi eksplisit, lalu reload.
- **Setiap operasi CREATE/UPDATE/DELETE** di seluruh aplikasi (produk, batch, transaksi, item transaksi, pelanggan, pengeluaran, user, backup/restore) memanggil `activity_log.catat(...)` dari dalam layer **repository** (bukan di UI) — kegagalan mencatat log **tidak pernah** menggagalkan operasi utama (dibungkus try/except silent).

---

## 14d. Modul: Backup & Restore

**File asal:** `ui/pages/backup_page.py` + `services/backup/backup_service.py`. Role admin saja.

### Info panel
Ukuran file database saat ini, jumlah transaksi, jumlah produk, jumlah backup tersimpan, lokasi folder backup (`{folder_database}/backup/`).

### Buat Backup
- Input catatan opsional (spasi diganti underscore, digabung ke nama file)
- Nama file: `backup_{YYYYMMDD_HHMMSS}[_{catatan}].zip`
- Isi: file `toko.db` di-zip dengan kompresi DEFLATE (`zipfile.ZIP_DEFLATED`)
- Tercatat di activity log

### Daftar Backup
Tabel: #, Nama File (+ catatan dalam kurung siku jika ada), Waktu Backup, Ukuran (format otomatis B/KB/MB/GB), [Aksi: Download / Restore / Hapus]
- **Download**: copy file zip ke lokasi pilihan user via file dialog (tidak menghapus dari folder backup asli)
- **Restore**:
  - Peringatan eksplisit dua-lapis (dialog konfirmasi awal + disclaimer permanen di bawah tabel)
  - **Selalu membuat "safety backup" otomatis** (catatan: `pre-restore-safety`) **sebelum** melakukan restore apapun — jika safety backup gagal dibuat, restore dibatalkan seluruhnya
  - Ekstrak file `.db` dari dalam zip ke file temporary, lalu `shutil.move()` menggantikan `toko.db` aktif
  - Setelah restore, user diminta **restart aplikasi manual** (tidak ada hot-reload koneksi DB otomatis)
- **Hapus backup**: hapus file zip permanen dari disk, dengan konfirmasi

### Buka Folder Backup
Tombol yang membuka file explorer OS (`os.startfile` Windows / `open` macOS / `xdg-open` Linux) ke folder backup — **tidak relevan untuk migrasi web** (ganti dengan link download langsung / file manager berbasis web).

---

## 15. Known Issues & Technical Debt

Bagian ini **wajib dibaca** sebelum migrasi — mendaftar semua inkonsistensi nyata yang ditemukan di kode, supaya tim migrasi bisa memutuskan secara sadar: **replikasi persis (demi kompatibilitas data lama)** atau **perbaiki sekalian (demi kebersihan arsitektur baru)**.

1. **Dua implementasi checkout berbeda**: `KasirService.checkout()` (service layer, lebih aman/atomic, tidak dipakai) vs logika inline di `kasir_page.py._proses_pembayaran()` (yang benar-benar jalan di produksi). Lihat §9 untuk detail perbedaan.
2. **Penghapusan produk tidak konsisten dengan penghapusan pelanggan**: `ProdukRepository.delete()` seharusnya melempar Exception jika produk pernah terjual (ada guard eksplisit di kode), TAPI `InventoryPage.hapus_produk()` di UI **tidak memanggil method itu** — ia menjalankan `DELETE FROM produk_batch` + `DELETE FROM produk` secara langsung via SQL raw, memotong guard tersebut sepenuhnya. Efek: produk yang sudah pernah terjual **bisa dihapus** dari UI meski secara desain seharusnya diblokir, meninggalkan `transaksi_detail.produk_id` yang orphan (FK ke produk yang sudah tidak ada — LEFT JOIN saat load riwayat transaksi akan menampilkan nama produk sebagai NULL/'Unknown'). Bandingkan dengan `PelangganRepository`/`PelangganService` yang **konsisten memblokir** hapus jika ada riwayat transaksi.
3. **Dua daftar kategori pengeluaran berbeda**: `services/pengeluaran/pengeluaran_service.py.KATEGORI_VALID` = `['Operasional','Gaji','Sewa','Listrik & Air','Transportasi','Pembelian Stok','Perawatan','Lain-lain']` **vs** `ui/pages/pengeluaran_page.py.KATEGORI` = `['Operasional','Gaji Karyawan','Sewa Tempat','Listrik & Air','Transport','Pembelian Peralatan','Promosi & Iklan','Lainnya']`. Karena UI page menggunakan `PengeluaranRepository` langsung (bukan lewat `PengeluaranService`), **daftar kategori efektif yang dipakai pengguna adalah daftar di UI**, sementara validasi `KATEGORI_VALID` di service tidak pernah benar-benar dieksekusi jalur ini. Saat migrasi, satukan jadi satu daftar kategori tunggal (rekomendasi: pakai daftar dari UI karena itu yang datanya sudah ada di database produksi).
4. **Kolom mati (dead columns) di skema**: `produk.is_bonus_eligible`, `produk.is_active` (ada setter `set_active()` di repo tapi tak pernah dipanggil — Inventory selalu hard-delete), `transaksi.catatan`. Tabel `bonus_kasir` dan `transaksi_bonus` dibuat lengkap di migrasi 018 tapi **tidak pernah ditulis** oleh kode manapun — fitur "bonus kasir" hanya kalkulasi tampilan on-the-fly di modul ML, tidak persisten.
5. **Duplikasi kolom waktu**: `transaksi.tanggal` dan `transaksi.created_at` menyimpan nilai yang secara semantik identik (keduanya "kapan transaksi dibuat"), ditambahkan di migrasi berbeda (007 vs 015) — kemungkinan hasil trial-and-error yang tidak dibersihkan.
6. **Item bonus tidak punya jejak eksplisit di database**: keranjang belanja (in-memory) tahu status `is_bonus=True/False`, tapi begitu tersimpan ke `transaksi_detail`, informasi ini **hilang** — hanya bisa disimpulkan ulang secara heuristik dari `harga_jual == 0` (bisa salah jika suatu saat ada item non-bonus yang memang sengaja dihargai Rp 0). Rekomendasi migrasi: **tambahkan kolom `is_bonus BOOLEAN` eksplisit** di tabel item transaksi versi baru.
7. **Duplikat file `struk_dialog.py`**: ada di `ui/dialogs/struk_dialog.py` (aktif, dipakai) dan `ui/pages/struk_dialog.py` (identik isinya, orphan — hanya disebut di daftar hidden-import PyInstaller `build.py`, tidak pernah di-import kode aplikasi). Abaikan/hapus versi `ui/pages/` saat migrasi.
8. **`ui/pages/dashboard_pagebc.py`** adalah versi lama dashboard (dead code, tidak di-import `main_window.py`), hanya nyangkut di build script. Jangan bingung dengan `dashboard_page.py` yang aktif.
9. **`kalkulator.py`** adalah aplikasi Tkinter **terpisah total** (kalkulator kebutuhan cat berdasarkan luas bidang & daya sebar cat) — bukan bagian dari alur kasir/inventory, tidak dipanggil dari `main.py` manapun, dan tidak terhubung ke database `toko.db`. Kemungkinan tool sampingan pemilik toko. **Keputusan migrasi**: konfirmasikan ke pemilik produk apakah kalkulator ini perlu diporting sebagai fitur terpisah atau diabaikan sepenuhnya.
10. **`importx.py` dan `migrate_excel_to_db.py`** adalah script migrasi data satu-kali dari sistem Excel lama (`tx.xlsx`), dijalankan manual via command line, bukan bagian dari UI aplikasi. Tidak perlu diporting sebagai fitur — hanya relevan sebagai referensi format data historis jika ada proses migrasi data lama-ke-baru lagi.
11. **`requirements.txt` tidak lengkap**: hanya mencantumkan `PyQt5` & `PyQt5-sip`, padahal `pandas` dan `openpyxl` dipakai secara nyata untuk fitur impor Excel (Inventory) dan ekspor laporan (Laporan) — keduanya dibungkus try/except sehingga aplikasi tidak crash jika tidak terinstall, tapi fitur terkait akan gagal dengan pesan error. `scikit-learn` juga opsional untuk modul ML.
12. **Test suite kosong**: `tests/test_inventory.py`, `test_kasir.py`, `test_laporan.py` ada sebagai file tapi 100% kosong (0 baris) — tidak ada regression test sama sekali yang bisa dijadikan referensi perilaku "yang diharapkan". Semua aturan bisnis di dokumen ini disimpulkan murni dari membaca kode implementasi, bukan dari spesifikasi/test yang terverifikasi terpisah.
13. **Kode transaksi yang ditampilkan salah setelah checkout**: pesan sukses di `kasir_page.py` menampilkan `f"Kode: TRX-{transaksi_id}"` (ID numerik auto-increment) padahal kode transaksi **asli** yang tersimpan di kolom `transaksi.kode` berformat `TRX-YYYYMMDD-XXXXXXXX` (dengan tanggal & UUID suffix). Struk yang dibuka setelahnya (`StrukDialog`) menampilkan kode yang **benar** karena membaca ulang dari DB — hanya pesan popup sukses yang salah/menyesatkan.
14. **Migrasi SQL yang gagal & dinonaktifkan manual**: file `009`–`014` di folder `migrations/` menunjukkan beberapa upaya gagal menambahkan kolom `pelanggan_id` ke tabel `transaksi` (`.sqlDISABLED`, `_DISABLED.sql`) sebelum akhirnya berhasil di migrasi 015 — bukti proses trial-and-error yang disebutkan user. Tidak berdampak ke aplikasi berjalan (file berekstensi `.sqlDISABLED` tidak match filter `.sql` di migration runner sehingga otomatis diabaikan), tapi baik diketahui untuk memahami sejarah desain skema.
15. **Tidak ada rollback transaksional penuh pada checkout kasir** (lihat §9 poin 9) — risiko data-stok/DB tidak konsisten jika terjadi crash/exception di tengah proses multi-langkah (potong stok → simpan header → simpan tiap detail). Migrasi ke web **sangat disarankan** membungkus seluruh proses checkout dalam **satu database transaction** (all-or-nothing).
16. **Kontrol akses hanya di level halaman**, bukan di level aksi/API. Saat migrasi ke web dengan API terpisah, **setiap endpoint backend juga harus divalidasi role secara independen di server** (jangan cuma andalkan UI menyembunyikan tombol) — celah keamanan jika hanya meniru pola front-end lama.
17. **Field `pengeluaran.kategori` tidak divalidasi/constrained di level database** (tidak ada CHECK constraint) — nilai bebas teks, konsistensi hanya dijaga oleh dropdown UI. Jika ada jalur input lain (mis. import), kategori tak terduga bisa masuk.

---

## 16. Aturan Bisnis Lintas Modul (Cross-Cutting Rules)

Ringkasan aturan yang **berlaku di banyak tempat** dan wajib dipertahankan sama persis:

1. **FIFO Stok**: setiap pengurangan stok (checkout, koreksi kurangi, dsb.) SELALU mengambil dari batch **tertanggal-masuk paling lama dulu** sampai qty terpenuhi, menghitung HPP gabungan dari harga_beli tiap batch yang terpakai. Batch yang habis (qty_sisa=0) otomatis dihapus barisnya (bukan disimpan sebagai 0).
2. **Penambahan stok SELALU membuat batch baru**, tidak pernah menambah ke batch existing — riwayat "kapan & dari mana" harus selalu bisa dilacak per batch.
3. **Retur otomatis** (hapus transaksi, hapus item transaksi, kurangi qty item) mengembalikan stok sebagai **batch baru** dengan label supplier deskriptif ("Retur Hapus Transaksi X", "Retur Edit Transaksi #Y") dan HPP = HPP yang tercatat di detail transaksi asal (bukan harga_beli terbaru produk).
4. **Profit** selalu dihitung sebagai `omzet_efektif − HPP_aktual_FIFO − biaya_tinta`, TIDAK PERNAH dari `harga_beli` acuan di tabel produk (yang hanya referensi/default untuk batch baru).
5. **Item bonus**: harga jual = 0, tidak masuk perhitungan omzet/total, HPP = 0 (tidak mengurangi profit lewat sisi HPP), TAPI qty tetap keluar dari stok fisik secara riil.
6. **Diskon** selalu disimpan sebagai **nominal Rupiah per unit** di database (`transaksi_detail.diskon`), meskipun input UI bisa dalam mode persen — konversi terjadi di titik input, bukan disimpan sebagai persen mentah.
7. **Snapshot nama**: `transaksi.kasir_nama` adalah snapshot permanen (tidak berubah walau user diedit/dihapus kemudian) — pola ini sebaiknya diterapkan konsisten juga untuk `pelanggan_nama` di migrasi baru jika belum (saat ini nama pelanggan selalu di-lookup live via JOIN, sehingga histori transaksi lama otomatis ikut berubah nama tampilannya jika data pelanggan diedit — beda perilaku dengan kasir).
8. **Audit log**: seluruh operasi CREATE/UPDATE/DELETE penting dicatat di `activity_log` dari layer repository (bukan UI), dengan pola `before/after` JSON untuk UPDATE. Kegagalan mencatat log tidak pernah menggagalkan operasi utama.
9. **Semua uang dalam Rupiah, format tampilan** `Rp X.XXX.XXX` (titik sebagai pemisah ribuan, tanpa desimal) — fungsi `format_rupiah()` di `pricing_service.py` menjadi acuan format.
10. **Semua tanggal disimpan sebagai string** `"YYYY-MM-DD HH:MM:SS"` (bukan native datetime SQLite), query filter tanggal memakai `DATE(kolom)` atau `strftime()` SQLite.
11. **Halaman yang diizinkan per role** ditentukan di SATU tempat (`session.allowed_pages`) dan harus konsisten dipakai baik oleh Sidebar (render menu) maupun MainWindow (load halaman) — jangan sampai drift saat migrasi ke route-based web app.

---

## 17. Design System / UI Tokens

Untuk memastikan tampilan web baru **terasa sama** (dark theme konsisten), berikut token desain dari `ui/theme.py`:

### Palet warna
| Token | Hex | Kegunaan |
|---|---|---|
| BG_BASE | `#09090f` | Background aplikasi (terluar) |
| BG_SURFACE | `#0f0f1c` | Background halaman/page |
| BG_CARD | `#13131f` | Kartu/panel |
| BG_RAISED | `#181827` | Elemen terangkat (baris tabel alternate) |
| BG_INPUT | `#1a1a2a` | Input field |
| BG_HOVER | `#1f1f30` | Hover state |
| BORDER_DIM | `#1c1c2e` | Separator halus |
| BORDER_NORMAL | `#23233a` | Border default |
| BORDER_FOCUS | `#3b3b5c` | Border input fokus |
| TEXT_PRIMARY | `#e8eaf2` | Judul, nilai penting |
| TEXT_SECONDARY | `#8890a8` | Label, caption |
| TEXT_MUTED | `#3e4060` | Placeholder, disabled |
| ACCENT | `#4a6cf7` | Aksi primer (tombol, link) — *catatan: beberapa halaman lama masih pakai aksen ungu/indigo `#6366f1`/`#818cf8` yang sedikit berbeda dari token resmi ini, sisa evolusi desain* |
| ACCENT_HOVER | `#5a7cff` | Hover aksen |
| ACCENT_DIM | `#1e2645` | Background aksen (fill subtle) |
| SEM_SUCCESS | `#4ade80` | Hijau — stok OK, profit positif |
| SEM_WARNING | `#f59e0b` | Amber — stok rendah |
| SEM_DANGER | `#f87171` | Merah — stok habis, hapus, profit negatif |
| SEM_INFO | `#60a5fa` | Biru muda — info umum |

### Tipografi
Font family: **Segoe UI** (fallback web: `"Segoe UI", system-ui, sans-serif`). Ukuran dasar 12px untuk teks umum, 14–16px untuk judul halaman, 20–26px untuk nilai statistik besar.

### Komponen reusable (didefinisikan di `theme.py`, dipakai di hampir semua halaman)
- `btn_primary(text)` — tombol aksi utama (background accent)
- `btn_ghost(text)` — tombol sekunder (transparan, border tipis)
- `btn_icon(icon, tooltip)` — tombol icon-only bulat
- `btn_add(tooltip)` — tombol "+" khusus tambah data
- `ActionMenu` — dropdown menu titik-tiga (⋮) per baris tabel, method `add_action()` dan `add_danger_action()` (merah untuk hapus)
- Kartu statistik (`_stat_card` helper, didefinisikan ulang di tiap halaman dengan pola identik: label kecil abu + nilai besar berwarna aksen)

### Pola layout halaman yang konsisten (harus direplikasi di web)
Hampir semua halaman list-data (Inventory, Pelanggan, Transaksi, Pengeluaran) mengikuti pola identik:
```
Header (judul + tombol aksi kanan: Refresh, Tambah)
Filter bar (dropdown-dropdown + tombol Reset)
Stat cards row (3-4 kartu ringkasan angka)
Search bar full-width
Tabel data (alternating row color, no grid lines, custom header)
[Hint text di bawah tabel jika ada interaksi tersembunyi seperti double-click]
```

---

## 18. Panduan Migrasi

### Prioritas migrasi yang disarankan (berdasarkan kompleksitas & risiko)
1. **Skema database** (§3) — pindahkan ke RDBMS pilihan (Postgres disarankan), pertahankan semua kolom termasuk yang "dead" bila ingin kompatibilitas data lama sempurna, atau bersihkan sesuai keputusan di §15.
2. **Autentikasi & sesi** (§4, §6) — replikasi role admin/kasir/gudang, lockout 5x/5menit, session timeout 60 menit.
3. **Kasir/POS** (§9) — modul paling kritis bisnis. Gunakan checkout **atomic** (transaction database tunggal) menggabungkan yang terbaik dari kedua implementasi existing (lihat catatan di §9 & §15).
4. **Inventory & FIFO** (§8, aturan #1-3 di §16) — logika FIFO harus 100% presisi karena berdampak langsung ke profit yang dilaporkan.
5. **Transaksi/riwayat & edit** (§11) — termasuk efek samping retur stok otomatis saat edit/hapus.
6. **Pelanggan, Pengeluaran** (§10, §12) — modul CRUD sederhana, risiko rendah.
7. **Laporan & Dashboard** (§7, §13) — perhatikan query agregasi SQL yang jadi acuan angka; ganti QPainter chart dengan library chart web tapi pertahankan **definisi data & warna semantik** yang sama.
8. **ML/Intelligence** (§14) — bisa dibangun terakhir; pertimbangkan menjalankannya sebagai job async/backend terpisah (bukan on-demand blocking) mengingat kompleksitas komputasinya. Precompute & cache hasil jika perlu, alih-alih retrain dari nol tiap request seperti sekarang.
9. **User management, Activity log, Backup/Restore** (§14b-d) — fitur admin-only, pertahankan pola audit trail yang sudah baik (dicatat di layer data, bukan UI).

### Pertanyaan yang harus dikonfirmasi ke pemilik produk sebelum migrasi selesai
- Apakah `kalkulator.py` (kalkulator kebutuhan cat) perlu diporting sebagai fitur terintegrasi, atau memang tool terpisah yang boleh diabaikan?
- Apakah perilaku "produk yang sudah pernah terjual tetap bisa dihapus" (§15 poin 2) adalah **bug yang harus diperbaiki**, atau justru **perilaku yang disengaja/diterima** di lapangan (karena sudah dipakai sekian lama tanpa komplain)?
- Apakah kode transaksi yang salah tampil di popup sukses checkout (§15 poin 13) pernah menyebabkan kebingungan operasional, atau tidak masalah karena struk yang dibuka setelahnya sudah benar?
- Apakah tabel `bonus_kasir`/`transaksi_bonus` yang belum pernah dipakai (§15 poin 4) memang direncanakan untuk fase pengembangan berikutnya (sistem approval bonus kasir), sehingga perlu diimplementasikan penuh di versi baru — atau dihapus saja dari skema?
