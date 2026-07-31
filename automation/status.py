#!/usr/bin/env python3
"""
Module: automation.status

Purpose:
    Baca/tulis STATUS.md (root proyek) — satu-satunya Source of Truth untuk
    "sudah sampai mana?" progres implementasi. Path diambil dari
    automation/docops.config.json (lihat automation/docops_config.py), sama
    seperti automation/patchlog.py — tidak ada path/nama proyek yang
    di-hardcode di sini.

    STATUS.md berbentuk satu tabel Markdown dengan kolom:
        Rencana | Task ID | Judul | Status | Mulai | Selesai | Bundle Zip | Catatan

    "Rencana" membedakan rencana kerja yang berbeda (mis. "Migrasi Awal" vs
    "Addendum 29-36") supaya Task ID yang sama di rencana berbeda tidak
    bentrok satu sama lain. `set` di bawah akan membuat baris baru kalau
    belum ada, atau meng-update baris yang sudah ada (dicocokkan lewat
    kombinasi Rencana + Task ID), TIDAK PERNAH menghapus baris lama.

CLI:
    python automation/status.py set \\
        --rencana "Addendum 29-36" --task 1.1 \\
        --title "Validasi qty checkout" --status done \\
        --bundle "-" --note "-"

    python automation/status.py set --rencana "Addendum 29-36" --task 1.1 \\
        --status in_progress
        # --title boleh dikosongkan kalau baris sudah ada (tidak menimpa judul lama)

    python automation/status.py list [--rencana "Addendum 29-36"] [--json]
    python automation/status.py verify [--json]

Subscribes to:
    None

Publishes:
    None
"""

import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from docops_config import STATUS_PATH  # noqa: E402

STATUS = STATUS_PATH

VALID_STATUS = {"pending", "in_progress", "done", "blocked"}

HEADER_ROW_RE = re.compile(r"^\|\s*Rencana\s*\|\s*Task ID\s*\|", re.MULTILINE)
ROW_RE = re.compile(r"^\|(?P<cells>.+)\|\s*$", re.MULTILINE)


def _split_row(line: str) -> list:
    return [c.strip() for c in line.strip().strip("|").split("|")]


def _is_separator(cells: list) -> bool:
    return all(set(c) <= {"-"} for c in cells if c != "")


def parse_table(text: str):
    """Kembalikan (lines, header_idx, sep_idx, row_idxs) dari file STATUS.md."""
    lines = text.splitlines()
    header_idx = None
    for i, line in enumerate(lines):
        if line.strip().startswith("| Rencana"):
            header_idx = i
            break
    if header_idx is None:
        raise ValueError(
            "Tabel STATUS ('| Rencana | Task ID | ...') tidak ditemukan di STATUS.md"
        )
    sep_idx = header_idx + 1
    row_idxs = []
    for i in range(sep_idx + 1, len(lines)):
        line = lines[i]
        if not line.strip().startswith("|"):
            break
        row_idxs.append(i)
    return lines, header_idx, sep_idx, row_idxs


def parse_entries(text: str) -> list:
    lines, header_idx, sep_idx, row_idxs = parse_table(text)
    entries = []
    for i in row_idxs:
        cells = _split_row(lines[i])
        if len(cells) < 8:
            continue
        entries.append({
            "rencana": cells[0],
            "task_id": cells[1],
            "judul": cells[2],
            "status": cells[3],
            "mulai": cells[4],
            "selesai": cells[5],
            "bundle": cells[6],
            "catatan": cells[7],
            "_line": i,
        })
    return entries


def verify(text: str) -> dict:
    entries = parse_entries(text)
    seen = {}
    duplicates = []
    invalid_status = []
    for e in entries:
        key = (e["rencana"], e["task_id"])
        if key in seen:
            duplicates.append(f"{key[0]} / {key[1]}")
        seen[key] = True
        if e["status"] not in VALID_STATUS:
            invalid_status.append(f"{key[0]} / {key[1]}: status='{e['status']}'")
    return {
        "total_rows": len(entries),
        "duplicate_keys": duplicates,
        "invalid_status": invalid_status,
        "ok": not duplicates and not invalid_status,
    }


