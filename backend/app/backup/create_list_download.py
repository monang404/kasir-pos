import gzip
import os
import subprocess
from datetime import datetime

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.require_role import RequireModule
from app.auth.session import get_current_user
from app.database import DATABASE_URL, get_db

router = APIRouter(prefix="/backup", tags=["backup"])
check_access = RequireModule("backup")

BACKUP_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "backups")
os.makedirs(BACKUP_DIR, exist_ok=True)


def format_filesize(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 ** 2:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 ** 3:
        return f"{size_bytes / 1024**2:.1f} MB"
    else:
        return f"{size_bytes / 1024**3:.2f} GB"


def do_backup(label: str = "") -> str:
    """
    Buat backup dump DB. Untuk PostgreSQL menggunakan pg_dump.
    Return path file backup yang dibuat.
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_label = label.replace(" ", "_")[:30] if label else ""
    filename = f"backup_{timestamp}{'_' + safe_label if safe_label else ''}.sql.gz"
    filepath = os.path.join(BACKUP_DIR, filename)

    # Parse DATABASE_URL untuk mendapat koneksi params
    # Format: postgresql://user:pass@host:port/dbname
    url = DATABASE_URL
    # Buat environment vars untuk pg_dump
    import re
    match = re.match(r"postgresql://([^:]+):([^@]+)@([^:/]+):(\d+)/(.+)", url)
    if not match:
        raise ValueError("Format DATABASE_URL tidak dikenali")

    pg_user, pg_pass, pg_host, pg_port, pg_db = match.groups()

    env = os.environ.copy()
    env["PGPASSWORD"] = pg_pass

    # Jalankan pg_dump
    result = subprocess.run(
        ["pg_dump", "-h", pg_host, "-p", pg_port, "-U", pg_user, "-F", "p", pg_db],
        capture_output=True, text=True, env=env
    )

    if result.returncode != 0:
        raise RuntimeError(f"pg_dump gagal: {result.stderr}")

    # Kompres dengan gzip
    with gzip.open(filepath, "wb") as f:
        f.write(result.stdout.encode("utf-8"))

    return filepath


@router.get("/list", dependencies=[Depends(check_access)])
def list_backups():
    files = []
    for f in sorted(os.listdir(BACKUP_DIR), reverse=True):
        if f.endswith(".sql.gz"):
            fp = os.path.join(BACKUP_DIR, f)
            size = os.path.getsize(fp)
            mtime = datetime.fromtimestamp(os.path.getmtime(fp))
            files.append({
                "filename": f,
                "size": format_filesize(size),
                "size_bytes": size,
                "created_at": mtime.strftime("%Y-%m-%d %H:%M:%S")
            })
    return {"data": files}


@router.post("/create", dependencies=[Depends(check_access)])
def create_backup(
    label: str | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        filepath = do_backup(label or "")
        filename = os.path.basename(filepath)
        size = format_filesize(os.path.getsize(filepath))

        try:
            db.execute(text("""
                INSERT INTO activity_log (user_id, username, role, aksi, modul, target_info)
                VALUES (:uid, :uname, :role, 'CREATE', 'backup', :info)
            """), {
                "uid": current_user.get("id"), "uname": current_user.get("username"),
                "role": current_user.get("role"),
                "info": f"Backup dibuat: {filename} ({size})"
            })
            db.commit()
        except Exception:
            pass

        return {"message": "Backup berhasil dibuat", "filename": filename, "size": size}
    except Exception:
        raise


@router.get("/download/{filename}", dependencies=[Depends(check_access)])
def download_backup(filename: str):
    # Sanitize filename
    safe_name = os.path.basename(filename)
    filepath = os.path.join(BACKUP_DIR, safe_name)
    if not os.path.exists(filepath):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="File backup tidak ditemukan")
    return FileResponse(
        filepath,
        media_type="application/gzip",
        headers={"Content-Disposition": f"attachment; filename={safe_name}"}
    )
