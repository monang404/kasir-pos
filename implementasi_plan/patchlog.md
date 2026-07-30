---
title: kasir-POS Implementasi Plan — Patch Log
latest_patch_id: PATCH-0048
total_entries: 48
---

# PATCHLOG.md — Log Perubahan per Subtask

> **Format:** Prepend-only (entri terbaru ditambahkan paling ATAS, tepat di bawah baris ini).
> Jangan pernah menghapus atau menimpa entri lama.
> **ID:** `PATCH-NNNN` urut naik (4 digit, tidak reset), jadi heading `## PATCH-NNNN`.
> **Wajib diisi setiap kali sebuah subtask (task.subtask, mis. 0.1, 1.2, dst.) selesai dikerjakan.**

<!-- ENTRY BARU DITAMBAHKAN DI SINI (tepat di bawah baris ini, di ATAS entri lama) -->

## PATCH-0048
**Task ID:** 7.7
**Tanggal:** 2026-07-30
**Judul:** Halaman Laporan frontend 6 tab
**Deskripsi:** Filter global + orkestrasi reload semua tab + tombol ekspor
**File Berubah:**
- frontend/src/pages/LaporanPage.tsx
**Bundle Zip:** implementasi_plan/bundles/7.7.zip
**Status:** done
**Catatan:** -


## PATCH-0047
**Task ID:** 7.6
**Tanggal:** 2026-07-30
**Judul:** Ekspor laporan xlsx dark-theme
**Deskripsi:** Styling manual mereplikasi tema gelap aplikasi ke file Excel
**File Berubah:**
- backend/app/laporan/export_xlsx.py
**Bundle Zip:** implementasi_plan/bundles/7.6.zip
**Status:** done
**Catatan:** -


## PATCH-0046
**Task ID:** 7.5
**Tanggal:** 2026-07-30
**Judul:** Endpoint laporan pelanggan/stok/pengeluaran
**Deskripsi:** Top spender, snapshot stok real-time, breakdown pengeluaran
**File Berubah:**
- backend/app/laporan/pelanggan_stok_pengeluaran.py
**Bundle Zip:** implementasi_plan/bundles/7.5.zip
**Status:** done
**Catatan:** -


## PATCH-0045
**Task ID:** 7.4
**Tanggal:** 2026-07-30
**Judul:** Endpoint laporan ringkasan/transaksi/produk
**Deskripsi:** Filter bulan & rentang tanggal, ringkasan naratif otomatis
**File Berubah:**
- backend/app/laporan/ringkasan_transaksi_produk.py
**Bundle Zip:** implementasi_plan/bundles/7.4.zip
**Status:** done
**Catatan:** -


## PATCH-0044
**Task ID:** 7.3
**Tanggal:** 2026-07-30
**Judul:** Halaman Dashboard frontend
**Deskripsi:** Chart.js/Recharts untuk semua visual dashboard + auto-refresh 60 detik
**File Berubah:**
- frontend/src/pages/DashboardPage.tsx
**Bundle Zip:** implementasi_plan/bundles/7.3.zip
**Status:** done
**Catatan:** -


## PATCH-0043
**Task ID:** 7.2
**Tanggal:** 2026-07-30
**Judul:** Endpoint chart dashboard
**Deskripsi:** Data chart bulanan/pie/7-hari dengan warna semantik dipertahankan
**File Berubah:**
- backend/app/dashboard/charts.py
**Bundle Zip:** implementasi_plan/bundles/7.2.zip
**Status:** done
**Catatan:** -


## PATCH-0042
**Task ID:** 7.1
**Tanggal:** 2026-07-30
**Judul:** Endpoint dashboard stat & growth card
**Deskripsi:** Perhitungan omzet/laba + growth vs bulan lalu, null jika prev=0
**File Berubah:**
- backend/app/dashboard/stats.py
**Bundle Zip:** implementasi_plan/bundles/7.1.zip
**Status:** done
**Catatan:** -


## PATCH-0041
**Task ID:** 6.5
**Tanggal:** 2026-07-30
**Judul:** Halaman Pengeluaran frontend
**Deskripsi:** Filter bulan/kategori + stat card + search
**File Berubah:**
- frontend/src/pages/PengeluaranPage.tsx
**Bundle Zip:** implementasi_plan/bundles/6.5.zip
**Status:** done
**Catatan:** -


## PATCH-0040
**Task ID:** 6.4
**Tanggal:** 2026-07-30
**Judul:** CRUD pengeluaran kategori tunggal
**Deskripsi:** Validasi kategori & jumlah > 0 konsisten di API dan DB
**File Berubah:**
- backend/app/pengeluaran/crud.py
**Bundle Zip:** implementasi_plan/bundles/6.4.zip
**Status:** done
**Catatan:** -


