---
title: kasir-POS — Patch Log
latest_patch_id: PATCH-2026-07-31-088
total_entries: 88
---

# PATCHLOG.md — Log Perubahan Proyek (Single Source of Truth)

> **Format:** Prepend-only (entri terbaru ditambahkan paling ATAS, tepat di bawah baris ini).
> Jangan pernah menghapus atau menimpa entri lama.
> **ID:** `PATCH-YYYY-MM-DD-NNN`, NNN = total entri berjalan (tidak reset per hari), immutable
> begitu ditulis.
> **Dikelola oleh:** `automation/patchlog.py` (lihat `AI_CONTEXT.md` untuk cara pakai CLI-nya).
> Jangan edit manual kecuali untuk memperbaiki typo — semua entry baru WAJIB lewat CLI supaya
> format tetap konsisten dan bisa diparse otomatis (`automation/patchlog.py verify`).
>
> Entri PATCH-2026-07-30-001 s/d PATCH-2026-07-30-061 adalah hasil migrasi
> dari `implementasi_plan/patchlog.md` (rencana migrasi awal, task 0-9, semua sudah selesai).
> Entri sesudahnya adalah hasil migrasi dari `implementasi_plan/addendum_29-36/patchlog.md`
> (addendum perbaikan bug 29-36). Field `Type`/`Area`/`Priority`/`Breaking Change`/
> `Regression Risk` bernilai `Unclassified` pada entri hasil migrasi karena data tsb tidak
> tersedia di format lama — ini SAH, bukan bug (lihat docstring `automation/patchlog.py`).

---

## PATCH-2026-07-31-088

**Tanggal:** 2026-07-31
**Timestamp:** 10:15
**Git Branch:** main
**Git Commit:** 746037e
**Type:** Feature
**Area:** Backend
**Priority:** Medium
**Title:** Aktifkan dependensi scikit-learn untuk prediksi omzet (Temuan 35)

**Reason:** Memungkinkan model Random Forest/Linear Regression dipakai

**Root Cause:**
Library scipy/scikit-learn dan numpy belum dideklarasikan

**Solution:**
Tambahkan numpy dan scikit-learn ke requirements.txt berdasarkan Keputusan Produk A

**Changed Files:**
- `backend/requirements.txt`
- `docs/PRD.md`

**Changed Symbols:**
- (tidak ada)

**Tests:** Manual

**Breaking Change:** No

**Regression Risk:** Medium

**Related Patch:** -

**Status:** Merged

**Notes:**
-

---

## PATCH-2026-07-31-087

**Tanggal:** 2026-07-31
**Timestamp:** 10:15
**Git Branch:** main
**Git Commit:** 746037e
**Type:** Fix
**Area:** Backend
**Priority:** Medium
**Title:** Perbaiki bare except yang menelan NameError di run_ml_job (Temuan 13)

**Reason:** Mencegah job terjebak di status 'training' permanen

**Root Cause:**
Variabel manager tidak terdefinisi menyebabkan NameError tertelan saat Exception terjadi

**Solution:**
Inisialisasi manager=None dan tangani fallback perubahan status DB secara manual

**Changed Files:**
- `backend/app/ml/job_infra.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** Manual

**Breaking Change:** No

**Regression Risk:** Low

**Related Patch:** -

**Status:** Merged

**Notes:**
-

---

## PATCH-2026-07-31-086

**Tanggal:** 2026-07-31
**Timestamp:** 10:15
**Git Branch:** main
**Git Commit:** 746037e
**Type:** Fix
**Area:** Backend
**Priority:** Medium
**Title:** Atomic check-and-set untuk trigger job ML (Temuan 12)

**Reason:** Menghindari dua job ML berjalan secara bersamaan

**Root Cause:**
Pengecekan cache dan penentuan status dilakukan tidak secara atomic

**Solution:**
Gunakan INSERT ON CONFLICT DO UPDATE dengan klausa WHERE

**Changed Files:**
- `backend/app/ml/job_infra.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** Manual

**Breaking Change:** No

**Regression Risk:** Medium

**Related Patch:** -

**Status:** Merged

**Notes:**
-

---

## PATCH-2026-07-31-085

**Tanggal:** 2026-07-31
**Timestamp:** 10:10
**Git Branch:** main
**Git Commit:** 746037e
**Type:** Fix
**Area:** Infrastructure
**Priority:** Medium
**Title:** Named volume persistent untuk backend/backups (Temuan 34)

**Reason:** File backup hilang saat docker container direbuild

**Root Cause:**
Service backend tidak memetakan volume khusus untuk backup

**Solution:**
Tambahkan kasir_pos_backups named volume di docker-compose.yml

**Changed Files:**
- `docker-compose.yml`

**Changed Symbols:**
- (tidak ada)

**Tests:** Manual

**Breaking Change:** No

**Regression Risk:** Low

**Related Patch:** -

**Status:** Merged

**Notes:**
-

---

## PATCH-2026-07-31-084

**Tanggal:** 2026-07-31
**Timestamp:** 10:10
**Git Branch:** main
**Git Commit:** 746037e
**Type:** Fix
**Area:** Backend
**Priority:** Medium
**Title:** Timeout subprocess pg_dump/psql dan penanganan exception do_backup (Temuan 16, 24)

**Reason:** Mencegah proses terhenti (hang) tanpa batas waktu dan expose internal traceback

**Root Cause:**
Subprocess tidak dipanggil dengan argumen timeout; exception bocor

**Solution:**
Tambahkan timeout 120/300 detik dan tangkap TimeoutExpired. Log raw exception

**Changed Files:**
- `backend/app/backup/create_list_download.py`
- `backend/app/backup/restore_delete.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** Manual

**Breaking Change:** No

**Regression Risk:** Low

**Related Patch:** -

**Status:** Merged

**Notes:**
-

---

## PATCH-2026-07-31-083

**Tanggal:** 2026-07-31
**Timestamp:** 10:10
**Git Branch:** main
**Git Commit:** 746037e
**Type:** Fix
**Area:** Backend
**Priority:** High
**Title:** psql restore pakai ON_ERROR_STOP=1 dan engine.dispose() (Temuan 9, 15)

**Reason:** Mencegah restore parsial dan melepas pool koneksi SQLAlchemy

**Root Cause:**
psql tidak diset untuk stop saat error dan session masih aktif

**Solution:**
Tambahkan flag ON_ERROR_STOP=1, --single-transaction, dan call engine.dispose()

**Changed Files:**
- `backend/app/backup/restore_delete.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** Manual

