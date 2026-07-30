from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
import os, subprocess, gzip
import re

from app.database import get_db, DATABASE_URL
from app.auth.require_role import RequireModule
from app.auth.session import get_current_user
from app.backup.create_list_download import BACKUP_DIR, do_backup

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
        # Jika safety backup GAGAL -> batalkan restore seluruhnya
        raise HTTPException(
            status_code=500,
            detail=(
                f"RESTORE DIBATALKAN: Gagal membuat safety backup sebelum restore. "
                f"Database Anda TIDAK diubah. Error: {str(e)}"
            )
        )

    # ── LAPISAN 2: Jalankan restore ──
    url = DATABASE_URL
    match = re.match(r"postgresql://([^:]+):([^@]+)@([^:/]+):(\d+)/(.+)", url)
    if not match:
        raise HTTPException(status_code=500, detail="Format DATABASE_URL tidak dikenali")

    pg_user, pg_pass, pg_host, pg_port, pg_db = match.groups()
    env = os.environ.copy()
    env["PGPASSWORD"] = pg_pass

    try:
        with gzip.open(restore_path, "rb") as f:
            sql_content = f.read().decode("utf-8")

        result = subprocess.run(
            ["psql", "-h", pg_host, "-p", pg_port, "-U", pg_user, pg_db],
            input=sql_content, capture_output=True, text=True, env=env
        )

        if result.returncode != 0:
            raise RuntimeError(f"psql restore gagal: {result.stderr}")

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Restore GAGAL setelah safety backup ({safety_name}) berhasil dibuat. "
                f"Anda bisa menggunakan safety backup untuk memulihkan data. Error: {str(e)}"
            )
        )

    # ── Catat ke log ──
    try:
        db.execute(text("""
            INSERT INTO activity_log (user_id, username, role, aksi, modul, target_info)
            VALUES (:uid, :uname, :role, 'RESTORE', 'backup', :info)
        """), {
            "uid": current_user.get("id"), "uname": current_user.get("username"),
            "role": current_user.get("role"),
            "info": f"Restore dari: {safe_name} | Safety backup: {safety_name}"
        })
        db.commit()
    except Exception:
        pass

    return {
        "message": f"Restore berhasil dari {safe_name}",
        "safety_backup": safety_name,
        "warning": (
            "PENTING: Restart service backend diperlukan agar koneksi database di-reset "
            "dan data terbaru dari restore terbaca dengan benar."
        )
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

    try:
        db.execute(text("""
            INSERT INTO activity_log (user_id, username, role, aksi, modul, target_info)
            VALUES (:uid, :uname, :role, 'DELETE', 'backup', :info)
        """), {
            "uid": current_user.get("id"), "uname": current_user.get("username"),
            "role": current_user.get("role"),
            "info": f"Hapus file backup: {safe_name}"
        })
        db.commit()
    except Exception:
        pass

    return {"message": f"File backup {safe_name} berhasil dihapus"}