## PATCH-0039
**Task ID:** 6.3
**Tanggal:** 2026-07-30
**Judul:** Halaman Pelanggan + dialog detail riwayat
**Deskripsi:** List pelanggan + reuse komponen detail transaksi
**File Berubah:**
- frontend/src/pages/PelangganPage.tsx
- frontend/src/components/pelanggan/DetailPelangganDialog.tsx
**Bundle Zip:** implementasi_plan/bundles/6.3.zip
**Status:** done
**Catatan:** -


## PATCH-0038
**Task ID:** 6.2
**Tanggal:** 2026-07-30
**Judul:** Hapus pelanggan diblokir jika ada riwayat
**Deskripsi:** Guard hapus pelanggan konsisten tanpa jalur bypass
**File Berubah:**
- backend/app/pelanggan/delete.py
**Bundle Zip:** implementasi_plan/bundles/6.2.zip
**Status:** done
**Catatan:** -


## PATCH-0037
**Task ID:** 6.1
**Tanggal:** 2026-07-30
**Judul:** CRUD pelanggan
**Deskripsi:** Validasi nama wajib + no HP unik
**File Berubah:**
- backend/app/pelanggan/crud.py
**Bundle Zip:** implementasi_plan/bundles/6.1.zip
**Status:** done
**Catatan:** -


## PATCH-0036
**Task ID:** 5.6
**Tanggal:** 2026-07-30
**Judul:** Test end-to-end retur stok
**Deskripsi:** Test hapus/edit transaksi -> retur stok & recalculate akurat
**File Berubah:**
- backend/app/transaksi/tests/test_retur_stok.py
**Bundle Zip:** implementasi_plan/bundles/5.6.zip
**Status:** done
**Catatan:** -


## PATCH-0035
**Task ID:** 5.5
**Tanggal:** 2026-07-30
**Judul:** Halaman Transaksi + dialog detail/edit
**Deskripsi:** List, filter, dan dialog detail/edit item dengan konfirmasi retur stok
**File Berubah:**
- frontend/src/pages/TransaksiPage.tsx
- frontend/src/components/transaksi/DetailTransaksiDialog.tsx
**Bundle Zip:** implementasi_plan/bundles/5.5.zip
**Status:** done
**Catatan:** -


## PATCH-0034
**Task ID:** 5.4
**Tanggal:** 2026-07-30
**Judul:** Ganti pelanggan pada transaksi
**Deskripsi:** Update pelanggan_id + keputusan snapshot nama pelanggan
**File Berubah:**
- backend/app/transaksi/ganti_pelanggan.py
**Bundle Zip:** implementasi_plan/bundles/5.4.zip
**Status:** done
**Catatan:** -


## PATCH-0033
**Task ID:** 5.3
**Tanggal:** 2026-07-30
**Judul:** Edit item transaksi + recalculate
**Deskripsi:** Handle qty naik/turun dengan FIFO/retur, recalculate total & profit header
**File Berubah:**
- backend/app/transaksi/edit_item.py
**Bundle Zip:** implementasi_plan/bundles/5.3.zip
**Status:** done
**Catatan:** -


## PATCH-0032
**Task ID:** 5.2
**Tanggal:** 2026-07-30
**Judul:** Hapus transaksi + retur stok otomatis
**Deskripsi:** Batch retur baru dengan HPP dari detail asal, atomic dengan hapus header
**File Berubah:**
- backend/app/transaksi/delete_transaksi.py
**Bundle Zip:** implementasi_plan/bundles/5.2.zip
**Status:** done
**Catatan:** -


## PATCH-0031
**Task ID:** 5.1
**Tanggal:** 2026-07-30
**Judul:** Endpoint list & filter riwayat transaksi
**Deskripsi:** Filter bulan/pelanggan/search + stat card sesuai semantik lama
**File Berubah:**
- backend/app/transaksi/list_transaksi.py
**Bundle Zip:** implementasi_plan/bundles/5.1.zip
**Status:** done
**Catatan:** -


## PATCH-0030
**Task ID:** 4.8
**Tanggal:** 2026-07-30
**Judul:** Test FIFO & inventory end-to-end
**Deskripsi:** Test akurasi FIFO, tambah stok selalu batch baru, lintas 3 batch
**File Berubah:**
- backend/app/inventory/tests/test_fifo.py
**Bundle Zip:** implementasi_plan/bundles/4.8.zip
**Status:** done
**Catatan:** -


