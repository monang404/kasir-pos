"""
Activity Logger — best-effort, TIDAK PERNAH menggagalkan operasi utama.

Usage:
    from app.activity_log.logger import log_action
    log_action(db, actor, "CREATE", "produk", str(produk_id), info="...", before=None, after=data)
"""
import json
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, Any


def log_action(
    db: Session,
    actor: dict,
    aksi: str,
    modul: str,
    target_id: str = "",
    info: str = "",
    before: Optional[Any] = None,
    after: Optional[Any] = None
):
    """
    Mencatat satu baris ke activity_log.
    Jika gagal, error ditelan (best-effort) — operasi utama tidak terganggu.
    """
    try:
        detail_parts = {}
        if before is not None:
            detail_parts["before"] = before
        if after is not None:
            detail_parts["after"] = after

        detail_json = json.dumps(detail_parts, ensure_ascii=False, default=str) if detail_parts else None

        db.execute(text("""
            INSERT INTO activity_log (user_id, username, role, aksi, modul, target_id, target_info, detail)
            VALUES (:uid, :uname, :role, :aksi, :modul, :tid, :info, :detail)
        """), {
            "uid": actor.get("id"),
            "uname": actor.get("username", "—"),
            "role": actor.get("role", "—"),
            "aksi": aksi,
            "modul": modul,
            "tid": target_id,
            "info": info,
            "detail": detail_json
        })
        # Tidak commit di sini — biarkan caller yang commit setelah operasi utama
    except Exception as e:
        # Telan error, jangan propagate
        print(f"[ACTIVITY_LOG] Gagal mencatat log (best-effort, operasi tetap lanjut): {e}")
