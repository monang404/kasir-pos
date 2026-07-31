# Backend Audit Report (Konsolidasi)



---

## Temuan 1

**Nama Bug**
INSERT ke `produk_batch` tidak menyertakan kolom `qty_masuk` yang bersifat NOT NULL

**Severity**
Critical

**Bukti**
- file: backend/app/inventory/fifo_service.py, line 19-26 (`tambah_stok`)
- file: backend/app/inventory/batch_crud.py, line 77-84 (`tambah_batch`)
- file: backend/app/transaksi/delete_transaksi.py, line 41-51 (retur stok saat hapus transaksi)
- file: backend/app/transaksi/edit_item.py, line 96-106 (retur stok saat qty turun)
- Skema migrations/0001_produk_batch_pelanggan.sql, line 22: `qty_masuk INT NOT NULL` tanpa default. Seluruh `INSERT INTO produk_batch (...)` di atas hanya menyertakan `produk_id, qty_sisa, harga_beli, tanggal_masuk`, tidak pernah menyertakan `qty_masuk`.
- Diverifikasi langsung pada PostgreSQL 16 dengan skema identik: INSERT tanpa `qty_masuk` → `ERROR: null value in column "qty_masuk" of relation "produk_batch2" violates not-null constraint`.
- Dampak: seluruh alur tambah stok, retur transaksi, retur edit-qty, dan tambah batch manual akan selalu gagal.

**Solusi**
Sertakan kolom `qty_masuk` (mis. diisi sama dengan qty yang masuk) pada seluruh statement INSERT ke `produk_batch`.

---

## Temuan 2

**Nama Bug**
Penggunaan fungsi tanggal khusus SQLite (`strftime`, `date('now', ...)`) pada database PostgreSQL

**Severity**
Critical