## PATCH-0029
**Task ID:** 4.7
**Tanggal:** 2026-07-30
**Judul:** Dialog & endpoint batch stok per produk
**Deskripsi:** Riwayat batch, tambah/hapus batch dengan audit trail
**File Berubah:**
- frontend/src/components/inventory/BatchProdukDialog.tsx
- backend/app/inventory/batch_crud.py
**Bundle Zip:** implementasi_plan/bundles/4.7.zip
**Status:** done
**Catatan:** -


## PATCH-0028
**Task ID:** 4.6
**Tanggal:** 2026-07-30
**Judul:** Halaman Inventory frontend
**Deskripsi:** Filter/sort/search + stat card independen dari filter tampilan
**File Berubah:**
- frontend/src/pages/InventoryPage.tsx
**Bundle Zip:** implementasi_plan/bundles/4.6.zip
**Status:** done
**Catatan:** -


## PATCH-0027
**Task ID:** 4.5
**Tanggal:** 2026-07-30
**Judul:** Import Excel produk massal
**Deskripsi:** Parsing sheet produk + validasi + ringkasan berhasil/dilewati/error
**File Berubah:**
- backend/app/inventory/import_excel.py
**Bundle Zip:** implementasi_plan/bundles/4.5.zip
**Status:** done
**Catatan:** -


## PATCH-0026
**Task ID:** 4.4
**Tanggal:** 2026-07-30
**Judul:** Stock adjustment tambah/kurangi
**Deskripsi:** Validasi alasan wajib + stok tidak boleh negatif
**File Berubah:**
- backend/app/inventory/stock_adjustment.py
**Bundle Zip:** implementasi_plan/bundles/4.4.zip
**Status:** done
**Catatan:** -


## PATCH-0025
**Task ID:** 4.3
**Tanggal:** 2026-07-30
**Judul:** Keputusan & implementasi hapus produk
**Deskripsi:** Konsistensi guard hapus produk vs pelanggan, didokumentasikan
**File Berubah:**
- backend/app/inventory/delete_produk.py
- implementasi_plan/decisions/0043-hapus-produk.md
**Bundle Zip:** implementasi_plan/bundles/4.3.zip
**Status:** done
**Catatan:** -


## PATCH-0024
**Task ID:** 4.2
**Tanggal:** 2026-07-30
**Judul:** CRUD produk dengan validasi
**Deskripsi:** Kode UPPERCASE unik, validasi harga jual >= harga beli
**File Berubah:**
- backend/app/inventory/produk_crud.py
**Bundle Zip:** implementasi_plan/bundles/4.2.zip
**Status:** done
**Catatan:** -


## PATCH-0023
**Task ID:** 4.1
**Tanggal:** 2026-07-30
**Judul:** Service FIFO keluar_fifo & tambah_stok
**Deskripsi:** Implementasi FIFO presisi + auto-hapus batch habis + selalu batch baru saat tambah
**File Berubah:**
- backend/app/inventory/fifo_service.py
**Bundle Zip:** implementasi_plan/bundles/4.1.zip
**Status:** done
**Catatan:** -


## PATCH-0022
**Task ID:** 3.8
**Tanggal:** 2026-07-30
**Judul:** Test end-to-end modul kasir
**Deskripsi:** Test checkout atomic: stok cukup/tidak cukup, bonus, diskon, FIFO lintas batch
**File Berubah:**
- backend/app/kasir/tests/test_checkout_service.py
**Bundle Zip:** implementasi_plan/bundles/3.8.zip
**Status:** done
**Catatan:** -


## PATCH-0021
**Task ID:** 3.7
**Tanggal:** 2026-07-30
**Judul:** Struk transaksi: cetak + copy WA
**Deskripsi:** Render struk monospace, window.print + copy clipboard format WA
**File Berubah:**
- frontend/src/components/kasir/StrukDialog.tsx
**Bundle Zip:** implementasi_plan/bundles/3.7.zip
**Status:** done
**Catatan:** -


## PATCH-0020
**Task ID:** 3.6
**Tanggal:** 2026-07-30
**Judul:** Dialog pembayaran
**Deskripsi:** Kalkulasi kembalian real-time + tombol nominal cepat
**File Berubah:**
- frontend/src/components/kasir/PembayaranDialog.tsx
**Bundle Zip:** implementasi_plan/bundles/3.6.zip
**Status:** done
**Catatan:** -


## PATCH-0019
**Task ID:** 3.5
**Tanggal:** 2026-07-30
**Judul:** Halaman kasir utama
**Deskripsi:** Layout produk + keranjang + pilih pelanggan, styling khusus baris bonus
**File Berubah:**
- frontend/src/pages/KasirPage.tsx
**Bundle Zip:** implementasi_plan/bundles/3.5.zip
**Status:** done
**Catatan:** -