**Breaking Change:** No

**Regression Risk:** Low

**Related Patch:** -

**Status:** Merged

**Notes:**
-

---

## PATCH-2026-07-31-082

**Tanggal:** 2026-07-31
**Timestamp:** 10:04
**Git Branch:** main
**Git Commit:** 746037e
**Type:** Fix
**Area:** Backend
**Priority:** Low
**Title:** Jangan expose exception internal mentah ke client (Temuan 18)

**Reason:** Pesan exception membocorkan detail internal

**Root Cause:**
Exception di-return langsung ke API response

**Solution:**
Gunakan logging.exception dan return pesan generik.

**Changed Files:**
- `backend/app/kasir/checkout_endpoint.py`
- `backend/app/inventory/import_excel.py`
- `backend/app/backup/restore_delete.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** pytest tests/backend -q

**Breaking Change:** No

**Regression Risk:** Low

**Related Patch:** -

**Status:** Merged

**Notes:**
-

---

## PATCH-2026-07-31-081

**Tanggal:** 2026-07-31
**Timestamp:** 10:04
**Git Branch:** main
**Git Commit:** 746037e
**Type:** Fix
**Area:** Backend
**Priority:** Medium
**Title:** Invalidasi token via token_version saat password/role/status berubah (Temuan 17)

**Reason:** Token JWT tidak bisa dicabut ketika role atau status berubah.

**Root Cause:**
Tidak ada validasi versi/jti di payload JWT

**Solution:**
Tambahkan kolom token_version, increment saat update, tolak jika tidak match.

**Changed Files:**
- `migrations/0006_users_token_version.sql`
- `backend/app/auth/login.py`
- `backend/app/auth/session.py`
- `backend/app/users/crud.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** pytest tests/backend -q

**Breaking Change:** No

**Regression Risk:** Medium

**Related Patch:** -

**Status:** Merged

**Notes:**
-

---

## PATCH-2026-07-31-080

**Tanggal:** 2026-07-31
**Timestamp:** 10:04
**Git Branch:** main
**Git Commit:** 746037e
**Type:** Fix
**Area:** Backend
**Priority:** Low
**Title:** Hapus default kredensial DATABASE_URL hardcoded (Temuan 25)

**Reason:** Mencegah kebocoran kredensial

**Root Cause:**
DATABASE_URL memiliki fallback hardcoded

**Solution:**
Hapus fallback hardcoded, gunakan fail-fast.

**Changed Files:**
- `backend/app/database.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** pytest tests/backend -q

**Breaking Change:** Yes

**Regression Risk:** Low

**Related Patch:** -

**Status:** Merged

**Notes:**
-

---

## PATCH-2026-07-31-079

**Tanggal:** 2026-07-31
**Timestamp:** 09:54
**Git Branch:** main
**Git Commit:** 746037e
**Type:** Fix
**Area:** Backend
**Priority:** High
**Title:** SELECT...FOR UPDATE pada validasi & pemotongan stok (Temuan 6)

**Reason:** Race condition pada validasi dan pemotongan batch memungkinkan overselling

**Root Cause:**
Tidak ada row locking pada tabel produk_batch saat pembacaan qty_sisa

**Solution:**
Tambahkan query pre-locking dengan SELECT ... FOR UPDATE pada produk_batch sebelum membaca aggregat qty

**Changed Files:**
- `backend/app/kasir/checkout_service.py`
- `backend/app/transaksi/edit_item.py`
- `backend/app/inventory/stock_adjustment.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** pytest tests/backend/app/kasir -q

**Breaking Change:** No

**Regression Risk:** Medium

**Related Patch:** -

**Status:** Merged

**Notes:**
-

---

## PATCH-2026-07-31-078

**Tanggal:** 2026-07-31
**Timestamp:** 09:54
**Git Branch:** main
**Git Commit:** 746037e
**Type:** Fix
**Area:** Backend
**Priority:** Medium
**Title:** HPP weighted-average saat qty item naik (Temuan 11)

**Reason:** Harga beli transaksi_detail tidak diupdate ketika QTY dinaikkan dan memotong batch FIFO tambahan

**Root Cause:**
HPP baru dibuang pada pemanggilan keluar_fifo saat penambahan qty item di edit_item

**Solution:**
Tangkap HPP baru, hitung weighted average terhadap harga_beli lama, lalu perbarui ke transaksi_detail

**Changed Files:**
- `backend/app/transaksi/edit_item.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** pytest tests/backend/app/transaksi -q

**Breaking Change:** No

**Regression Risk:** Low

**Related Patch:** -

**Status:** Merged

**Notes:**
-

---

## PATCH-2026-07-31-077

**Tanggal:** 2026-07-31
**Timestamp:** 09:54
**Git Branch:** main
**Git Commit:** 746037e
**Type:** Fix
**Area:** Backend
**Priority:** Critical
**Title:** Satukan formula total/profit lintas checkout/edit-item/laporan (Temuan 32)

**Reason:** Formula profit antara checkout, edit item, dan laporan tidak konsisten akibat penanganan harga tinta

**Root Cause:**
Duplikasi formula manual dan beda penempatan harga tinta di hitungan omzet/profit

**Solution:**
Ekstraksi hitungan total dan profit ke helper terpusat hitung_total_dan_profit dan perbarui call sites

**Changed Files:**
- `backend/app/kasir/pricing.py`
- `backend/app/kasir/checkout_service.py`
- `backend/app/transaksi/edit_item.py`
- `backend/app/laporan/ringkasan_transaksi_produk.py`
- `backend/app/laporan/export_xlsx.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** pytest tests/backend/app/transaksi -q

**Breaking Change:** Yes

**Regression Risk:** Medium

**Related Patch:** -

**Status:** Merged

**Notes:**
-

---

## PATCH-2026-07-31-076

**Tanggal:** 2026-07-31
**Timestamp:** 09:43
**Git Branch:** main
**Git Commit:** 746037e
**Type:** Fix
**Area:** Testing
**Priority:** High
**Title:** Penyelesaian prasyarat test PostgreSQL untuk Sesi 2

**Reason:** Mengonfigurasi CI untuk memakai PostgreSQL dan membersihkan folder test usang

**Root Cause:**
Setup test sebelumnya tidak bisa menangkap masalah fungsi eksklusif SQLite, dan ada folder duplikat test lama yang tertinggal

