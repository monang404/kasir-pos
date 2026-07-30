# implementasi_plan/

Rencana implementasi migrasi **kasir-POS** (desktop PyQt5 → web), dipecah per task
supaya ringan dibaca/di-diff. Sumber kebenaran fitur & aturan bisnis ada di `docs/PRD.md`
(dan `docs/Arsitektur.md`) di root project — file di sini hanya rencana eksekusi + tracking.

## Struktur file

```
implementasi_plan/
├── 00_index.yaml                        <- MULAI BACA DARI SINI (konvensi, urutan task, dependency)
├── 01_task-0-persiapan.yaml
├── 02_task-1-skema-database.yaml
├── 03_task-2-autentikasi-sesi.yaml
├── 04_task-3-kasir-pos.yaml
├── 05_task-4-inventory-fifo.yaml
├── 06_task-5-transaksi-riwayat.yaml
├── 07_task-6-pelanggan-pengeluaran.yaml
├── 08_task-7-laporan-dashboard.yaml
├── 09_task-8-ml-intelligence.yaml
├── 10_task-9-user-log-backup.yaml
├── status.md                            <- progress tracker (auto-update via script)
├── patchlog.md                          <- log tiap subtask selesai (auto-update via script)
├── bundles/                             <- hasil zip per subtask, mis. 0.1.zip, 3.4.zip
├── decisions/                           <- ADR / keputusan yang diminta di beberapa subtask
├── scripts/
│   └── finish_subtask.py                <- satu-satunya tool untuk menutup subtask
└── templates/
    ├── status_template.md
    └── patchlog_template.md
```

## Penomoran

- **Task** = angka bulat: `0, 1, 2, ..., 9` (lihat `00_index.yaml` -> `tasks_overview`).
- **Subtask** = `task.urutan`, mis. `0.1`, `0.2`, `3.4`. Konsisten di semua file, tidak pernah dipakai ulang.

## Alur kerja WAJIB untuk setiap subtask

1. (opsional) Tandai mulai:
   ```
   python implementasi_plan/scripts/finish_subtask.py --task <ID> --title "<judul>" --status in_progress
   ```
2. Kerjakan sesuai `description`/`deliverables` pada subtask di file task-nya.
3. Tutup subtask (WAJIB, satu perintah untuk semuanya):
   ```
   python implementasi_plan/scripts/finish_subtask.py --task <ID> --title "<judul>" \
       --desc "<ringkasan perubahan>" --files <file1>,<file2>,... --status done
   ```
   Perintah ini otomatis:
   - update baris subtask di `status.md`
   - prepend entry baru (ID `PATCH-NNNN`) ke `patchlog.md`
   - buat `bundles/<ID>.zip` berisi file yang diubah + snapshot status/patchlog

Bundle zip **selalu** dinamai persis sesuai task ID subtask (task `0.1` -> `0.1.zip`, task `3.4` -> `3.4.zip`).

## Setup awal (task 0.1)

Sebelum subtask lain dikerjakan, jalankan dulu task `0.1` untuk menyalin template menjadi
file aktif:
```
cp implementasi_plan/templates/status_template.md implementasi_plan/status.md
cp implementasi_plan/templates/patchlog_template.md implementasi_plan/patchlog.md
```
Detail lengkap ada di `01_task-0-persiapan.yaml`.