**Bukti**
- file: backend/app/dashboard/stats.py, line 35, 44, 69, 75, 90, 96
- file: backend/app/dashboard/charts.py, line 31-45, 64-76, 101-105
- file: backend/app/transaksi/list_transaksi.py, line 28
- file: backend/app/pengeluaran/crud.py, line 50
- file: backend/app/activity_log/list_log.py, line 34-42, 50, 55, 60, 100, 104
- file: backend/app/laporan/ringkasan_transaksi_produk.py, line 21
- file: backend/app/laporan/export_xlsx.py, line 118 (melalui `build_date_filter`)
- file: backend/app/ml/prediksi_stok.py, line 28-33
- file: backend/app/ml/prediksi_demand.py, line 21, 29
- file: backend/app/ml/prediksi_omzet.py, line 52, 54
- file: backend/app/ml/promo_recommendation.py, line 25, 33, 41, 91
- file: backend/app/ml/bonus_kasir.py, line 28, 41-42
- Aplikasi dikonfigurasi memakai PostgreSQL (database.py, psycopg2-binary, docker-compose.yml), namun 43+ lokasi query di 13 file memakai `strftime()`/`date('now', ...)` — fungsi eksklusif SQLite.
- Diverifikasi langsung: `SELECT strftime('%Y-%m', tanggal) FROM trx;` → `ERROR: function strftime(...) does not exist`; `SELECT date('now', '-30 days');` → `ERROR: function date(unknown, unknown) does not exist`.
- Test suite (app/*/tests) menjalankan `sqlite:///:memory:` sehingga bug ini tidak terdeteksi sebelum deploy.

**Solusi**
Ganti seluruh ekspresi tanggal SQLite dengan sintaks PostgreSQL native (`to_char`, `date_trunc`, operator interval), dan jalankan test terhadap dialect database yang sama dengan production.

---

## Temuan 3

**Nama Bug**
Perbandingan kolom BOOLEAN dengan literal integer (`is_bonus = 0`) tidak valid di PostgreSQL

**Severity**
Critical

**Bukti**
- file: backend/app/laporan/export_xlsx.py, line 118
- file: backend/app/laporan/ringkasan_transaksi_produk.py, line 141
- file: backend/app/ml/prediksi_stok.py, line 32
- file: backend/app/ml/prediksi_demand.py, line 21, 29
- file: backend/app/ml/promo_recommendation.py, line 25, 33, 41, 91
- Kolom `transaksi_detail.is_bonus` bertipe `BOOLEAN` (migrations/0002_transaksi.sql).
- Diverifikasi langsung: `SELECT * FROM t WHERE is_bonus = 0;` → `ERROR: operator does not exist: boolean = integer`.

**Solusi**
Gunakan `is_bonus = FALSE` / `is_bonus IS FALSE`, bukan perbandingan dengan integer.

---

## Temuan 4

**Nama Bug**
INSERT/UPDATE pelanggan mereferensikan kolom `keterangan` yang tidak ada di skema tabel `pelanggan`

**Severity**
Critical

**Bukti**
- file: backend/app/pelanggan/crud.py, line 65, 123
- Skema tabel `pelanggan` (migrations/0001) hanya berisi: id, nama, alamat, no_hp, created_at. Kolom `keterangan` hanya ada di tabel `pengeluaran` (migrations/0003).
- Diverifikasi langsung: INSERT dengan kolom `keterangan` ke tabel `pelanggan` → `ERROR: column "keterangan" of relation "pelanggan" does not exist`.

**Solusi**
Tambahkan kolom `keterangan` pada migrasi tabel `pelanggan`, atau hapus referensi kolom tersebut dari query/model jika tidak dibutuhkan.

---

## Temuan 5

**Nama Bug**
Fitur backup & restore gagal total: parsing `DATABASE_URL` dengan regex rapuh yang tidak cocok dengan format URL yang justru dipakai di konfigurasi deployment sendiri

**Severity**
Critical

**Bukti**
- file: backend/app/backup/create_list_download.py, line 48-53
- file: backend/app/backup/restore_delete.py, line 46-51
- Regex `r"postgresql://([^:]+):([^@]+)@([^:/]+):(\d+)/(.+)"` mensyaratkan skema literal `postgresql://`, tidak menangani password yang mengandung `@`, dan tidak mendukung query string (mis. `?sslmode=require`).
- docker-compose.yml environment backend: `DATABASE_URL: postgresql+psycopg2://kasir:kasir@db:5432/kasir_pos` — memakai skema SQLAlchemy `postgresql+psycopg2://`.
- Diverifikasi langsung: `re.match(pattern, "postgresql+psycopg2://kasir:kasir@db:5432/kasir_pos")` → `None`, sehingga kode langsung melempar `ValueError("Format DATABASE_URL tidak dikenali")`.
- Dampak: endpoint `/backup/create` dan `/backup/restore/{filename}` selalu gagal pada konfigurasi deployment bawaan repo ini sendiri.

**Solusi**
Gunakan parser URL standar (mis. `sqlalchemy.engine.url.make_url` atau `urllib.parse.urlsplit`) alih-alih regex manual.

---

## Temuan 6

**Nama Bug**
Race condition (TOCTOU) antara validasi stok dan pemotongan stok, tanpa row locking

**Severity**
High

**Bukti**
- file: backend/app/kasir/checkout_service.py, line 50-72, 98-125
- file: backend/app/inventory/fifo_service.py, line 45-72 (`keluar_fifo`)
- file: backend/app/inventory/stock_adjustment.py, line 47-59
- file: backend/app/transaksi/edit_item.py, line 79-90
- Semua alur ini membaca `qty_sisa` via `SELECT` biasa (tanpa `SELECT ... FOR UPDATE`/`with_for_update()`), memvalidasi di level aplikasi, lalu `UPDATE`/`DELETE` terpisah. Tidak ditemukan penggunaan row locking di manapun pada codebase.
- Tidak ada constraint `CHECK (qty_sisa >= 0)` di migrations/0001 sebagai lapisan pertahanan terakhir.
- Dua request checkout/adjustment bersamaan pada produk yang sama dapat lolos validasi stok sebelum salah satunya UPDATE, menyebabkan overselling/stok negatif.

**Solusi**
Kunci baris `produk_batch` yang relevan (`SELECT ... FOR UPDATE`) dalam satu transaksi saat validasi dan pemotongan stok dilakukan, dan tambahkan `CHECK (qty_sisa >= 0)` sebagai lapisan tambahan.

---

## Temuan 7

**Nama Bug**
SECRET_KEY JWT memiliki default hardcoded di source code

**Severity**
High

**Bukti**
- file: backend/app/auth/security.py, line 8: `SECRET_KEY = os.environ.get("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")`.
- Jika env var tidak diset saat deploy, seluruh instance memakai key yang sama persis dengan yang ada di repository, memungkinkan pemalsuan JWT oleh siapapun yang membaca source code.

**Solusi**
Hapus default hardcoded; wajibkan aplikasi gagal start (fail-fast) jika `SECRET_KEY` tidak diset di environment.

---

## Temuan 8

**Nama Bug**
State lockout login in-memory: tidak thread-safe dan tidak konsisten pada deployment multi-worker/multi-instance

**Severity**
High

**Bukti**
- file: backend/app/auth/lockout.py, line 5, 15-54
- `_lockout_store: dict[str, tuple[int, datetime]] = {}` adalah variabel modul tanpa lock, diakses read-modify-write (`attempts += 1`) tanpa sinkronisasi dari `get_lockout_status`/`record_failed_attempt`.
- docker-compose.yml menyediakan service `redis` dan `REDIS_URL` ke container backend, namun tidak ada satupun kode di backend/app yang mengimpor/menggunakan redis — mekanisme ini tidak akan konsisten jika dijalankan dengan >1 worker/proses (umum di deployment produksi uvicorn/gunicorn), sehingga lockout dapat dilewati.

**Solusi**
Pindahkan state lockout ke storage bersama (Redis yang sudah tersedia di infrastruktur) dan gunakan operasi atomik untuk read-modify-write counter.

---

## Temuan 9

**Nama Bug**
Proses restore database tidak all-or-nothing: tidak ada `ON_ERROR_STOP`/`--single-transaction` pada `psql`

**Severity**
High

**Bukti**
- file: backend/app/backup/restore_delete.py, line 59-62: `subprocess.run(["psql", "-h", pg_host, "-p", pg_port, "-U", pg_user, pg_db], input=sql_content, ...)` — tidak ada flag `-v ON_ERROR_STOP=1` maupun `--single-transaction`.
- Perilaku default `psql` adalah melanjutkan eksekusi statement berikutnya meski satu statement gagal, sehingga jika ada statement di tengah dump yang error, database bisa berakhir dalam kondisi campuran: sebagian ter-restore, sebagian tidak.
- Pesan error pada endpoint (line 67-74) tidak menjelaskan kemungkinan restore parsial ini ke pengguna.

**Solusi**
Tambahkan `-v ON_ERROR_STOP=1 --single-transaction` pada pemanggilan `psql` agar restore bersifat all-or-nothing.

---

## Temuan 10

**Nama Bug**
Tipe field `pelanggan_id: int = None` pada request checkout menyebabkan validasi gagal saat client mengirim null eksplisit

**Severity**
Medium

**Bukti**
- file: backend/app/kasir/checkout_service.py, line 19: `pelanggan_id: int = None` (bukan `int | None = None`).
- Diverifikasi dengan Pydantic 2.13 (sesuai `pydantic>=2.7` di requirements.txt): `M(pelanggan_id=None)` → `ValidationError: Input should be a valid integer [type=int_type]`.
- Kasus umum "transaksi tanpa pelanggan" yang dikirim sebagai `"pelanggan_id": null` akan ditolak, padahal valid secara bisnis.

**Solusi**
Ubah anotasi tipe menjadi `int | None = None`.

---

## Temuan 11

**Nama Bug**
Nilai kembalian HPP dari `keluar_fifo` diabaikan saat qty item transaksi dinaikkan, sehingga profit hasil recalculate salah

**Severity**
Medium

**Bukti**
- file: backend/app/transaksi/edit_item.py, line 90: `keluar_fifo(db, detail.produk_id, selisih)` — nilai kembalian `(total_hpp, qty_berhasil)` dibuang, `detail.harga_beli` tidak pernah diperbarui.
- `recalculate_total_profit` (line 19-44) menghitung profit memakai `td.harga_beli` lama, bukan HPP aktual dari batch tambahan yang baru dipotong.

**Solusi**
Hitung HPP gabungan (weighted average qty lama + qty tambahan) dari hasil `keluar_fifo`, perbarui `harga_beli` pada `transaksi_detail` sebelum memanggil `recalculate_total_profit`.

---

## Temuan 12

**Nama Bug**
Race condition check-then-act pada trigger background job ML (dua request bersamaan bisa memicu dua job komputasi berat untuk key yang sama)

**Severity**
Medium

**Bukti**
- file: backend/app/ml/job_infra.py, line 107-135 (`get_or_trigger_ml_task`): `manager.get_cache(key)` untuk memutuskan `needs_refresh`, lalu terpisah memanggil `manager.set_status(key, "training")` dan `bg_tasks.add_task(...)`. Tidak ada locking antara pengecekan cache dan penetapan status.
- Dua request bersamaan pada endpoint yang sama (mis. `/ml/prediksi-omzet`) saat cache kadaluarsa dapat sama-sama lolos pengecekan `is_training` dan memicu dua background job sekaligus.

**Solusi**
Gunakan operasi atomik (mis. `UPDATE ... WHERE status != 'training'` dengan pengecekan rowcount, atau advisory lock) untuk memastikan hanya satu job berjalan per key.

---

## Temuan 13

**Nama Bug**
Status cache ML dapat macet permanen di "training" jika inisialisasi background job gagal (`NameError` tertelan bare except)

**Severity**
Medium

**Bukti**
- file: backend/app/ml/job_infra.py, line 72-90 (`run_ml_job`): jika `MLCacheManager(db)` (line 74) melempar exception sebelum `manager` ter-assign, blok `except Exception as e` (line 82) tetap memanggil `manager.set_status(key, "ready")` (line 86) → `NameError`, ditangkap oleh bare `except: pass` (line 87-88) dan tertelan sepenuhnya tanpa log.
- Karena status sudah di-set `"training"` sebelum background task berjalan (line 133) dan tidak pernah direset akibat kegagalan ini, endpoint akan menganggap job masih berjalan selamanya (lihat pengecekan `is_training`, line 130).

**Solusi**
Inisialisasi `manager` di luar/awal blok try dengan fallback aman, dan hindari bare `except: pass` yang menutupi error inisialisasi.

---

## Temuan 14

**Nama Bug**
Error validasi role user tidak ditangani, menghasilkan 500 alih-alih pesan error yang jelas

**Severity**
Medium

**Bukti**
- file: backend/app/users/crud.py, line 23-25, 34-36 (`validate_role`) melempar `ValueError` biasa, dipanggil manual di endpoint (line 64, 97) — bukan lewat `field_validator` Pydantic — dan tidak dibungkus try/except di endpoint maupun exception handler global (main.py tidak mendaftarkan handler untuk `ValueError`).

**Solusi**
Pindahkan validasi role ke `field_validator` Pydantic (seperti pola pada `PengeluaranBase.validate_kategori`) agar otomatis menjadi 422, atau bungkus pemanggilan manual dengan try/except → HTTPException.

---

## Temuan 15

**Nama Bug**
Restore database dijalankan lewat subprocess `psql` sementara request handler yang sama masih memegang sesi/koneksi SQLAlchemy aktif ke database yang sama

**Severity**
Medium

**Bukti**
- file: backend/app/backup/restore_delete.py, line 20-24 (`db: Session = Depends(get_db)` di-inject ke `restore_backup`), line 59-62 (subprocess `psql` terhadap DB yang sama tanpa `engine.dispose()` sebelum/sesudahnya).
- Response endpoint sendiri mengakui perlu "Restart service backend" setelah restore — indikasi koneksi lama berpotensi stale/invalid.

**Solusi**
Panggil `engine.dispose()` sebelum menjalankan proses restore dan pastikan tidak ada sesi lain yang memegang lock pada tabel yang akan direstore.

---

## Temuan 16

**Nama Bug**
Endpoint create backup tidak menangani exception dari proses backup itu sendiri

**Severity**
Medium

**Bukti**
- file: backend/app/backup/create_list_download.py, line 92-115: `do_backup(label or "")` (line 98) tidak dibungkus try/except — hanya insert activity_log (line 102-113) yang dibungkus. Jika `pg_dump` gagal atau `DATABASE_URL` tak sesuai regex (Temuan 5), exception (`ValueError`/`RuntimeError`, termasuk `result.stderr` mentah) menembus tanpa ditangani.

**Solusi**
Tangkap exception dari `do_backup()` secara eksplisit dan kembalikan pesan error yang sudah disaring ke client.

---

## Temuan 17

**Nama Bug**
Tidak ada mekanisme invalidasi token/sesi saat password atau status user diubah

**Severity**
Medium

**Bukti**
- file: backend/app/auth/security.py, line 37-43 (`create_access_token`): JWT hanya berisi `exp` berbasis waktu, tanpa `jti`/version stamp yang bisa dicabut.
- file: backend/app/users/crud.py, line 90-119 (`update_user`): mengganti password/role/status user lain tidak mencabut token JWT lama milik user tersebut — token tetap valid hingga expiry karena `get_current_user` (auth/session.py) tidak memvalidasi versi/jti apapun terhadap user record.

**Solusi**
Tambahkan mekanisme pencabutan token (mis. token version/jti yang divalidasi terhadap nilai tersimpan di user record) agar penggantian password/role langsung menonaktifkan sesi lama.

---

## Temuan 18

**Nama Bug**
Pesan exception internal (error mentah/stack trace) dikembalikan langsung ke client API

**Severity**
Low

**Bukti**
- file: backend/app/kasir/checkout_endpoint.py, line 46-51: `detail=f"Terjadi kesalahan internal: {e!s}"`.
- file: backend/app/inventory/import_excel.py, line 105-108, 136-137.
- file: backend/app/backup/restore_delete.py, line 39-43, 68-74.

**Solusi**
Kembalikan pesan error generik ke client; catat detail exception lengkap hanya ke log server internal.

---

## Temuan 19

**Nama Bug**
Import Excel: cache kode produk in-memory rentan race condition, dan constraint violation yang tidak tertangkap berpotensi meracuni (poison) transaksi untuk seluruh baris berikutnya

**Severity**
Low

**Bukti**
- file: backend/app/inventory/import_excel.py, line 51-53 (`existing_kodes` diambil sekali di awal), line 89-103 (dicek in-memory, bukan mengandalkan constraint unik database).
- Setiap baris dibungkus `try/except Exception` generik (line 58-108) yang menganggap error hanya berlaku per baris, padahal jika `db.execute()` gagal karena pelanggaran constraint (mis. `kode` unik yang baru saja di-insert oleh request lain), PostgreSQL akan menandai seluruh transaksi sebagai aborted — seluruh `db.execute()` berikutnya pada request yang sama (baris-baris selanjutnya, maupun insert activity_log di line 111-121) akan ikut gagal, tanpa penjelasan bahwa itu penyebabnya.

**Solusi**
Andalkan constraint unik database sebagai sumber kebenaran akhir, gunakan `SAVEPOINT` per baris (atau tangani `IntegrityError` secara eksplisit dengan rollback ke savepoint) agar satu baris bermasalah tidak meracuni transaksi keseluruhan.

---

## Temuan 20

**Nama Bug**
Penghapusan batch stok (`hapus_batch`) mengizinkan penghapusan stok tersisa tanpa syarat alasan, tidak konsisten dengan endpoint adjustment

**Severity**
Low

**Bukti**
- file: backend/app/inventory/batch_crud.py, line 102-148: batch dengan `qty_sisa > 0` bisa dihapus permanen (line 123-134) tanpa parameter alasan wajib.
- Bandingkan file: backend/app/inventory/stock_adjustment.py, line 20: `alasan: str = Field(..., min_length=5, ...)` untuk pengurangan stok sejenis.

**Solusi**
Wajibkan alasan/justifikasi saat menghapus batch yang masih memiliki sisa stok, atau arahkan ke endpoint adjustment yang sudah punya kontrol tersebut.

---

## Temuan 21

**Nama Bug**
Kegagalan pencatatan activity log ditelan secara diam-diam dan tidak konsisten di banyak tempat; helper logging best-effort khusus tidak pernah dipakai

**Severity**
Low

**Bukti**
- file: backend/app/activity_log/logger.py, line 15-55 (`log_action`) dirancang eksplisit sebagai helper best-effort, namun tidak diimpor/dipanggil di file manapun pada backend/app (dead code).
- Sebagai gantinya, tiap modul menulis ulang raw SQL INSERT ke `activity_log` dengan penanganan error tidak konsisten: sebagian dibungkus `try/except Exception: pass` (users/delete.py line 51-61; users/crud.py line 122-132; backup/create_list_download.py line 102-113; backup/restore_delete.py line 77-88, 114-125; activity_log/list_log.py line 108-118), sementara modul lain (kasir/checkout_service.py line 174-184; inventory/produk_crud.py line 91-100) sama sekali tidak dibungkus, sehingga kegagalan insert log berpotensi membatalkan transaksi bisnis utama.

**Solusi**
Konsolidasikan seluruh pencatatan activity log lewat satu helper best-effort yang konsisten (`log_action` yang sudah ada), agar kegagalan logging tidak pernah membatalkan operasi bisnis maupun tertelan tanpa jejak.

---

## Temuan 22

**Nama Bug**
Penggunaan `print()` untuk pelaporan error alih-alih modul `logging`

**Severity**
Low

**Bukti**
- file: backend/app/activity_log/logger.py, line 54
- file: backend/app/ml/job_infra.py, line 83
- Tidak ditemukan satupun `import logging` di seluruh backend/app (`grep -rn "^import logging"` kosong). Error hanya dicetak ke stdout via `print()`, tanpa level severity, timestamp terstruktur, atau kemungkinan diarahkan ke sistem monitoring/log aggregator.

**Solusi**
Gunakan modul `logging` standar dengan konfigurasi level dan handler yang sesuai untuk seluruh pelaporan error backend.

---

## Temuan 23

**Nama Bug**
Entry lockout untuk username dengan percobaan gagal di bawah ambang batas tidak pernah dibersihkan (memory growth)

**Severity**
Low

**Bukti**
- file: backend/app/auth/lockout.py, line 5, 30-50: `_lockout_store[username] = (attempts, None)` (line 49) hanya dihapus saat lockout kedaluwarsa (line 25) atau login berhasil via `reset_attempts` (line 52-54). Percobaan gagal yang tidak pernah mencapai `MAX_ATTEMPTS` dan tidak pernah diikuti login berhasil akan tersimpan permanen di dictionary in-memory selama proses berjalan.

**Solusi**
Tambahkan mekanisme kedaluwarsa/pembersihan berkala untuk entry percobaan gagal yang sudah lama tidak aktif.

---

## Temuan 24

**Nama Bug**
Pemanggilan `pg_dump`/`psql` melalui subprocess tanpa timeout

**Severity**
Low

**Bukti**
- file: backend/app/backup/create_list_download.py, line 59-62
- file: backend/app/backup/restore_delete.py, line 59-62
- `subprocess.run([...], capture_output=True, text=True, env=env)` dipanggil tanpa parameter `timeout`. Jika proses `pg_dump`/`psql` hang, request HTTP yang memicunya akan tertahan tanpa batas waktu, menahan worker.

**Solusi**
Tambahkan `timeout` pada pemanggilan subprocess dan tangani kondisi timeout secara eksplisit.

---

## Temuan 25

**Nama Bug**
Kredensial database default hardcoded sebagai fallback konfigurasi

**Severity**
Low

**Bukti**
- file: backend/app/database.py, line 6-9: `DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://kasir:kasir@localhost:5432/kasir_pos")`.

**Solusi**
Hilangkan default kredensial di source code; wajibkan `DATABASE_URL` diset eksplisit melalui environment.

---

## Temuan 26

**Nama Bug**
Dependency `passlib[bcrypt]` terpasang tapi tidak pernah digunakan

**Severity**
Info

**Bukti**
- file: backend/requirements.txt: `passlib[bcrypt]`.
- Tidak ditemukan import `passlib`/`bcrypt` di backend/app manapun; hashing password diimplementasikan manual via `hashlib.pbkdf2_hmac` di backend/app/auth/security.py, line 12-35.

**Solusi**
Hapus dependency yang tidak terpakai, atau migrasikan implementasi agar konsisten memakai library yang sudah didaftarkan.

---

## Temuan 27

**Nama Bug**
Service Redis disediakan di infrastruktur namun tidak pernah diintegrasikan ke kode backend

**Severity**
Info

**Bukti**
- file: docker-compose.yml, service `redis` dan `REDIS_URL: redis://redis:6379/0` diteruskan ke container `backend`.
- Tidak ada import redis maupun penggunaan `REDIS_URL` di backend/app manapun; komentar di backend/app/auth/lockout.py, line 4 mengindikasikan Redis dimaksudkan untuk kebutuhan ini (Temuan 8) namun tidak pernah diimplementasikan.

**Solusi**
Implementasikan penggunaan Redis sesuai rencana (state lockout/cache), atau hapus service Redis dari konfigurasi jika tidak dibutuhkan.

---

## Temuan 28

**Nama Bug**
Tidak ada constraint database yang mencegah `qty_sisa` negatif pada tabel `produk_batch`

**Severity**
Info

**Bukti**
- file: migrations/0001_produk_batch_pelanggan.sql, line 18-27: kolom `qty_sisa INT NOT NULL` tanpa `CHECK (qty_sisa >= 0)`.
- Berhubungan dengan Temuan 6 (race condition tanpa row locking) — tidak ada lapisan pertahanan terakhir di level database terhadap stok negatif.

**Solusi**
Tambahkan constraint `CHECK (qty_sisa >= 0)` pada kolom tersebut.



## Temuan 29

**Nama Bug**
CI tidak pernah menjalankan test suite bisnis inti (FIFO, checkout, retur stok) — hanya 1 test placeholder yang benar-benar tereksekusi

**Severity**
Critical

**Bukti**
- file: `.github/workflows/ci.yml` — step test: `PYTHONPATH=backend pytest backend/tests -q`.
- Tidak ada `pytest.ini`/`pyproject.toml`/`setup.cfg` yang mengatur `testpaths`, sehingga command ini HANYA mengoleksi isi folder `backend/tests`.
- Test bisnis inti berada di lokasi lain: `backend/app/inventory/tests/test_fifo.py`, `backend/app/kasir/tests/test_checkout_service.py`, `backend/app/transaksi/tests/test_retur_stok.py` — total belasan test-case regresi untuk FIFO, checkout, dan retur stok.
- Diverifikasi langsung: menjalankan persis command CI (`PYTHONPATH=backend pytest backend/tests -q --collect-only`) hanya mengoleksi **1 test** (`test_health_ok`). Ketiga file test di atas tidak pernah disentuh oleh pipeline CI sama sekali.
- Dampak: setiap regresi pada logika FIFO, checkout, atau retur stok (termasuk bug-bug pada Temuan 1-28 di laporan sebelumnya) tidak akan pernah terdeteksi oleh CI, walaupun test-case yang relevan sudah ditulis.

**Solusi**
Ubah command test CI menjadi `pytest backend -q` (atau tambahkan `testpaths = ["backend"]` di `pyproject.toml`/`pytest.ini`) agar seluruh test di `backend/app/*/tests` ikut terkoleksi dan dijalankan.

---

## Temuan 30

**Nama Bug**
`CheckoutItem.qty` tidak divalidasi (boleh 0 atau negatif) — memungkinkan bypass validasi stok dan pemalsuan omzet/profit/qty terjual

**Severity**
Critical

**Bukti**
- file: `backend/app/kasir/checkout_service.py`, line 9-16: `class CheckoutItem(BaseModel): produk_id: int; qty: int; harga_jual: float; diskon: float = 0; ...` — **tidak ada** `Field(..., gt=0)` pada `qty` (juga tidak ada batas bawah pada `harga_jual`/`diskon`).
- Bandingkan dengan model sejenis di modul lain yang semuanya mewajibkan qty positif: `TambahBatchRequest.qty: int = Field(..., gt=0)` (batch_crud.py), `AdjustmentRequest.qty: int = Field(..., gt=0)` (stock_adjustment.py), `EditItemRequest.qty_baru: int = Field(..., gt=0)` (edit_item.py). Hanya model checkout yang luput.
- Validasi stok di `proses_checkout` mengagregasi qty per `produk_id` (`qty_needed[pid] += item.qty`) SEBELUM memotong FIFO. Karena qty boleh negatif, satu baris qty besar bisa "dinetralkan" oleh baris qty negatif pada produk yang sama sehingga total kebutuhan lolos validasi stok, padahal baris pertama mengklaim menjual jauh lebih banyak dari stok yang ada.
- Pada loop pemotongan FIFO, baris dengan qty≤0 langsung `break` tanpa memotong stok sama sekali (`if sisa_yg_harus_dipotong <= 0: break`), sehingga stok riil yang berkurang hanya sebesar qty netto, sementara `transaksi_detail` tetap menyimpan baris dengan qty besar apa adanya.
- **Diverifikasi langsung** (dieksekusi terhadap `proses_checkout` yang asli): produk dengan stok = 3 unit, dikirim keranjang berisi `{qty: 100, harga_jual: 5000}` dan `{qty: -97, harga_jual: 5000}` pada produk yang sama → checkout **berhasil** (seharusnya ditolak karena baris pertama meminta 100 padahal stok cuma 3). Hasil: `total=15000`, `profit=12000`, stok akhir habis (0), dan `transaksi_detail` menyimpan baris `(qty=100, harga_jual=5000)` dan `(qty=-97, harga_jual=5000)` apa adanya.
- Dampak lanjutan: `transaksi_detail.qty` yang bisa negatif juga meracuni laporan yang men-`SUM(td.qty)` langsung (`laporan/ringkasan_transaksi_produk.py`, `laporan/export_xlsx.py`) dan skor ML (`ml/prediksi_demand.py`, `ml/promo_recommendation.py`, `ml/bonus_kasir.py`), karena semuanya mengasumsikan qty selalu positif.

**Solusi**
Tambahkan `qty: int = Field(..., gt=0)` pada `CheckoutItem`, dan validasi bahwa `harga_jual`/`diskon` berada dalam rentang non-negatif (lihat juga Temuan 31).

---

## Temuan 31

**Nama Bug**
`harga_jual`, `diskon`, dan `harga_tinta` pada request checkout sepenuhnya dikontrol client tanpa validasi terhadap harga referensi produk di database

**Severity**
High

**Bukti**
- file: `backend/app/kasir/checkout_service.py`, line 9-16 (`CheckoutItem`) dan line 130-138 (`proses_checkout`): `harga_jual = item.harga_jual` diambil langsung dari request client dan disimpan sebagai harga jual final ke `transaksi_detail` — **tidak pernah** dibandingkan dengan `produk.harga_jual` yang tersimpan di tabel `produk`.
- `item.diskon` dan `item.harga_tinta` juga diterima mentah-mentah dari client tanpa batas atas/bawah, dan langsung memengaruhi `total_omzet`/`profit` yang tercatat.
- HPP (`harga_beli`) memang dihitung server-side lewat FIFO sehingga aman, tetapi sisi harga jual/pendapatan tidak punya lapisan validasi apa pun.
- Dampak: siapa pun yang bisa memanggil endpoint `/kasir/checkout` (role `kasir`, atau client yang dimodifikasi/di-*tamper*) dapat mencatat transaksi dengan harga jual berapa pun (mis. Rp 1) untuk produk apa pun, memalsukan omzet/profit yang tersimpan — potensi celah kecurangan finansial maupun kesalahan tak sengaja akibat client yang menyimpan harga usang (stale cache).

**Solusi**
Ambil `harga_jual` acuan dari tabel `produk` di server saat checkout, dan validasi `harga_jual`/`diskon` yang dikirim client tidak menyimpang dari acuan tersebut (atau tolak field tersebut dari request sama sekali dan hitung sepenuhnya di server).

---

## Temuan 32

**Nama Bug**
Formula omzet & profit tidak konsisten terkait `harga_tinta` antara checkout dan rekalkulasi edit-item/laporan — total & profit transaksi berubah dan menjadi salah begitu ada edit qty

**Severity**
Critical

**Bukti**
- file: `backend/app/kasir/checkout_service.py`, line 130-165 — saat checkout: `total_omzet += harga_jual * qty` (TIDAK termasuk `harga_tinta`), sedangkan `harga_tinta` hanya dikurangkan sebagai biaya di `profit = total_omzet - total_hpp - total_tinta`.
- file: `backend/app/transaksi/edit_item.py`, line 30-39 (`recalculate_total_profit`, dipanggil otomatis oleh endpoint `PATCH /transaksi/{id}/item/{detail_id}` setiap kali qty item apa pun di transaksi tersebut diubah): `subtotal_jual = (harga_jual + harga_tinta) * qty` (tinta **dimasukkan** ke total) dan `profit += subtotal_jual - subtotal_hpp` — secara matematis ini menambahkan kontribusi tinta ke profit, bukan menguranginya.
- file: `backend/app/laporan/ringkasan_transaksi_produk.py`, line 136-137, dan `backend/app/laporan/export_xlsx.py`, line 116 — kedua endpoint laporan memakai formula yang sama dengan `recalculate_total_profit` (`(harga_jual+harga_tinta)` sebagai omzet, tinta menambah profit), sehingga **berbeda** dari formula asli di `checkout_service.py`.
- Ini bug BERBEDA dari Temuan 11 (yang soal HPP hasil `keluar_fifo` diabaikan) — ini soal rumus total/profit itu sendiri yang tidak konsisten di seluruh codebase, terlepas dari Temuan 11.
- **Diverifikasi langsung** (dieksekusi terhadap kode asli): transaksi dibuat via `proses_checkout` dengan 1 item (qty=5, harga_jual=2000, harga_tinta=300, HPP=1000/unit) → hasil checkout: `total=10000, profit=3500` (5000 HPP + 1500 tinta dikurangkan dari 10000 omzet — sesuai rumus checkout). Memanggil `recalculate_total_profit` untuk transaksi yang SAMA (mensimulasikan efek endpoint edit-item, tanpa mengubah qty apa pun) menghasilkan `total=11500, profit=6500` — total naik 1500 (sebesar total tinta) dan profit naik 3000 (2× nilai tinta, akibat pembalikan tanda).
- Dampak: begitu kasir/admin mengedit qty SATU item saja pada sebuah transaksi yang punya `harga_tinta`, seluruh header `total`/`profit` transaksi tersebut ikut terhitung ulang dengan rumus yang salah dan berubah permanen — merusak integritas data finansial yang dipakai di dashboard, laporan, dan skor bonus kasir. Juga menyebabkan laporan tab "Transaksi" (pakai `t.total` tersimpan) dan tab "Produk" (rekalkulasi dari `transaksi_detail`) menampilkan angka omzet/profit berbeda untuk periode yang identik.
- Catatan: test yang sudah ada (`test_recalculate_setelah_edit_qty` di `transaksi/tests/test_retur_stok.py`) tidak mendeteksi bug ini karena tidak pernah menguji dengan `harga_tinta` bukan-nol — ditambah lagi test ini juga tidak pernah dijalankan CI (lihat Temuan 29).

**Solusi**
Satukan definisi "total"/"omzet"/"profit" (apakah `harga_tinta` bagian dari pendapatan atau biaya) di SATU tempat (helper/fungsi bersama), lalu pakai fungsi yang sama di `checkout_service.py`, `edit_item.py`, dan seluruh endpoint laporan.

---

## Temuan 33

**Nama Bug**
`SESSION_TIMEOUT` pada `docker-compose.yml` diset dengan asumsi satuan detik, padahal kode membacanya sebagai MENIT — sesi JWT default valid 60 jam, bukan 1 jam

**Severity**
Medium

**Bukti**
- file: `backend/app/auth/security.py`, line 10: `SESSION_TIMEOUT_MINUTES = int(os.environ.get("SESSION_TIMEOUT", "60"))`, dipakai langsung sebagai `timedelta(minutes=SESSION_TIMEOUT_MINUTES)` (line 40).
- file: `docker-compose.yml`, line 34: `SESSION_TIMEOUT: "3600"`.
- file: `docs/PRD.md` baris 69 & 256 menyatakan kontrak yang dimaksud: *"Session timeout idle: 60 menit default (`SESSION_TIMEOUT` env var, 0 = nonaktif)"* — mengonfirmasi env var ini memang dimaksudkan dalam satuan menit dengan default 60.
- Nilai `"3600"` di `docker-compose.yml` khas nilai dalam DETIK (3600 detik = 1 jam) — pola penamaan umum untuk env var timeout. Karena kode membacanya sebagai menit, hasil sebenarnya adalah 3600 menit = **60 jam** masa berlaku token, alih-alih 1 jam yang tampaknya dimaksud oleh siapa pun yang menulis nilai ini di konfigurasi deployment bawaan repo sendiri.
- Dampak: token JWT pada deployment default (docker-compose bawaan repo) valid jauh lebih lama dari yang dikira siapa pun yang membaca angka "3600" sebagai indikasi 1 jam, memperbesar jendela risiko bila token dicuri/bocor.

**Solusi**
Perbaiki nilai di `docker-compose.yml` menjadi `"60"` (menit) jika ingin idle-timeout 1 jam, atau ubah kode agar env var dan variabel diberi nama eksplisit satuannya (mis. `SESSION_TIMEOUT_SECONDS`) untuk menghindari kesalahan unit yang sama di kemudian hari.

---

## Temuan 34

**Nama Bug**
Direktori backup (`backend/backups`) tidak memiliki persistent volume khusus di konfigurasi deployment — berbeda dengan database yang sudah punya named volume

**Severity**
Medium

**Bukti**
- file: `docker-compose.yml` — service `db` punya named volume eksplisit `kasir_pos_db_data:/var/lib/postgresql/data`, tetapi service `backend` hanya punya `volumes: - ./backend:/app` (bind-mount seluruh source code untuk keperluan `--reload` di mode dev) dan TIDAK ada volume khusus untuk folder `backups/`.
- file: `backend/app/backup/create_list_download.py`, line 18-19: `BACKUP_DIR` diresolusi relatif terhadap lokasi source code (`backend/backups`), yang saat ini "bertahan" hanya karena kebetulan seluruh folder `backend` di-bind-mount ke container untuk mode dev.
- Jika image di-build dan dijalankan tanpa bind-mount seluruh source (pola umum untuk deployment produksi — biasanya bind-mount source dan flag `--reload` dilepas), file backup yang dibuat lewat endpoint `POST /backup/create` (termasuk "safety backup" otomatis sebelum restore) akan tersimpan di filesystem container yang bersifat ephemeral dan **hilang saat container direstart atau diganti image-nya** — bertentangan dengan tujuan fitur backup itu sendiri.

**Solusi**
Tambahkan named volume khusus untuk `backend/backups` (mis. `kasir_pos_backups:/app/backups`) di `docker-compose.yml`/konfigurasi produksi, agar backup tidak bergantung pada bind-mount source code yang sifatnya kebetulan dan dev-only.

---

## Temuan 35

**Nama Bug**
Dependency `numpy`/`scikit-learn` untuk model prediksi omzet tidak pernah dicantumkan di `requirements.txt` — fitur auto-seleksi model (Random Forest / Linear Regression) selalu mati di setiap deployment standar

**Severity**
Medium

**Bukti**
- file: `backend/app/ml/prediksi_omzet.py`, line 12-19: `try: import numpy as np; from sklearn.ensemble import RandomForestRegressor; ...; HAS_SKLEARN = True except ImportError: HAS_SKLEARN = False`.
- file: `backend/requirements.txt` — tidak berisi `numpy`, `scikit-learn`, maupun `scipy` sama sekali.
- file: `backend/Dockerfile` — base image `python:3.12-slim` (tanpa paket data-science bawaan) dan hanya menjalankan `pip install -r requirements.txt`; `.github/workflows/ci.yml` juga hanya `pip install -r backend/requirements.txt`.
- Diverifikasi langsung: `pip install -r backend/requirements.txt` diikuti `python -c "import sklearn"` tanpa `requirements.txt` mencantumkan paket tersebut mengonfirmasi paket ini bukan bagian dari environment yang didefinisikan repo.
- Karena kode membungkus import dengan `try/except ImportError`, aplikasi TIDAK crash — tapi `HAS_SKLEARN` akan selalu `False` di setiap deployment yang murni mengikuti `requirements.txt` (Docker build maupun CI), sehingga cabang kode Random Forest/Linear Regression (line 92-197, termasuk logika pemilihan model terbaik lewat RMSE split 80/20) menjadi **dead code permanen di produksi** — endpoint `/ml/prediksi-omzet` akan selalu memakai fallback Holt Exponential Smoothing meski data historis sudah cukup panjang (≥35 hari), sambil tetap melaporkan field `eval_info: "Model terbaik dipilih otomatis via time-based split."` yang menyesatkan karena seleksi tersebut tidak pernah benar-benar terjadi.

**Solusi**
Tambahkan `numpy` dan `scikit-learn` ke `requirements.txt` jika fitur ini memang ingin aktif di produksi, atau hapus jalur kode Random Forest/Linear Regression beserta klaim "pemilihan model otomatis" jika memang tidak akan pernah dijalankan.

---

## Temuan 36

**Nama Bug**
Agregasi dashboard memakai `datetime.now()` lokal/naive, sementara transaksi disimpan dengan `datetime.now(timezone.utc)` — berpotensi pergeseran satu hari/bulan tergantung timezone container

**Severity**
Low

**Bukti**
- file: `backend/app/dashboard/stats.py`, line 26, 56-60 dan `backend/app/dashboard/charts.py`, line 15, 62, 96-99: seluruhnya memakai `datetime.now()` (naive, mengikuti timezone sistem tempat proses Python berjalan) untuk menentukan "bulan berjalan"/"7 hari terakhir".
- Sebaliknya, penulisan timestamp transaksi memakai `datetime.now(timezone.utc)` secara eksplisit (`checkout_service.py` line 33, `fifo_service.py` line 17, `batch_crud.py` line 75, dst.).
- Jika container backend tidak secara eksplisit dikonfigurasi ke timezone UTC (tidak ada pengaturan `TZ` di `Dockerfile`/`docker-compose.yml`), dan berjalan di server dengan timezone lain (mis. WIB/UTC+7, relevan untuk operasional toko di Indonesia), transaksi yang dibuat menjelang tengah malam bisa masuk ke "hari"/"bulan" yang berbeda antara data yang tersimpan (berbasis UTC) dan agregasi dashboard (berbasis `datetime.now()` lokal container) — comparisons "bulan ini vs bulan lalu" pada growth stats bisa keliru di sekitar pergantian bulan.

**Solusi**
Gunakan `datetime.now(timezone.utc)` secara konsisten (atau timezone eksplisit yang sama dengan yang dipakai untuk menyimpan `tanggal`) di seluruh perhitungan agregasi dashboard, dan pastikan container backend berjalan dengan `TZ=UTC` (atau timezone yang didokumentasikan secara eksplisit) agar konsisten dengan tempat lain di codebase.

---

# Ringkasan

| # | Judul Singkat | Severity |
|---|---|---|
| 29 | Test suite bisnis inti tidak pernah dijalankan CI | Critical |
| 30 | `CheckoutItem.qty` tanpa validasi → bypass stok & pemalsuan data | Critical |
| 31 | Harga jual/diskon checkout dikontrol penuh oleh client | High |
| 32 | Formula omzet/profit tidak konsisten (tinta) antara checkout vs edit-item/laporan | Critical |
| 33 | `SESSION_TIMEOUT` salah satuan di docker-compose (60 jam alih-alih 1 jam) | Medium |
| 34 | Backup tidak punya persistent volume khusus | Medium |
| 35 | numpy/scikit-learn tidak ada di requirements.txt → model ML selalu fallback | Medium |
| 36 | `datetime.now()` naive vs UTC pada dashboard | Low |