**Solution:**
Menambahkan docker service postgresql ke ci.yml, menghapus 3 folder duplikat backend/app/*/tests/

**Changed Files:**
- `.github/workflows/ci.yml`
- `backend/app/inventory/tests`
- `backend/app/kasir/tests`
- `backend/app/transaksi/tests`

**Changed Symbols:**
- (tidak ada)

**Tests:** pytest tests/backend -q

**Breaking Change:** No

**Regression Risk:** Low

**Related Patch:** -

**Status:** Merged

**Notes:**
-

---

## PATCH-2026-07-31-075

**Tanggal:** 2026-07-31
**Timestamp:** 09:37
**Git Branch:** main
**Git Commit:** 746037e
**Type:** Fix
**Area:** Database
**Priority:** Critical
**Title:** Tambah kolom pelanggan.keterangan via migrasi

**Reason:** Mencegah error saat CRUD pelanggan yang membutuhkan field keterangan

**Root Cause:**
Kolom keterangan direferensikan di app tapi belum ada di database, patch sebelumnya malah menghapus referensi tsb

**Solution:**
Membuat file migrasi 0005 untuk menambah kolom keterangan dan mengembalikan penggunaan field keterangan pada CRUD pelanggan

**Changed Files:**
- `backend/app/pelanggan/crud.py`
- `migrations/0005_pelanggan_keterangan.sql`

**Changed Symbols:**
- (tidak ada)

**Tests:** pytest tests/backend -q (di CI)

**Breaking Change:** No

**Regression Risk:** Low

**Related Patch:** -

**Status:** Merged

**Notes:**
-

---

## PATCH-2026-07-31-074

**Tanggal:** 2026-07-31
**Timestamp:** 09:30
**Git Branch:** main
**Git Commit:** 746037e
**Type:** Refactor
**Area:** Backend
**Priority:** High
**Title:** Pindahkan state lockout ke Redis untuk support multi-worker

**Reason:** Mekanisme in-memory dictionary rentan race condition dan bypass lockout saat load-balancing

**Root Cause:**
Gagal login lockout state disimpan di _lockout_store (memory dict) yang tidak dishare antar worker/proses.

**Solution:**
Tambahkan dependensi redis>=5.0 dan modifikasi lockout.py untuk menggunakan atomic INCR, TTL, EXPIRE ke storage Redis tersentralisasi.

**Changed Files:**
- `backend/app/auth/lockout.py`
- `backend/requirements.txt`

**Changed Symbols:**
- (tidak ada)

**Tests:** pytest tests/backend -q (memerlukan instance Redis sungguhan)

**Breaking Change:** No

**Regression Risk:** Low

**Related Patch:** -

**Status:** Merged

**Notes:**
-

---

## PATCH-2026-07-31-073

**Tanggal:** 2026-07-31
**Timestamp:** 09:24
**Git Branch:** main
**Git Commit:** 746037e
**Type:** Fix
**Area:** Backend
**Priority:** High
**Title:** Hapus default hardcoded SECRET_KEY dan wajibkan environment variable

**Reason:** Mencegah celah keamanan JWT forging karena hardcoded key bisa dibaca dari source code

**Root Cause:**
Aplikasi memberikan fallback SECRET_KEY yang hardcoded jika tidak didefinisikan di environment

**Solution:**
Hapus fallback string hardcoded dan lempar ValueError (fail-fast) jika SECRET_KEY tidak ada.

**Changed Files:**
- `backend/app/auth/security.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** pytest tests/backend -q (membutuhkan real PG)

**Breaking Change:** Yes

**Regression Risk:** High

**Related Patch:** -

**Status:** Merged

**Notes:**
-

---

## PATCH-2026-07-31-072

**Tanggal:** 2026-07-31
**Timestamp:** 09:22
**Git Branch:** main
**Git Commit:** 746037e
**Type:** Refactor
**Area:** Backend
**Priority:** High
**Title:** Implementasi Row Locking FOR UPDATE cegah TOCTOU race condition

**Reason:** Mencegah overselling jika ada 2 transaksi bersamaan

**Root Cause:**
Validasi stok di-handle oleh aplikasi di memori tanpa lock database sehingga rawan race condition TOCTOU

**Solution:**
Tambahkan SELECT FOR UPDATE pada saat mengambil batch. Tangani kegagalan bila qty_berhasil < qty yang diminta. Tambahkan constraint DB.

**Changed Files:**
- `backend/app/inventory/fifo_service.py`
- `backend/app/kasir/checkout_service.py`
- `backend/app/transaksi/edit_item.py`
- `backend/app/inventory/stock_adjustment.py`
- `migrations/0004_check_qty_sisa.sql`

**Changed Symbols:**
- (tidak ada)

**Tests:** pytest tests/backend -q (membutuhkan real PG)

**Breaking Change:** No

**Regression Risk:** High

**Related Patch:** -

**Status:** Merged

**Notes:**
-

---

## PATCH-2026-07-31-071

**Tanggal:** 2026-07-31
**Timestamp:** 09:19
**Git Branch:** main
**Git Commit:** 746037e
**Type:** Fix
**Area:** Backend
**Priority:** High
**Title:** Ganti regex URL parser dengan sqlalchemy make_url di Backup

**Reason:** Regex bawaan gagal mem-parse format URL postgresql+psycopg2 sehingga fitur backup/restore tidak bisa digunakan

**Root Cause:**
Regex manual mensyaratkan skema 'postgresql://' dan tidak bisa menangani skema SQLAlchemy yang terkonfigurasi secara default (postgresql+psycopg2://)

**Solution:**
Gunakan fungsi make_url bawaan sqlalchemy.engine.url untuk parsing DATABASE_URL dengan aman.

**Changed Files:**
- `backend/app/backup/create_list_download.py`
- `backend/app/backup/restore_delete.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** pytest tests/backend -q

**Breaking Change:** No

**Regression Risk:** Low

**Related Patch:** -

**Status:** Merged

**Notes:**
-

---

## PATCH-2026-07-31-070

**Tanggal:** 2026-07-31
**Timestamp:** 09:18
**Git Branch:** main
**Git Commit:** 746037e
**Type:** Fix
**Area:** Backend
**Priority:** High
**Title:** Hapus kolom keterangan yang tidak ada dari Pelanggan

**Reason:** Mencegah error column does not exist saat tambah/edit pelanggan

**Root Cause:**
Kolom keterangan direferensikan pada query padahal tidak ada di tabel pelanggan

**Solution:**
Menghapus properti keterangan pada Pydantic model PelangganBase dan pada query INSERT/UPDATE.

**Changed Files:**
- `backend/app/pelanggan/crud.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** pytest tests/backend -q

**Breaking Change:** No

**Regression Risk:** Low

**Related Patch:** -

**Status:** Merged

**Notes:**
-

---

## PATCH-2026-07-31-069

**Tanggal:** 2026-07-31
**Timestamp:** 09:17
**Git Branch:** main
**Git Commit:** 746037e
**Type:** Fix
**Area:** Backend
**Priority:** High
**Title:** Ganti perbandingan boolean is_bonus = 0 menjadi FALSE

**Reason:** PostgreSQL tidak mendukung perbandingan implicit boolean dengan integer

**Root Cause:**
SQLite mentolerir perbandingan BOOLEAN dengan INTEGER 0, namun PostgreSQL memunculkan error type mismatch

**Solution:**
Mengganti td.is_bonus = 0 menjadi td.is_bonus = FALSE di seluruh backend

**Changed Files:**
- `backend/app/ml/promo_recommendation.py`
- `backend/app/ml/prediksi_stok.py`
- `backend/app/ml/prediksi_demand.py`
- `backend/app/laporan/ringkasan_transaksi_produk.py`
- `backend/app/laporan/export_xlsx.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** pytest tests/backend -q (membutuhkan real PG)

**Breaking Change:** No

**Regression Risk:** Low

**Related Patch:** -

**Status:** Merged

**Notes:**
-

---

## PATCH-2026-07-31-068

**Tanggal:** 2026-07-31
**Timestamp:** 09:16
**Git Branch:** main
**Git Commit:** 746037e
**Type:** Refactor
**Area:** Backend
**Priority:** High
**Title:** Ganti fungsi tanggal SQLite ke PostgreSQL

**Reason:** Mencegah error query (strftime/date not found) di production PostgreSQL

**Root Cause:**
Query memakai syntax SQLite seperti strftime yang tidak jalan di PostgreSQL

**Solution:**
Ganti dengan to_char, CURRENT_DATE dan operator INTERVAL. Pindahkan test fixture ke TEST_DATABASE_URL.

**Changed Files:**
- `backend/app/dashboard/stats.py`
- `backend/app/dashboard/charts.py`
- `backend/app/transaksi/list_transaksi.py`
- `backend/app/pengeluaran/crud.py`
- `backend/app/activity_log/list_log.py`
- `backend/app/laporan/ringkasan_transaksi_produk.py`
- `backend/app/ml/prediksi_stok.py`
- `backend/app/ml/prediksi_demand.py`
- `backend/app/ml/prediksi_omzet.py`
- `backend/app/ml/promo_recommendation.py`
- `backend/app/ml/bonus_kasir.py`
- `tests/backend/app/inventory/test_fifo.py`
- `tests/backend/app/kasir/test_checkout_service.py`
- `tests/backend/app/transaksi/test_retur_stok.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** pytest tests/backend -q (membutuhkan real PG)

**Breaking Change:** Yes

**Regression Risk:** Medium

**Related Patch:** -

**Status:** Merged

**Notes:**
-

---

## PATCH-2026-07-31-067

**Tanggal:** 2026-07-31
**Timestamp:** 09:11
**Git Branch:** main
**Git Commit:** 746037e
**Type:** Fix
**Area:** Backend
**Priority:** High
**Title:** Sertakan kolom qty_masuk pada insert produk_batch

**Reason:** Mencegah error null value in column qty_masuk of relation produk_batch

**Root Cause:**
Kolom qty_masuk yang bersifat NOT NULL tidak disertakan saat INSERT

**Solution:**
Menambahkan kolom qty_masuk (disamakan dengan qty_sisa) pada seluruh statement INSERT produk_batch

**Changed Files:**
- `backend/app/inventory/fifo_service.py`
- `backend/app/inventory/batch_crud.py`
- `backend/app/transaksi/delete_transaksi.py`
- `backend/app/transaksi/edit_item.py`
- `tests/backend/app/inventory/test_fifo.py`
- `tests/backend/app/kasir/test_checkout_service.py`
- `tests/backend/app/transaksi/test_retur_stok.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** pytest tests/backend -q

**Breaking Change:** No

**Regression Risk:** Low

**Related Patch:** -

**Status:** Merged

**Notes:**
-

---

## PATCH-2026-07-31-066

**Tanggal:** 2026-07-31
**Timestamp:** 08:46
**Git Branch:** main
**Git Commit:** 746037e
**Type:** Fix
**Area:** Backend
**Priority:** High
**Title:** Validasi harga jual/diskon checkout vs harga acuan produk

**Reason:** Addendum 29-36 task 1.2

**Root Cause:**
-

**Solution:**
Bandingkan harga_jual client dengan produk.harga_jual di server, tolak diskon/tinta negatif (Temuan 31)

**Changed Files:**
- `backend/app/kasir/checkout_service.py`
- `tests/backend/app/kasir/test_checkout_service.py`
- `docs/PRD.md`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** No

**Regression Risk:** Low

**Related Patch:** -

**Status:** Merged

**Notes:**
-

---

## PATCH-2026-07-31-065

**Tanggal:** 2026-07-31
**Timestamp:** 08:46
**Git Branch:** main
**Git Commit:** 746037e
**Type:** Fix
**Area:** Backend
**Priority:** High
**Title:** Validasi qty>0 pada checkout

**Reason:** Addendum 29-36 task 1.1

**Root Cause:**
-

**Solution:**
Field(gt=0) pada CheckoutItem.qty + guard eksplisit, tutup bypass validasi stok (Temuan 30)

**Changed Files:**
- `backend/app/kasir/checkout_service.py`
- `tests/backend/app/kasir/test_checkout_service.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** No

**Regression Risk:** Low

**Related Patch:** -

**Status:** Merged

**Notes:**
-

---

## PATCH-2026-07-31-064

**Tanggal:** 2026-07-31
**Timestamp:** 01:29
**Git Branch:** master
**Git Commit:** bca3668
**Type:** Docs
**Area:** Docs
**Priority:** High
**Title:** Konsolidasi dokumentasi ke SSOT (PATCHLOG, STATUS, AI_CONTEXT, tests/)

**Reason:** Dokumentasi tersebar di banyak file (patchlog1/2.md, status1/2.md, docs/STATUS.md salah proyek), tidak ada SSOT, sulit diautomasi

**Root Cause:**
Dokumentasi ditambah ad-hoc per rencana kerja (migrasi awal, addendum) tanpa konsolidasi; automation/patchlog.py mewarisi path & AREA_PREFIX_MAP dari proyek lain

**Solution:**
Gabungkan seluruh patchlog/status lama (v1) ke PATCHLOG.md/STATUS.md v2 di root; refactor automation/patchlog.py + tambah automation/status.py jadi config-driven (docops.config.json); pindahkan seluruh test ke tests/ mirip struktur source; revisi workflow docs/rfc/bug_fix ke CLI baru, deprecate finish_task.py; tambah AI_CONTEXT.md sebagai entry point AI

**Changed Files:**
- `PATCHLOG.md`
- `STATUS.md`
- `AI_CONTEXT.md`
- `automation/patchlog.py`
- `automation/status.py`
- `automation/docops_config.py`
- `automation/docops.config.json`
- `tests/backend/test_health.py`
- `tests/backend/app/inventory/test_fifo.py`
- `tests/backend/app/kasir/test_checkout_service.py`
- `tests/backend/app/transaksi/test_retur_stok.py`
- `frontend/vitest.config.ts`
- `.github/workflows/ci.yml`
- `docs/rfc/bug_fix [ progress ]/00_index.yaml`

**Changed Symbols:**
- (tidak ada)

**Tests:** python automation/patchlog.py verify; python automation/status.py verify (statis, pytest/vitest tidak bisa dijalankan di sandbox tanpa akses jaringan/paket)

**Breaking Change:** Yes

**Regression Risk:** Medium

**Related Patch:** -

**Status:** Merged

**Notes:**
File lama dihapus: docs/patchlog1.md, docs/patchlog2.md, docs/status1.md, docs/status2.md, docs/STATUS.md. CI diupdate untuk path tests/backend baru.

---

<!-- ENTRY BARU DITAMBAHKAN DI SINI (tepat di bawah baris ini, di ATAS entri lama) -->

## PATCH-2026-07-30-063

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** CI jalankan seluruh test backend

**Reason:** Task 0.2 — implementasi_plan/addendum_29-36 (bug fix)

**Root Cause:**
-

**Solution:**
testpaths mencakup backend/app/*/tests, bukan cuma backend/tests (fix Temuan 29)

