import gzip
import os
import re
import subprocess

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.require_role import RequireModule
from app.auth.session import get_current_user
from app.backup.create_list_download import BACKUP_DIR, do_backup
from app.database import DATABASE_URL, engine, get_db
from app.activity_log.logger import log_action

router = APIRouter(prefix="/backup", tags=["backup"])
check_access = RequireModule("backup")


@router.post("/restore/{filename}", dependencies=[Depends(check_access)])
def restore_backup(
    filename: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    safe_name = os.path.basename(filename)
    restore_path = os.path.join(BACKUP_DIR, safe_name)

    if not os.path.exists(restore_path):
        raise HTTPException(status_code=404, detail="File backup tidak ditemukan")

    # ── LAPISAN 1: Buat safety backup wajib SEBELUM restore ──
    try:
        safety_filepath = do_backup(label="pre-restore-safety")
        safety_name = os.path.basename(safety_filepath)
    except Exception as e:
        import logging
        logging.exception(e)
        # Jika safety backup GAGAL -> batalkan restore seluruhnya
        raise HTTPException(
            status_code=500,
            detail=(
                "RESTORE DIBATALKAN: Gagal membuat safety backup sebelum restore. "
                "Database Anda TIDAK diubah. Silakan coba lagi."
            )
        )

    # ── LAPISAN 2: Jalankan restore ──
    url = DATABASE_URL
    from sqlalchemy.engine.url import make_url
    try:
        parsed_url = make_url(url)
    except Exception as e:
        import logging
        logging.exception(e)
        raise HTTPException(status_code=500, detail="Format DATABASE_URL tidak dikenali atau salah konfigurasi.")

    pg_user = parsed_url.username or "postgres"
    pg_pass = parsed_url.password or ""
    pg_host = parsed_url.host or "localhost"
    pg_port = str(parsed_url.port or 5432)
    pg_db = parsed_url.database or "postgres"
    env = os.environ.copy()
    env["PGPASSWORD"] = pg_pass

    try:
        with gzip.open(restore_path, "rb") as f:
            sql_content = f.read().decode("utf-8")

        engine.dispose()
        result = subprocess.run(
            ["psql", "-v", "ON_ERROR_STOP=1", "--single-transaction", "-h", pg_host, "-p", pg_port, "-U", pg_user, pg_db],
            input=sql_content, capture_output=True, text=True, env=env, timeout=300
        )

        if result.returncode != 0:
            raise RuntimeError(f"psql restore gagal: {result.stderr}")

    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=500,
            detail="Proses restore melebihi batas waktu (300 detik)."
        )
    except Exception as e:
        import logging
        logging.exception(e)
        raise HTTPException(
            status_code=500,
            detail=(
                f"Restore GAGAL setelah safety backup ({safety_name}) berhasil dibuat. "
                "Anda bisa menggunakan safety backup untuk memulihkan data. Terjadi kesalahan saat memulihkan database. "
                "Berkat '--single-transaction', database Anda tetap pada kondisi utuh (tidak parsial)."
            )
        )

    # ── Catat ke log ──
    log_action(db, current_user, 'RESTORE', 'backup', '', f"Restore dari: {safe_name} | Safety backup: {safety_name}")
    db.commit()

    return {
        "message": f"Restore berhasil dari {safe_name}",
        "safety_backup": safety_name
    }


@router.delete("/delete/{filename}", dependencies=[Depends(check_access)])
def delete_backup(
    filename: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    safe_name = os.path.basename(filename)
    filepath = os.path.join(BACKUP_DIR, safe_name)

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File backup tidak ditemukan")

    os.remove(filepath)

    log_action(db, current_user, 'DELETE', 'backup', '', f"Hapus file backup: {safe_name}")
    db.commit()

    return {"message": f"File backup {safe_name} berhasil dihapus"}