## PATCH-0018
**Task ID:** 3.4
**Tanggal:** 2026-07-30
**Judul:** Dialog tambah ke keranjang
**Deskripsi:** Form harga/diskon/tinta/bonus + live preview + auto-merge non-bonus
**File Berubah:**
- frontend/src/components/kasir/AddToCartDialog.tsx
**Bundle Zip:** implementasi_plan/bundles/3.4.zip
**Status:** done
**Catatan:** -


## PATCH-0017
**Task ID:** 3.3
**Tanggal:** 2026-07-30
**Judul:** Endpoint checkout + fix kode transaksi di response
**Deskripsi:** Response sukses pakai kode TRX asli, bukan ID numerik (fix bug PRD 15.13)
**File Berubah:**
- backend/app/kasir/checkout_endpoint.py
**Bundle Zip:** implementasi_plan/bundles/3.3.zip
**Status:** done
**Catatan:** -


## PATCH-0016
**Task ID:** 3.2
**Tanggal:** 2026-07-30
**Judul:** Service checkout atomic
**Deskripsi:** Gabungkan validasi fail-fast + semantik bonus tetap potong stok, dalam 1 DB transaction
**File Berubah:**
- backend/app/kasir/checkout_service.py
**Bundle Zip:** implementasi_plan/bundles/3.2.zip
**Status:** done
**Catatan:** -


## PATCH-0015
**Task ID:** 3.1
**Tanggal:** 2026-07-30
**Judul:** Endpoint daftar produk kasir
**Deskripsi:** Search produk untuk kasir, sembunyikan stok<=0
**File Berubah:**
- backend/app/kasir/list_produk.py
**Bundle Zip:** implementasi_plan/bundles/3.1.zip
**Status:** done
**Catatan:** -


## PATCH-0014
**Task ID:** 2.5
**Tanggal:** 2026-07-30
**Judul:** Halaman login frontend
**Deskripsi:** UI login dark-theme sesuai token PRD §17, tampilkan sisa percobaan/lockout
**File Berubah:**
- frontend/src/pages/login.tsx
**Bundle Zip:** implementasi_plan/bundles/2.5.zip
**Status:** done
**Catatan:** -


## PATCH-0013
**Task ID:** 2.4
**Tanggal:** 2026-07-30
**Judul:** Middleware otorisasi per-role di setiap endpoint
**Deskripsi:** Validasi role di server untuk semua endpoint, single source access matrix
**File Berubah:**
- backend/app/auth/access_matrix.py
- backend/app/auth/require_role.py
**Bundle Zip:** implementasi_plan/bundles/2.4.zip
**Status:** done
**Catatan:** -


## PATCH-0012
**Task ID:** 2.3
**Tanggal:** 2026-07-30
**Judul:** Session/JWT + idle timeout 60 menit
**Deskripsi:** Idle timeout dikonfigurasi via env SESSION_TIMEOUT
**File Berubah:**
- backend/app/auth/session.py
**Bundle Zip:** implementasi_plan/bundles/2.3.zip
**Status:** done
**Catatan:** -


## PATCH-0011
**Task ID:** 2.2
**Tanggal:** 2026-07-30
**Judul:** Lockout 5x gagal / 5 menit
**Deskripsi:** Counter percobaan gagal per user + auto-lockout 300 detik
**File Berubah:**
- backend/app/auth/lockout.py
**Bundle Zip:** implementasi_plan/bundles/2.2.zip
**Status:** done
**Catatan:** -


## PATCH-0010
**Task ID:** 2.1
**Tanggal:** 2026-07-30
**Judul:** Endpoint login + password hashing
**Deskripsi:** POST /auth/login dengan hashing setara PBKDF2 310k, update last_login
**File Berubah:**
- backend/app/auth/login.py
- backend/app/auth/security.py
**Bundle Zip:** implementasi_plan/bundles/2.1.zip
**Status:** done
**Catatan:** -


## PATCH-0009
**Task ID:** 1.5
**Tanggal:** 2026-07-30
**Judul:** Script migrasi data lama SQLite -> RDBMS baru
**Deskripsi:** One-off migration script + dry-run mode + validasi jumlah baris
**File Berubah:**
- scripts/migrate_legacy_sqlite.py
**Bundle Zip:** implementasi_plan/bundles/1.5.zip
**Status:** done
**Catatan:** -