**Changed Files:**
- `.github/workflows/ci.yml`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Verifikasi statis (tidak ada testpaths override) - eksekusi pytest tidak bisa dijalankan di sandbox ini (tanpa akses jaringan utk pip install). Perlu dikonfirmasi lulus di CI run sungguhan. | Bundle arsip (riwayat lama): implementasi_plan/addendum_29-36/bundles/ksp-0.2.zip | Migrasi dari implementasi_plan/addendum_29-36 (bug fix), ID lama PATCH-0002 (Task 0.2).

---

## PATCH-2026-07-30-062

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Setup rencana addendum 29-36

**Reason:** Task 0.1 — implementasi_plan/addendum_29-36 (bug fix)

**Root Cause:**
-

**Solution:**
Buat struktur folder, index, 5 file sesi, status.md, patchlog.md, script bundling ksp-*.zip, README.md

**Changed Files:**
- `implementasi_plan/addendum_29-36/00_index.yaml`
- `implementasi_plan/addendum_29-36/01_sesi-0-persiapan-ci.yaml`
- `implementasi_plan/addendum_29-36/02_sesi-1-integritas-checkout.yaml`
- `implementasi_plan/addendum_29-36/03_sesi-2-konsistensi-formula.yaml`
- `implementasi_plan/addendum_29-36/04_sesi-3-konfigurasi-deployment.yaml`
- `implementasi_plan/addendum_29-36/05_sesi-4-timezone-regresi-akhir.yaml`
- `implementasi_plan/addendum_29-36/README.md`
- `implementasi_plan/addendum_29-36/scripts/finish_task.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/addendum_29-36/bundles/ksp-0.1.zip | Migrasi dari implementasi_plan/addendum_29-36 (bug fix), ID lama PATCH-0001 (Task 0.1).

---

## PATCH-2026-07-30-061

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Halaman Backup frontend + keputusan scope kalkulator.py

**Reason:** Task 9.7 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
UI backup lengkap + finalisasi open question kalkulator.py

**Changed Files:**
- `frontend/src/pages/backup/BackupPage.tsx`
- `implementasi_plan/decisions/0097-kalkulator-scope.md`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/9.7.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0061 (Task 9.7).

---

## PATCH-2026-07-30-060

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Restore dengan safety backup wajib

**Reason:** Task 9.6 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Restore dibatalkan jika safety backup gagal, hapus backup dengan konfirmasi

**Changed Files:**
- `backend/app/backup/restore_delete.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/9.6.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0060 (Task 9.6).

