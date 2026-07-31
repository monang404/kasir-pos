
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.require_role import RequireModule
from app.auth.session import get_current_user
from app.database import get_db
from app.activity_log.logger import log_action

router = APIRouter(prefix="/activity-log", tags=["activity_log"])
check_access = RequireModule("activity_log")

PAGE_SIZE = 100


@router.get("/", dependencies=[Depends(check_access)])
def list_activity_log(
    modul: str | None = Query(None),
    aksi: str | None = Query(None),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    db: Session = Depends(get_db)
):
    conditions = []
    params = {}

    if modul:
        conditions.append("modul = :modul")
        params["modul"] = modul
    if aksi:
        conditions.append("aksi = :aksi")
        params["aksi"] = aksi
    if start_date:
        conditions.append("date(waktu) >= :start_date")
        params["start_date"] = start_date
    if end_date:
        conditions.append("date(waktu) <= :end_date")
        params["end_date"] = end_date

    # Default: 30 hari terakhir jika tidak ada filter tanggal
    if not start_date and not end_date:
        conditions.append("date(waktu) >= CURRENT_DATE - INTERVAL '30 days'")

    where = "WHERE " + " AND ".join(conditions) if conditions else ""

    # Stats
    total = db.execute(text(f"SELECT COUNT(*) FROM activity_log {where}"), params).scalar() or 0
    hari_ini = db.execute(
        text(f"SELECT COUNT(*) FROM activity_log {where}" +
             (" AND " if where else " WHERE ") + "date(waktu) = CURRENT_DATE"),
        params
    ).scalar() or 0
    jumlah_hapus = db.execute(
        text(f"SELECT COUNT(*) FROM activity_log {where}" +
             (" AND " if where else " WHERE ") + "aksi IN ('DELETE','SOFT_DELETE','HARD_DELETE')"),
        params
    ).scalar() or 0
    jumlah_edit = db.execute(
        text(f"SELECT COUNT(*) FROM activity_log {where}" +
             (" AND " if where else " WHERE ") + "aksi = 'UPDATE'"),
        params
    ).scalar() or 0

    # Data (latest PAGE_SIZE)
    rows = db.execute(
        text(f"""
            SELECT id, waktu, username, role, aksi, modul, target_id, target_info, detail
            FROM activity_log
            {where}
            ORDER BY waktu DESC
            LIMIT {PAGE_SIZE}
        """),
        params
    ).fetchall()

    return {
        "stats": {
            "total": total,
            "hari_ini": hari_ini,
            "jumlah_hapus": jumlah_hapus,
            "jumlah_edit": jumlah_edit
        },
        "data": [
            {
                "id": r.id, "waktu": str(r.waktu), "username": r.username,
                "role": r.role, "aksi": r.aksi, "modul": r.modul,
                "target_id": r.target_id, "target_info": r.target_info, "detail": r.detail
            } for r in rows
        ]
    }


@router.delete("/purge", dependencies=[Depends(check_access)])
def purge_old_logs(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Hapus log yang lebih dari 90 hari."""
    result = db.execute(
        text("SELECT COUNT(*) FROM activity_log WHERE date(waktu) < CURRENT_DATE - INTERVAL '90 days'")
    ).scalar() or 0

    db.execute(
        text("DELETE FROM activity_log WHERE date(waktu) < CURRENT_DATE - INTERVAL '90 days'")
    )

    # Log aksi purge itu sendiri
    log_action(db, current_user, 'DELETE', 'activity_log', '', f"Purge {result} log entry lebih dari 90 hari")

    db.commit()
    return {"message": f"Berhasil menghapus {result} log entry yang lebih dari 90 hari", "deleted": result}
