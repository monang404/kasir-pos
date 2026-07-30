# ADR-0002: Tech Stack Migrasi kasir-POS (Desktop PyQt5 -> Web)

**Status:** Diputuskan
**Tanggal:** 2026-07-30
**Terkait:** implementasi_plan/01_task-0-persiapan.yaml (subtask 0.2)

## Konteks

Aplikasi lama (docs/PRD.md §2): Python 3 + PyQt5 (desktop), SQLite (WAL, single-file),
PBKDF2 untuk password, pandas/openpyxl untuk Excel, QPainter untuk semua chart, print
native OS untuk struk. Tidak ada test suite. Tujuan migrasi: web app dengan
fungsionalitas & logika bisnis identik (lihat docs/PRD.md §16 aturan lintas modul),
plus perbaikan arsitektural yang sudah direkomendasikan di §15 & §18 (checkout atomic,
otorisasi di level API, dsb).

## Opsi yang dipertimbangkan

**Backend:**
1. FastAPI (Python) + SQLAlchemy + Alembic
2. NestJS (TypeScript)
3. Django + DRF

**Frontend:**
1. React + TypeScript + Vite
2. Vue 3 + TypeScript

**Database:**
1. PostgreSQL
2. MySQL/MariaDB

**Chart library:**
1. Recharts
2. Chart.js

## Keputusan

| Layer | Pilihan | Alasan |
|---|---|---|
| Backend | **FastAPI + SQLAlchemy + Alembic** | Tim sudah familiar dengan logika bisnis dalam Python (kode lama 100% Python), sehingga porting business rule (FIFO, checkout, ML §14) paling minim risiko salah terjemah. FastAPI native async cocok untuk job ML async (task 8) dan mendukung Pydantic untuk validasi request/response yang ketat — penting untuk konsistensi kontrak data di §3. Alembic menangani migration bertahap seperti pola migrations/ lama. |
| Frontend | **React + TypeScript + Vite** | Ekosistem chart (Recharts) dan component library dark-theme paling matang; TypeScript membantu menjaga kontrak data (banyak field opsional/nullable di skema §3) tetap eksplisit. |
| Database | **PostgreSQL** | Direkomendasikan langsung di docs/PRD.md §2 & §18 poin 1. Mendukung CHECK constraint (dibutuhkan untuk role users §3.7, kategori pengeluaran §15 poin 3/17), JSONB (cocok untuk activity_log.detail before/after §3.10), dan transaksi ACID penuh untuk checkout atomic (§15 poin 15). |
| Chart | **Recharts** | Terintegrasi rapi dengan React + TypeScript, cukup untuk grouped bar, pie, dan mini bar chart di dashboard (§7) dan laporan (§13) tanpa kompleksitas berlebih seperti D3 murni. |
| Auth | **JWT (access + refresh token)** | Menggantikan singleton session lama (§4, §6); idle timeout 60 menit direplikasi via expiry pada refresh token + validasi last-activity di server. |
| Job Queue (ML) | **RQ (Redis Queue)** | Lebih ringan dibanding Celery untuk kebutuhan job async sederhana (retrain/precompute ML §14, §18 poin 8), cukup dengan Redis yang juga dipakai untuk cache hasil model. |

## Konsekuensi

- Tim perlu setup Redis tambahan (untuk job queue + cache ML) di luar Postgres.
- Password hashing lama (PBKDF2 310k iterasi) tetap dipertahankan agar hash existing dari
  `migrate_legacy_sqlite.py` (task 1.5) tidak perlu di-reset paksa; bisa dipertimbangkan
  upgrade ke Argon2 di iterasi berikutnya (di luar scope migrasi awal).
- Print struk (§9) berpindah dari `QPrinter` native ke `window.print()` di browser atau
  generate PDF di server dari HTML struk yang sama — tidak ada lagi ketergantungan ke
  print driver OS.
- Keputusan ini mengikat seluruh task 1-9 di implementasi_plan/; perubahan stack di
  tengah jalan wajib dibuatkan ADR baru yang mereferensikan ADR ini.