---

## PATCH-2026-07-30-059

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Backup: buat, list, download

**Reason:** Task 9.5 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Dump DB terkompresi + link download langsung, tercatat di log

**Changed Files:**
- `backend/app/backup/create_list_download.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/9.5.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0059 (Task 9.5).

---

## PATCH-2026-07-30-058

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Halaman Activity Log frontend

**Reason:** Task 9.4 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Filter + stat card + detail JSON pretty-print + hapus log lama

**Changed Files:**
- `frontend/src/pages/activity-log/ActivityLogPage.tsx`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/9.4.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0058 (Task 9.4).

---

## PATCH-2026-07-30-057

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Activity log otomatis di layer service

**Reason:** Task 9.3 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Before/after JSON, best-effort tanpa menggagalkan operasi utama

**Changed Files:**
- `backend/app/activity_log/logger.py`
- `backend/app/activity_log/list_log.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/9.3.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0057 (Task 9.3).

---

## PATCH-2026-07-30-056

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Hapus user: soft/hard delete sesuai riwayat

**Reason:** Task 9.2 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Guard integritas histori transaksi + audit log jelas

**Changed Files:**
- `backend/app/users/delete.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/9.2.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0056 (Task 9.2).

---

## PATCH-2026-07-30-055

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** CRUD user + proteksi diri sendiri

**Reason:** Task 9.1 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Password rules add/edit, proteksi self-delete/deactivate di API

**Changed Files:**
- `backend/app/users/crud.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/9.1.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0055 (Task 9.1).

---