## PATCH-0008
**Task ID:** 1.4
**Tanggal:** 2026-07-30
**Judul:** Keputusan & migrasi bonus_kasir/transaksi_bonus
**Deskripsi:** Finalisasi apakah bonus_kasir diimplementasikan penuh atau dihapus dari skema
**File Berubah:**
- migrations/0004_bonus_kasir_decision.sql
- implementasi_plan/decisions/0004-bonus-kasir.md
**Bundle Zip:** implementasi_plan/bundles/1.4.zip
**Status:** done
**Catatan:** -


## PATCH-0007
**Task ID:** 1.3
**Tanggal:** 2026-07-30
**Judul:** Migrasi tabel pengeluaran, users, activity_log
**Deskripsi:** Kategori pengeluaran disatukan + CHECK constraint, skema users & audit trail
**File Berubah:**
- migrations/0003_pengeluaran_users_log.sql
**Bundle Zip:** implementasi_plan/bundles/1.3.zip
**Status:** done
**Catatan:** -


## PATCH-0006
**Task ID:** 1.2
**Tanggal:** 2026-07-30
**Judul:** Migrasi tabel transaksi & transaksi_detail
**Deskripsi:** Tambah kolom is_bonus eksplisit, satukan kolom timestamp
**File Berubah:**
- migrations/0002_transaksi.sql
**Bundle Zip:** implementasi_plan/bundles/1.2.zip
**Status:** done
**Catatan:** -


## PATCH-0005
**Task ID:** 1.1
**Tanggal:** 2026-07-30
**Judul:** Migrasi tabel produk, produk_batch, pelanggan
**Deskripsi:** Skema inti inventory + FIFO batch + pelanggan, keputusan dead columns didokumentasikan
**File Berubah:**
- migrations/0001_produk_batch_pelanggan.sql
**Bundle Zip:** implementasi_plan/bundles/1.1.zip
**Status:** done
**Catatan:** -


## PATCH-0004
**Task ID:** 0.4
**Tanggal:** 2026-07-30
**Judul:** Setup environment lokal (docker-compose) & seed data dummy
**Deskripsi:** docker-compose.yml (postgres+redis+backend+frontend) + Dockerfile masing-masing + seed.py bootstrap 3 user role & 3 produk contoh. Syntax & import tervalidasi; 'docker compose up' & eksekusi DB nyata BELUM diverifikasi di sandbox ini (tidak ada docker daemon & instalasi postgres via apt gagal karena mirror 404) -- wajib dites manual di mesin dev sebelum dianggap 'done' penuh.
**File Berubah:**
- docker-compose.yml
- backend/Dockerfile
- frontend/Dockerfile
- backend/scripts/seed.py
- backend/requirements.txt
**Bundle Zip:** implementasi_plan/bundles/0.4.zip
**Status:** done
**Catatan:** Perlu verifikasi manual: docker compose up --build lalu python backend/scripts/seed.py, di lingkungan yang punya Docker.


## PATCH-0003
**Task ID:** 0.3
**Tanggal:** 2026-07-30
**Judul:** Scaffold repo baru & CI dasar
**Deskripsi:** Scaffold backend FastAPI (health endpoint + pytest lulus + ruff bersih) dan frontend React+TS+Vite (tsc build lulus); CI workflow lint+test kedua sisi.
**File Berubah:**
- backend/app/main.py
- backend/app/__init__.py
- backend/__init__.py
- backend/tests/test_health.py
- backend/tests/__init__.py
- backend/requirements.txt
- frontend/package.json
- frontend/index.html
- frontend/src/App.tsx
- frontend/src/main.tsx
- frontend/tsconfig.json
- .github/workflows/ci.yml
**Bundle Zip:** implementasi_plan/bundles/0.3.zip
**Status:** done
**Catatan:** -


## PATCH-0002
**Task ID:** 0.2
**Tanggal:** 2026-07-30
**Judul:** Keputusan tech stack migrasi
**Deskripsi:** ADR: FastAPI+SQLAlchemy+Alembic, React+TS+Vite, PostgreSQL, Recharts, JWT, RQ+Redis
**File Berubah:**
- implementasi_plan/decisions/0002-tech-stack.md
**Bundle Zip:** implementasi_plan/bundles/0.2.zip
**Status:** done
**Catatan:** -


## PATCH-0001
**Task ID:** 0.1
**Tanggal:** 2026-07-30
**Judul:** Setup folder implementasi_plan, status.md, patchlog.md
**Deskripsi:** Inisialisasi status.md dan patchlog.md dari template, verifikasi finish_subtask.py berjalan
**File Berubah:**
- implementasi_plan/status.md
- implementasi_plan/patchlog.md
- implementasi_plan/scripts/finish_subtask.py
**Bundle Zip:** implementasi_plan/bundles/0.1.zip
**Status:** done
**Catatan:** -