def set_row(*, rencana: str, task_id: str, title: str, status: str,
            bundle: str, note: str) -> str:
    if status not in VALID_STATUS:
        print(f"[ERROR] --status harus salah satu dari {sorted(VALID_STATUS)}", file=sys.stderr)
        sys.exit(1)

    text = STATUS.read_text(encoding="utf-8")
    lines, header_idx, sep_idx, row_idxs = parse_table(text)
    today = date.today().isoformat()

    target_idx = None
    for i in row_idxs:
        cells = _split_row(lines[i])
        if len(cells) >= 8 and cells[0] == rencana and cells[1] == task_id:
            target_idx = i
            break

    if target_idx is not None:
        cells = _split_row(lines[target_idx])
        if title:
            cells[2] = title
        if not cells[4]:
            cells[4] = today
        cells[3] = status
        if status == "done" and not cells[5]:
            cells[5] = today
        if bundle:
            cells[6] = bundle
        if note:
            cells[7] = note
        lines[target_idx] = "| " + " | ".join(cells) + " |"
        action = "updated"
    else:
        if not title:
            print("[ERROR] --title wajib diisi untuk baris baru", file=sys.stderr)
            sys.exit(1)
        mulai = today
        selesai = today if status == "done" else ""
        new_row = (
            f"| {rencana} | {task_id} | {title} | {status} | {mulai} | {selesai} | "
            f"{bundle or ''} | {note or ''} |"
        )
        insert_at = row_idxs[-1] + 1 if row_idxs else sep_idx + 1
        lines.insert(insert_at, new_row)
        action = "created"

    STATUS.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return action


def main():
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_set = sub.add_parser("set", help="Buat atau update baris task di STATUS.md")
    p_set.add_argument("--rencana", required=True, help='Mis. "Migrasi Awal", "Addendum 29-36"')
    p_set.add_argument("--task", required=True, dest="task_id", help="Task ID, mis. 1.1, 2.3")
    p_set.add_argument("--title", default="", help="Judul task (wajib untuk baris baru)")
    p_set.add_argument("--status", required=True, choices=sorted(VALID_STATUS))
    p_set.add_argument("--bundle", default="", help="Path bundle/artefak (opsional)")
    p_set.add_argument("--note", default="", help="Catatan tambahan (opsional)")

    p_list = sub.add_parser("list")
    p_list.add_argument("--rencana", default=None, help="Filter berdasarkan Rencana")
    p_list.add_argument("--json", action="store_true", dest="json_output")

    p_verify = sub.add_parser("verify", help="Cek duplikat Task ID & nilai Status tidak valid")
    p_verify.add_argument("--json", action="store_true", dest="json_output")

    args = parser.parse_args()

    if args.cmd == "set":
        action = set_row(
            rencana=args.rencana,
            task_id=args.task_id,
            title=args.title,
            status=args.status,
            bundle=args.bundle,
            note=args.note,
        )
        print(f"[OK] Baris {action}: {args.rencana} / {args.task_id} -> {args.status}")
        return

    text = STATUS.read_text(encoding="utf-8")

    if args.cmd == "verify":
        report = verify(text)
        if args.json_output:
            print(json.dumps(report, indent=2))
        else:
            print(f"Baris ditemukan : {report['total_rows']}")
            ok = True
            if report["duplicate_keys"]:
                ok = False
                print(f"[ERROR] Task ID duplikat ({len(report['duplicate_keys'])}):")
                for k in report["duplicate_keys"]:
                    print(f"   - {k}")
            if report["invalid_status"]:
                ok = False
                print(f"[ERROR] Status tidak valid ({len(report['invalid_status'])}):")
                for k in report["invalid_status"]:
                    print(f"   - {k}")
            if ok:
                print("[OK] Semua baris valid, tidak ada duplikat.")
            else:
                sys.exit(1)
        return

    if args.cmd == "list":
        entries = parse_entries(text)
        if args.rencana:
            entries = [e for e in entries if e["rencana"] == args.rencana]
        for e in entries:
            e.pop("_line", None)
        print(json.dumps(entries, indent=2))
        return


if __name__ == "__main__":
    main()