## PATCH-2026-07-30-054

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Halaman Intelligence/ML frontend

**Reason:** Task 8.6 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
5 tab admin-only + evaluasi model persisten

**Changed Files:**
- `frontend/src/pages/ml/MlPage.tsx`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/8.6.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0054 (Task 8.6).

---

## PATCH-2026-07-30-053

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Rekomendasi promo/bonus & Apriori bundling

**Reason:** Task 8.5 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Bonus/upsell + tampilkan penuh hasil Apriori bundling di UI

**Changed Files:**
- `backend/app/ml/promo_recommendation.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/8.5.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0053 (Task 8.5).

---

## PATCH-2026-07-30-052

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Prediksi demand & bonus kasir

**Reason:** Task 8.4 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Top-N produk + skor kasir + tier bonus sesuai keputusan task 1.4

**Changed Files:**
- `backend/app/ml/prediksi_demand.py`
- `backend/app/ml/bonus_kasir.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/8.4.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0052 (Task 8.4).

---

## PATCH-2026-07-30-051

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Prediksi omzet HoltES/RandomForest

**Reason:** Task 8.3 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Pemilihan model otomatis via RMSE, fallback tanpa sklearn

**Changed Files:**
- `backend/app/ml/prediksi_omzet.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/8.3.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0051 (Task 8.3).

---

## PATCH-2026-07-30-050

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Prediksi stok moving average

**Reason:** Task 8.2 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Confidence score, status kategori, reorder_qty

**Changed Files:**
- `backend/app/ml/prediksi_stok.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/8.2.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0050 (Task 8.2).

---

## PATCH-2026-07-30-049

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Infrastruktur job async & cache ML

**Reason:** Task 8.1 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Job queue + cache hasil model, hindari retrain tiap request

**Changed Files:**
- `backend/app/ml/job_infra.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/8.1.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0049 (Task 8.1).

---

## PATCH-2026-07-30-048

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Halaman Laporan frontend 6 tab

**Reason:** Task 7.7 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Filter global + orkestrasi reload semua tab + tombol ekspor

**Changed Files:**
- `frontend/src/pages/LaporanPage.tsx`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/7.7.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0048 (Task 7.7).

---

## PATCH-2026-07-30-047

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Ekspor laporan xlsx dark-theme

**Reason:** Task 7.6 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Styling manual mereplikasi tema gelap aplikasi ke file Excel

**Changed Files:**
- `backend/app/laporan/export_xlsx.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/7.6.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0047 (Task 7.6).

---

## PATCH-2026-07-30-046

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Endpoint laporan pelanggan/stok/pengeluaran

**Reason:** Task 7.5 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Top spender, snapshot stok real-time, breakdown pengeluaran

**Changed Files:**
- `backend/app/laporan/pelanggan_stok_pengeluaran.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/7.5.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0046 (Task 7.5).

---

## PATCH-2026-07-30-045

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Endpoint laporan ringkasan/transaksi/produk

**Reason:** Task 7.4 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Filter bulan & rentang tanggal, ringkasan naratif otomatis

**Changed Files:**
- `backend/app/laporan/ringkasan_transaksi_produk.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/7.4.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0045 (Task 7.4).

---

## PATCH-2026-07-30-044

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Halaman Dashboard frontend

**Reason:** Task 7.3 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Chart.js/Recharts untuk semua visual dashboard + auto-refresh 60 detik

**Changed Files:**
- `frontend/src/pages/DashboardPage.tsx`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/7.3.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0044 (Task 7.3).

---

## PATCH-2026-07-30-043

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Endpoint chart dashboard

**Reason:** Task 7.2 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Data chart bulanan/pie/7-hari dengan warna semantik dipertahankan

**Changed Files:**
- `backend/app/dashboard/charts.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/7.2.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0043 (Task 7.2).

---

## PATCH-2026-07-30-042

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Endpoint dashboard stat & growth card

**Reason:** Task 7.1 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Perhitungan omzet/laba + growth vs bulan lalu, null jika prev=0

**Changed Files:**
- `backend/app/dashboard/stats.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/7.1.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0042 (Task 7.1).

---

## PATCH-2026-07-30-041

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Halaman Pengeluaran frontend

**Reason:** Task 6.5 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Filter bulan/kategori + stat card + search

**Changed Files:**
- `frontend/src/pages/PengeluaranPage.tsx`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/6.5.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0041 (Task 6.5).

---

## PATCH-2026-07-30-040

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** CRUD pengeluaran kategori tunggal

**Reason:** Task 6.4 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Validasi kategori & jumlah > 0 konsisten di API dan DB

**Changed Files:**
- `backend/app/pengeluaran/crud.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/6.4.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0040 (Task 6.4).

---

## PATCH-2026-07-30-039

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Halaman Pelanggan + dialog detail riwayat

**Reason:** Task 6.3 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
List pelanggan + reuse komponen detail transaksi

**Changed Files:**
- `frontend/src/pages/PelangganPage.tsx`
- `frontend/src/components/pelanggan/DetailPelangganDialog.tsx`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/6.3.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0039 (Task 6.3).

---

## PATCH-2026-07-30-038

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Hapus pelanggan diblokir jika ada riwayat

**Reason:** Task 6.2 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Guard hapus pelanggan konsisten tanpa jalur bypass

**Changed Files:**
- `backend/app/pelanggan/delete.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/6.2.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0038 (Task 6.2).

---

## PATCH-2026-07-30-037

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** CRUD pelanggan

**Reason:** Task 6.1 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Validasi nama wajib + no HP unik

**Changed Files:**
- `backend/app/pelanggan/crud.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/6.1.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0037 (Task 6.1).

---

## PATCH-2026-07-30-036

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Test end-to-end retur stok

**Reason:** Task 5.6 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Test hapus/edit transaksi -> retur stok & recalculate akurat

**Changed Files:**
- `backend/app/transaksi/tests/test_retur_stok.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/5.6.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0036 (Task 5.6).

---

## PATCH-2026-07-30-035

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Halaman Transaksi + dialog detail/edit

**Reason:** Task 5.5 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
List, filter, dan dialog detail/edit item dengan konfirmasi retur stok

**Changed Files:**
- `frontend/src/pages/TransaksiPage.tsx`
- `frontend/src/components/transaksi/DetailTransaksiDialog.tsx`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/5.5.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0035 (Task 5.5).

---

## PATCH-2026-07-30-034

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Ganti pelanggan pada transaksi

