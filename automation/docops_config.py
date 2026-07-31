"""
Module: automation.docops_config

Purpose:
    Loader tunggal untuk konfigurasi proyek yang dipakai automation/patchlog.py
    dan automation/status.py, supaya tidak ada nama proyek atau path yang
    di-hardcode langsung di script. Semua nilai proyek-spesifik (nama proyek,
    lokasi PATCHLOG.md/STATUS.md, pemetaan Area dari prefix path) diambil dari
    automation/docops.config.json di root proyek yang sama.

    Kalau file config tidak ada (mis. dipakai ulang di proyek lain yang belum
    sempat membuat config-nya), fallback ke default generik yang aman
    (PATCHLOG.md/STATUS.md di root, tanpa Area map) -- BUKAN default yang
    membawa asumsi proyek lama.

Subscribes to:
    automation/docops.config.json

Publishes:
    None
"""

import json
from pathlib import Path

AUTOMATION_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = AUTOMATION_DIR.parent
CONFIG_PATH = AUTOMATION_DIR / "docops.config.json"

_DEFAULTS = {
    "project_name": PROJECT_ROOT.name,
    "patchlog_path": "PATCHLOG.md",
    "status_path": "STATUS.md",
    "area_prefix_map": [],
}


def load_config() -> dict:
    if not CONFIG_PATH.exists():
        return dict(_DEFAULTS)
    data = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    merged = dict(_DEFAULTS)
    merged.update(data)
    return merged


_CONFIG = load_config()

PROJECT_NAME: str = _CONFIG["project_name"]
PATCHLOG_PATH: Path = PROJECT_ROOT / _CONFIG["patchlog_path"]
STATUS_PATH: Path = PROJECT_ROOT / _CONFIG["status_path"]
AREA_PREFIX_MAP: list = [tuple(item) for item in _CONFIG["area_prefix_map"]]
