#!/usr/bin/env python3
"""
implementasi_plan/scripts/finish_subtask.py

Dipanggil di AKHIR setiap subtask kecil (mis. 0.1, 1.2, 3.4, dst.) untuk:
  1. Update baris subtask terkait di implementasi_plan/status.md (buat baris baru
     kalau belum ada, atau update baris yang sudah ada).
  2. Prepend entry baru (paling atas, di bawah marker) ke implementasi_plan/patchlog.md
     dengan ID PATCH-NNNN yang naik otomatis.
  3. Bundle file-file yang berubah (plus status.md & patchlog.md untuk jejak audit)
     menjadi implementasi_plan/bundles/<task_id>.zip

Contoh pemakaian:
    python implementasi_plan/scripts/finish_subtask.py \\
        --task 0.1 \\
        --title "Setup folder implementasi_plan" \\
        --desc "Membuat plan.yaml, status.md, patchlog.md, dan struktur folder awal." \\
        --files implementasi_plan/plan.yaml,implementasi_plan/status.md \\
        --status done

    # Menandai baru mulai (opsional, sebelum mulai kerja):
    python implementasi_plan/scripts/finish_subtask.py --task 1.2 --title "..." --status in_progress

Catatan:
  - --status menerima: pending | in_progress | done | blocked
  - --files boleh dikosongkan untuk update status "in_progress" (belum ada file final)
  - Jalankan dari root project (kasir-POS/) atau sesuaikan --root
"""
import argparse
import re
import sys
import zipfile
from datetime import datetime
from pathlib import Path


def load_text(path: Path) -> str:
    if not path.exists():
        raise FileNotFoundError(
            f"{path} tidak ditemukan. Jalankan task 0.1 (init status.md/patchlog.md) dulu."
        )
    return path.read_text(encoding="utf-8")


def update_status(status_path: Path, task_id: str, title: str, status: str,
                   bundle_name: str, note: str) -> None:
    text = load_text(status_path)
    today = datetime.now().strftime("%Y-%m-%d")
    lines = text.splitlines()

    header_idx = None
    row_idx = None
    for i, line in enumerate(lines):
        if line.strip().startswith("| Task ID"):
            header_idx = i
        if header_idx is not None and line.strip().startswith(f"| {task_id} "):
            row_idx = i
            break

    if header_idx is None:
        raise ValueError("Tabel status (header '| Task ID |...') tidak ditemukan di status.md")

    mulai = today
    selesai = today if status == "done" else ""
    bundle_col = bundle_name if status == "done" else ""

    if row_idx is not None:
        old = lines[row_idx]
        cells = [c.strip() for c in old.strip().strip("|").split("|")]
        # cells: Task ID, Judul, Status, Mulai, Selesai, Bundle Zip, Catatan
        if not cells[3]:
            cells[3] = mulai
        cells[2] = status
        if selesai:
            cells[4] = selesai
        if bundle_col:
            cells[5] = bundle_col
        if note:
            cells[6] = note
        new_row = "| " + " | ".join(cells) + " |"
        lines[row_idx] = new_row
    else:
        new_row = f"| {task_id} | {title} | {status} | {mulai} | {selesai} | {bundle_col} | {note} |"
        lines.insert(header_idx + 2, new_row)  # +2: lewati header + separator '---'

    status_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def next_patch_id(patchlog_text: str) -> str:
    ids = re.findall(r"^## PATCH-(\d+)", patchlog_text, re.MULTILINE)
    n = max((int(x) for x in ids), default=0) + 1
    return f"PATCH-{n:04d}"


def prepend_patchlog(patchlog_path: Path, task_id: str, title: str, desc: str,
                      files: list, status: str, bundle_name: str, note: str) -> str:
    text = load_text(patchlog_path)
    patch_id = next_patch_id(text)
    today = datetime.now().strftime("%Y-%m-%d")
    files_str = "\n".join(f"- {f}" for f in files) if files else "-"

    entry = (
        f"## {patch_id}\n"
        f"**Task ID:** {task_id}\n"
        f"**Tanggal:** {today}\n"
        f"**Judul:** {title}\n"
        f"**Deskripsi:** {desc or '-'}\n"
        f"**File Berubah:**\n{files_str}\n"
        f"**Bundle Zip:** {bundle_name if status == 'done' else '-'}\n"
        f"**Status:** {status}\n"
        f"**Catatan:** {note or '-'}\n"
    )

    marker = "<!-- ENTRY BARU DITAMBAHKAN DI SINI (tepat di bawah baris ini, di ATAS entri lama) -->"
    if marker in text:
        text = text.replace(marker, marker + "\n\n" + entry)
    else:
        text = text + "\n\n" + entry

    text = re.sub(r"latest_patch_id: .*", f"latest_patch_id: {patch_id}", text, count=1)
    total = len(re.findall(r"^## PATCH-\d+", text, re.MULTILINE))
    text = re.sub(r"total_entries: .*", f"total_entries: {total}", text, count=1)

    patchlog_path.write_text(text, encoding="utf-8")
    return patch_id


def build_bundle(root: Path, task_id: str, files: list, status_path: Path,
                  patchlog_path: Path, bundles_dir: Path) -> Path:
    bundles_dir.mkdir(parents=True, exist_ok=True)
    zip_path = bundles_dir / f"{task_id}.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in files:
            fp = root / f
            if fp.exists():
                zf.write(fp, arcname=f)
            else:
                print(f"[WARN] file tidak ditemukan, dilewati: {f}", file=sys.stderr)
        zf.write(status_path, arcname=f"_snapshot/{status_path.name}")
        zf.write(patchlog_path, arcname=f"_snapshot/{patchlog_path.name}")
    return zip_path


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--task", required=True, help="Task ID, mis. 0.1, 1.2, 3.4")
    ap.add_argument("--title", required=True, help="Judul singkat subtask")
    ap.add_argument("--desc", default="", help="Deskripsi ringkas apa yang dikerjakan")
    ap.add_argument("--files", default="", help="Daftar file yang berubah, dipisah koma")
    ap.add_argument("--status", default="done", choices=["pending", "in_progress", "done", "blocked"])
    ap.add_argument("--note", default="", help="Catatan tambahan (opsional)")
    ap.add_argument("--root", default=".", help="Root project (default: direktori kerja saat ini)")
    args = ap.parse_args()

    root = Path(args.root).resolve()
    plan_dir = root / "implementasi_plan"
    status_path = plan_dir / "status.md"
    patchlog_path = plan_dir / "patchlog.md"
    bundles_dir = plan_dir / "bundles"

    files = [f.strip() for f in args.files.split(",") if f.strip()]
    bundle_name = f"implementasi_plan/bundles/{args.task}.zip"

    update_status(status_path, args.task, args.title, args.status, bundle_name, args.note)
    patch_id = prepend_patchlog(patchlog_path, args.task, args.title, args.desc,
                                 files, args.status, bundle_name, args.note)

    if args.status == "done":
        zip_path = build_bundle(root, args.task, files, status_path, patchlog_path, bundles_dir)
        print(f"[OK] Task {args.task} -> {patch_id}. Bundle: {zip_path}")
    else:
        print(f"[OK] Task {args.task} -> {patch_id}. Status: {args.status} (belum di-bundle).")


if __name__ == "__main__":
    main()