**Reason:** Task 5.4 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Update pelanggan_id + keputusan snapshot nama pelanggan

**Changed Files:**
- `backend/app/transaksi/ganti_pelanggan.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/5.4.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0034 (Task 5.4).

---

## PATCH-2026-07-30-033

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Edit item transaksi + recalculate

**Reason:** Task 5.3 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Handle qty naik/turun dengan FIFO/retur, recalculate total & profit header

**Changed Files:**
- `backend/app/transaksi/edit_item.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/5.3.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0033 (Task 5.3).

---

## PATCH-2026-07-30-032

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Hapus transaksi + retur stok otomatis

**Reason:** Task 5.2 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Batch retur baru dengan HPP dari detail asal, atomic dengan hapus header

**Changed Files:**
- `backend/app/transaksi/delete_transaksi.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/5.2.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0032 (Task 5.2).

---

## PATCH-2026-07-30-031

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Endpoint list & filter riwayat transaksi

**Reason:** Task 5.1 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Filter bulan/pelanggan/search + stat card sesuai semantik lama

**Changed Files:**
- `backend/app/transaksi/list_transaksi.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/5.1.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0031 (Task 5.1).

---

## PATCH-2026-07-30-030

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Test FIFO & inventory end-to-end

**Reason:** Task 4.8 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Test akurasi FIFO, tambah stok selalu batch baru, lintas 3 batch

**Changed Files:**
- `backend/app/inventory/tests/test_fifo.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/4.8.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0030 (Task 4.8).

---

## PATCH-2026-07-30-029

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Dialog & endpoint batch stok per produk

**Reason:** Task 4.7 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Riwayat batch, tambah/hapus batch dengan audit trail

**Changed Files:**
- `frontend/src/components/inventory/BatchProdukDialog.tsx`
- `backend/app/inventory/batch_crud.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/4.7.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0029 (Task 4.7).

---

## PATCH-2026-07-30-028

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Halaman Inventory frontend

**Reason:** Task 4.6 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Filter/sort/search + stat card independen dari filter tampilan

**Changed Files:**
- `frontend/src/pages/InventoryPage.tsx`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/4.6.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0028 (Task 4.6).

---

## PATCH-2026-07-30-027

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Import Excel produk massal

**Reason:** Task 4.5 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Parsing sheet produk + validasi + ringkasan berhasil/dilewati/error

**Changed Files:**
- `backend/app/inventory/import_excel.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/4.5.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0027 (Task 4.5).

---

## PATCH-2026-07-30-026

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Stock adjustment tambah/kurangi

**Reason:** Task 4.4 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Validasi alasan wajib + stok tidak boleh negatif

**Changed Files:**
- `backend/app/inventory/stock_adjustment.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/4.4.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0026 (Task 4.4).

---

## PATCH-2026-07-30-025

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Keputusan & implementasi hapus produk

**Reason:** Task 4.3 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Konsistensi guard hapus produk vs pelanggan, didokumentasikan

**Changed Files:**
- `backend/app/inventory/delete_produk.py`
- `implementasi_plan/decisions/0043-hapus-produk.md`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/4.3.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0025 (Task 4.3).

---

## PATCH-2026-07-30-024

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** CRUD produk dengan validasi

**Reason:** Task 4.2 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Kode UPPERCASE unik, validasi harga jual >= harga beli

**Changed Files:**
- `backend/app/inventory/produk_crud.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/4.2.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0024 (Task 4.2).

---

## PATCH-2026-07-30-023

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Service FIFO keluar_fifo & tambah_stok

**Reason:** Task 4.1 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Implementasi FIFO presisi + auto-hapus batch habis + selalu batch baru saat tambah

**Changed Files:**
- `backend/app/inventory/fifo_service.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/4.1.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0023 (Task 4.1).

---

## PATCH-2026-07-30-022

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Test end-to-end modul kasir

**Reason:** Task 3.8 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Test checkout atomic: stok cukup/tidak cukup, bonus, diskon, FIFO lintas batch

**Changed Files:**
- `backend/app/kasir/tests/test_checkout_service.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/3.8.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0022 (Task 3.8).

---

## PATCH-2026-07-30-021

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Struk transaksi: cetak + copy WA

**Reason:** Task 3.7 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Render struk monospace, window.print + copy clipboard format WA

**Changed Files:**
- `frontend/src/components/kasir/StrukDialog.tsx`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/3.7.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0021 (Task 3.7).

---

## PATCH-2026-07-30-020

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Dialog pembayaran

**Reason:** Task 3.6 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Kalkulasi kembalian real-time + tombol nominal cepat

**Changed Files:**
- `frontend/src/components/kasir/PembayaranDialog.tsx`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/3.6.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0020 (Task 3.6).

---

## PATCH-2026-07-30-019

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Halaman kasir utama

**Reason:** Task 3.5 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Layout produk + keranjang + pilih pelanggan, styling khusus baris bonus

**Changed Files:**
- `frontend/src/pages/KasirPage.tsx`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/3.5.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0019 (Task 3.5).

---

## PATCH-2026-07-30-018

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Dialog tambah ke keranjang

**Reason:** Task 3.4 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Form harga/diskon/tinta/bonus + live preview + auto-merge non-bonus

**Changed Files:**
- `frontend/src/components/kasir/AddToCartDialog.tsx`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/3.4.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0018 (Task 3.4).

---

## PATCH-2026-07-30-017

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Endpoint checkout + fix kode transaksi di response

**Reason:** Task 3.3 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Response sukses pakai kode TRX asli, bukan ID numerik (fix bug PRD 15.13)

**Changed Files:**
- `backend/app/kasir/checkout_endpoint.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/3.3.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0017 (Task 3.3).

---

## PATCH-2026-07-30-016

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Service checkout atomic

**Reason:** Task 3.2 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Gabungkan validasi fail-fast + semantik bonus tetap potong stok, dalam 1 DB transaction

**Changed Files:**
- `backend/app/kasir/checkout_service.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/3.2.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0016 (Task 3.2).

---

## PATCH-2026-07-30-015

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Endpoint daftar produk kasir

**Reason:** Task 3.1 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Search produk untuk kasir, sembunyikan stok<=0

**Changed Files:**
- `backend/app/kasir/list_produk.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/3.1.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0015 (Task 3.1).

---

## PATCH-2026-07-30-014

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Halaman login frontend

