---
title: kasir-POS Implementasi Plan — Patch Log
latest_patch_id: PATCH-0004
total_entries: 5
---

# PATCHLOG.md — Log Perubahan per Subtask

> **Format:** Prepend-only (entri terbaru ditambahkan paling ATAS, tepat di bawah baris ini).
> Jangan pernah menghapus atau menimpa entri lama.
> **ID:** `PATCH-NNNN` urut naik (4 digit, tidak reset), jadi heading `## PATCH-NNNN`.
> **Wajib diisi setiap kali sebuah subtask (task.subtask, mis. 0.1, 1.2, dst.) selesai dikerjakan.**

<!-- ENTRY BARU DITAMBAHKAN DI SINI (tepat di bawah baris ini, di ATAS entri lama) -->

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

