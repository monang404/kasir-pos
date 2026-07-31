# AI_CONTEXT.md — Entry Point untuk AI & Developer

> Baca file ini SEBELUM mengerjakan task apa pun di repository ini.

## 1. Tentang Proyek

**kasir-POS** adalah Super App Management Toko (aplikasi kasir/POS) berbasis web,
hasil migrasi dari aplikasi desktop lama (Python + PyQt5 + SQLite) ke arsitektur
web modern. Cakupan: kasir/transaksi (checkout, retur), inventory (produk, stok,
FIFO), pelanggan, pengeluaran, laporan & dashboard, modul Intelligence/ML
(prediksi stok/omzet/demand, rekomendasi promo), user & access control, activity
log, dan backup/restore.

Filosofi pengembangan: **replikasi fungsionalitas lama secara presisi** (lihat
`docs/PRD.md` §15 Known Issues untuk penyimpangan yang disengaja), dengan
perbaikan arsitektur di bawahnya (async FastAPI + SQLAlchemy 2, PostgreSQL,
JWT session, `NUMERIC`/`Decimal` untuk semua nilai uang, `TIMESTAMPTZ` untuk
semua waktu). Detail lengkap keputusan arsitektur ada di `docs/ARSITEKTUR.md`.

## 2. Struktur Folder Utama

```
backend/            FastAPI + SQLAlchemy 2 (async) + Alembic — semua logika bisnis
  app/<modul>/       satu subfolder per modul domain (kasir, inventory, transaksi,
                     pelanggan, pengeluaran, laporan, dashboard, ml, auth, users,
                     activity_log, backup)
  scripts/           script one-off (seed data, dll)
frontend/            React + TypeScript + Vite
  src/pages/         satu halaman per modul (mirror ke backend/app/<modul>)
  src/components/    komponen UI yang dipakai lintas halaman
migrations/          SQL migrasi skema database (urut, jangan diedit setelah merge)
scripts/             script level-repo (mis. migrasi data lama SQLite -> RDBMS baru)
automation/          CLI resmi untuk menjaga PATCHLOG.md & STATUS.md tetap konsisten
docs/                dokumentasi pendukung (PRD, arsitektur, RFC rencana kerja)
tests/               SELURUH test (backend & frontend), mirror struktur source code
  backend/           mirror dari backend/ (mis. backend/app/inventory/ ->
                     tests/backend/app/inventory/)
  frontend/          mirror dari frontend/src/ (belum ada test saat ini)
PATCHLOG.md          Source of Truth log perubahan (root)
STATUS.md            Source of Truth status implementasi (root)
```

## 3. Arsitektur Ringkas

- **Backend:** FastAPI, SQLAlchemy 2.0 Async ORM, Alembic, PostgreSQL/asyncpg.
  Uang selalu `NUMERIC(15,2)`/`Decimal` (tidak pernah `float`). Waktu selalu
  `TIMESTAMPTZ`. Sesi pakai JWT + idle timeout (menggantikan in-memory
  singleton lama). Checkout wajib `idempotency_key` (anti double-submit).
- **Frontend:** React + TypeScript + Vite, Recharts untuk chart, React Router.
- **Database:** PostgreSQL, skema di `migrations/*.sql`, urut & immutable
  setelah merge — perubahan skema = migrasi baru, bukan edit file lama.
- **Testing:** pytest (backend, di `tests/backend/`, jalankan dengan
  `PYTHONPATH=backend pytest tests/backend -q`) dan Vitest (frontend, di
  `tests/frontend/`, jalankan dari `frontend/` dengan `npx vitest run` —
  lihat `frontend/vitest.config.ts` untuk lokasi `include`).

Detail lengkap: `docs/ARSITEKTUR.md` (keputusan desain & tech stack) dan
`docs/PRD.md` (spesifikasi fungsional lengkap per modul + Known Issues).

## 4. Source of Truth

Referensi utama proyek ini, urut prioritas:

1. **`AI_CONTEXT.md`** (file ini) — orientasi awal.
2. **`STATUS.md`** — sudah sampai mana progres implementasi (per task/subtask).
3. **`PATCHLOG.md`** — riwayat perubahan lengkap (apa yang berubah, kenapa, file
   mana saja).
4. **`docs/`** — spesifikasi fungsional (`PRD.md`), arsitektur (`ARSITEKTUR.md`),
   dan rencana kerja RFC (`docs/rfc/`, satu subfolder per rencana kerja;
   `migrasi_build [done]` sudah selesai semua, `bug_fix [ progress ]` sedang
   berjalan untuk memperbaiki Temuan 1-36).

**Jangan buat file dokumentasi status/patch baru** di lokasi lain — ini akan
memecah Single Source of Truth yang baru saja dikonsolidasikan (lihat entry
migrasi di `PATCHLOG.md`).