**Reason:** Task 2.5 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
UI login dark-theme sesuai token PRD §17, tampilkan sisa percobaan/lockout

**Changed Files:**
- `frontend/src/pages/login.tsx`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/2.5.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0014 (Task 2.5).

---

## PATCH-2026-07-30-013

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Middleware otorisasi per-role di setiap endpoint

**Reason:** Task 2.4 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Validasi role di server untuk semua endpoint, single source access matrix

**Changed Files:**
- `backend/app/auth/access_matrix.py`
- `backend/app/auth/require_role.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/2.4.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0013 (Task 2.4).

---

## PATCH-2026-07-30-012

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Session/JWT + idle timeout 60 menit

**Reason:** Task 2.3 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Idle timeout dikonfigurasi via env SESSION_TIMEOUT

**Changed Files:**
- `backend/app/auth/session.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/2.3.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0012 (Task 2.3).

---

## PATCH-2026-07-30-011

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Lockout 5x gagal / 5 menit

**Reason:** Task 2.2 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Counter percobaan gagal per user + auto-lockout 300 detik

**Changed Files:**
- `backend/app/auth/lockout.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/2.2.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0011 (Task 2.2).

---

## PATCH-2026-07-30-010

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Endpoint login + password hashing

**Reason:** Task 2.1 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
POST /auth/login dengan hashing setara PBKDF2 310k, update last_login

**Changed Files:**
- `backend/app/auth/login.py`
- `backend/app/auth/security.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/2.1.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0010 (Task 2.1).

---

## PATCH-2026-07-30-009

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Script migrasi data lama SQLite -> RDBMS baru

**Reason:** Task 1.5 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
One-off migration script + dry-run mode + validasi jumlah baris

**Changed Files:**
- `scripts/migrate_legacy_sqlite.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/1.5.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0009 (Task 1.5).

---

## PATCH-2026-07-30-008

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Keputusan & migrasi bonus_kasir/transaksi_bonus

**Reason:** Task 1.4 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Finalisasi apakah bonus_kasir diimplementasikan penuh atau dihapus dari skema

**Changed Files:**
- `migrations/0004_bonus_kasir_decision.sql`
- `implementasi_plan/decisions/0004-bonus-kasir.md`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/1.4.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0008 (Task 1.4).

---

## PATCH-2026-07-30-007

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Migrasi tabel pengeluaran, users, activity_log

**Reason:** Task 1.3 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Kategori pengeluaran disatukan + CHECK constraint, skema users & audit trail

**Changed Files:**
- `migrations/0003_pengeluaran_users_log.sql`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/1.3.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0007 (Task 1.3).

---

## PATCH-2026-07-30-006

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Migrasi tabel transaksi & transaksi_detail

**Reason:** Task 1.2 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Tambah kolom is_bonus eksplisit, satukan kolom timestamp

**Changed Files:**
- `migrations/0002_transaksi.sql`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/1.2.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0006 (Task 1.2).

---

## PATCH-2026-07-30-005

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Migrasi tabel produk, produk_batch, pelanggan

**Reason:** Task 1.1 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Skema inti inventory + FIFO batch + pelanggan, keputusan dead columns didokumentasikan

**Changed Files:**
- `migrations/0001_produk_batch_pelanggan.sql`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/1.1.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0005 (Task 1.1).

---

## PATCH-2026-07-30-004

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Setup environment lokal (docker-compose) & seed data dummy

**Reason:** Task 0.4 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
docker-compose.yml (postgres+redis+backend+frontend) + Dockerfile masing-masing + seed.py bootstrap 3 user role & 3 produk contoh. Syntax & import tervalidasi; 'docker compose up' & eksekusi DB nyata BELUM diverifikasi di sandbox ini (tidak ada docker daemon & instalasi postgres via apt gagal karena mirror 404) -- wajib dites manual di mesin dev sebelum dianggap 'done' penuh.

**Changed Files:**
- `docker-compose.yml`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `backend/scripts/seed.py`
- `backend/requirements.txt`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Perlu verifikasi manual: docker compose up --build lalu python backend/scripts/seed.py, di lingkungan yang punya Docker. | Bundle arsip (riwayat lama): implementasi_plan/bundles/0.4.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0004 (Task 0.4).

---

## PATCH-2026-07-30-003

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Scaffold repo baru & CI dasar

**Reason:** Task 0.3 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Scaffold backend FastAPI (health endpoint + pytest lulus + ruff bersih) dan frontend React+TS+Vite (tsc build lulus); CI workflow lint+test kedua sisi.

**Changed Files:**
- `backend/app/main.py`
- `backend/app/__init__.py`
- `backend/__init__.py`
- `backend/tests/test_health.py`
- `backend/tests/__init__.py`
- `backend/requirements.txt`
- `frontend/package.json`
- `frontend/index.html`
- `frontend/src/App.tsx`
- `frontend/src/main.tsx`
- `frontend/tsconfig.json`
- `.github/workflows/ci.yml`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/0.3.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0003 (Task 0.3).

---

## PATCH-2026-07-30-002

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Keputusan tech stack migrasi

**Reason:** Task 0.2 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
ADR: FastAPI+SQLAlchemy+Alembic, React+TS+Vite, PostgreSQL, Recharts, JWT, RQ+Redis

**Changed Files:**
- `implementasi_plan/decisions/0002-tech-stack.md`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/0.2.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0002 (Task 0.2).

---

## PATCH-2026-07-30-001

**Tanggal:** 2026-07-30
**Timestamp:** -
**Git Branch:** -
**Git Commit:** -
**Type:** Unclassified
**Area:** Unclassified
**Priority:** Unclassified
**Title:** Setup folder implementasi_plan, status.md, patchlog.md

**Reason:** Task 0.1 — implementasi_plan (migrasi awal)

**Root Cause:**
-

**Solution:**
Inisialisasi status.md dan patchlog.md dari template, verifikasi finish_subtask.py berjalan

**Changed Files:**
- `implementasi_plan/status.md`
- `implementasi_plan/patchlog.md`
- `implementasi_plan/scripts/finish_subtask.py`

**Changed Symbols:**
- (tidak ada)

**Tests:** -

**Breaking Change:** Unclassified

**Regression Risk:** Unclassified

**Related Patch:** -

**Status:** Merged

**Notes:**
Bundle arsip (riwayat lama): implementasi_plan/bundles/0.1.zip | Migrasi dari implementasi_plan (migrasi awal), ID lama PATCH-0001 (Task 0.1).