## 5. Workflow Wajib per Task

Untuk SETIAP task/subtask (baik dari `docs/rfc/*/`, bug report, atau permintaan
ad-hoc), ikuti urutan ini tanpa kecuali:

1. Baca `AI_CONTEXT.md` (file ini).
2. Baca `STATUS.md` — cek task terkait sudah `done`/`in_progress`/`pending`, dan
   pastikan Task ID + kolom **Rencana** yang dipakai tidak bentrok dengan yang
   sudah ada.
3. Baca `PATCHLOG.md` — cek riwayat perubahan di area/file yang akan disentuh
   (`python automation/patchlog.py history --file <path>` atau
   `python automation/patchlog.py symbol <nama_fungsi>`).
4. Kerjakan task (implementasi kode + update dokumentasi terkait bila ada,
   mis. `docs/PRD.md`).
5. Jalankan testing yang relevan:
   - Backend: `PYTHONPATH=backend pytest tests/backend -q`
   - Frontend: `npx vitest run` (dijalankan dari folder `frontend/`)
6. Update `PATCHLOG.md` lewat CLI (lihat §6).
7. Update `STATUS.md` lewat CLI (lihat §6).
8. Commit — satu commit per task, sebutkan Task ID di pesan commit.

**Jangan gunakan `docs/rfc/bug_fix [ progress ]/scripts/finish_task.py`** —
script itu sudah **deprecated**, dipertahankan hanya sebagai arsip historis.
Seluruh update PATCHLOG/STATUS sekarang lewat `automation/patchlog.py` dan
`automation/status.py`.

## 6. Tools (CLI)

### `automation/patchlog.py` — kelola `PATCHLOG.md`

```bash
python automation/patchlog.py add \
  --type Fix --area Backend --priority High \
  --title "Judul singkat, <=100 karakter" \
  --reason "Kenapa perubahan ini dibuat" \
  --files backend/app/kasir/checkout_service.py,tests/backend/app/kasir/test_checkout_service.py \
  --tests "pytest tests/backend/app/kasir -q" \
  --breaking No --risk Low --status Merged \
  --root-cause "Akar masalah" --solution "Perbaikan yang dilakukan"

python automation/patchlog.py latest --n 5      # 5 entry terbaru
python automation/patchlog.py history --file <path>   # riwayat perubahan 1 file
python automation/patchlog.py symbol <nama_fungsi>    # cari lewat Changed Symbols
python automation/patchlog.py verify            # cek integritas format (WAJIB lulus)
```

`--type`, `--priority`, `--breaking`, `--risk`, `--status` menerima nilai enum
tetap — lihat `--help` masing-masing flag atau docstring di
`automation/patchlog.py` untuk daftar lengkapnya.

### `automation/status.py` — kelola `STATUS.md`

```bash
# Task baru atau update status task yang sudah ada
python automation/status.py set --rencana "Addendum 29-36" --task 1.1 \
  --title "Judul task" --status done --note "Catatan opsional"

python automation/status.py list --rencana "Addendum 29-36"   # lihat semua task 1 rencana
python automation/status.py verify                              # cek duplikat & status invalid
```

### Konfigurasi

Path `PATCHLOG.md`/`STATUS.md` dan pemetaan Area (dari prefix path file) untuk
kedua CLI di atas diambil dari `automation/docops.config.json` — **jangan**
hardcode path/nama proyek langsung di script `.py`. Kalau struktur folder
proyek berubah (mis. modul baru), cukup update `area_prefix_map` di file
config ini.

## 7. Rules

- Jangan membuat dokumentasi status/patch baru kalau sudah ada Source of Truth
  (`PATCHLOG.md`, `STATUS.md`) — tambah entry/baris lewat CLI, jangan buat file
  baru.
- Gunakan CLI resmi (`automation/patchlog.py`, `automation/status.py`) untuk
  memperbarui `PATCHLOG.md`/`STATUS.md` — jangan edit dua file itu secara
  manual kecuali memperbaiki typo.
- Jangan gunakan script manual lama seperti
  `docs/rfc/bug_fix [ progress ]/scripts/finish_task.py` (deprecated).
- Setiap perubahan kode WAJIB menambah entry `PATCHLOG.md` dan meng-update
  baris terkait di `STATUS.md` sebagai bagian dari "task selesai", bukan
  langkah opsional.
- Ikuti struktur folder yang telah ditentukan — khususnya, seluruh test baru
  masuk ke `tests/` (mirror struktur source), BUKAN di sebelah source code-nya.
- Uang selalu `NUMERIC`/`Decimal`, waktu selalu timezone-aware (`TIMESTAMPTZ`)
  — lihat `docs/ARSITEKTUR.md` untuk keputusan desain lengkap sebelum menyentuh
  kode yang berhubungan dengan uang/waktu.
