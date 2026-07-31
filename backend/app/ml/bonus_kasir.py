from fastapi import APIRouter, BackgroundTasks, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.require_role import RequireModule
from app.database import SessionLocal, get_db
from app.ml.job_infra import get_or_trigger_ml_task

router = APIRouter(prefix="/ml", tags=["ml"])
check_access = RequireModule("ml")

# Keputusan Task 1.4: Tabel bonus_kasir DIHAPUS.
# Skor kasir tetap dihitung untuk tampilan UI, tidak ditulis ke DB.

TIER_PLATINUM = 85
TIER_GOLD = 70
TIER_SILVER = 50


def compute_bonus_kasir(db: Session):
    # Ambil data kasir 30 hari terakhir
    rows = db.execute(text("""
        SELECT kasir_id, kasir_nama,
               SUM(total)            AS omzet,
               AVG(total)            AS avg_trx,
               COUNT(*)              AS jml_trx
        FROM transaksi
        WHERE date(tanggal) >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY kasir_id, kasir_nama
    """)).fetchall()

    if not rows:
        return {"kasir": []}

    max_omzet = max(r.omzet for r in rows) or 1
    max_avg   = max(r.avg_trx for r in rows) or 1

    # Ambil growth bulan ini vs bulan lalu
    rows_growth = db.execute(text("""
        SELECT kasir_id,
               SUM(CASE WHEN to_char(tanggal, 'YYYY-MM') = to_char('now', 'YYYY-MM') THEN total ELSE 0 END) AS curr,
               SUM(CASE WHEN to_char(tanggal, 'YYYY-MM') = to_char(date('now', 'start of month', '-1 month', 'YYYY-MM')) THEN total ELSE 0 END) AS prev
        FROM transaksi
        GROUP BY kasir_id
    """)).fetchall()
    growth_map = {r.kasir_id: (r.curr, r.prev) for r in rows_growth}

    results = []
    for r in rows:
        # Skor 0-100:
        # 50% omzet relatif
        skor_omzet = (r.omzet / max_omzet) * 50

        # Maks 30 poin dari growth
        curr, prev = growth_map.get(r.kasir_id, (r.omzet, 0))
        if prev > 0:
            growth_pct = ((curr - prev) / prev) * 100
        else:
            growth_pct = 0
        skor_growth = min(30, max(0, growth_pct * 0.3))

        # 20% avg transaksi relatif
        skor_avg = (r.avg_trx / max_avg) * 20

        total_skor = skor_omzet + skor_growth + skor_avg

        # Tier assignment + syarat tambahan Silver:
        # Silver: score >=50 AND omzet masuk top-1/3 AND trx>=5
        omzet_threshold_top_third = max_omzet / 3

        if total_skor >= TIER_PLATINUM:
            tier = "Platinum"
        elif total_skor >= TIER_GOLD:
            tier = "Gold"
        elif total_skor >= TIER_SILVER and r.omzet >= omzet_threshold_top_third and r.jml_trx >= 5:
            tier = "Silver"
        else:
            tier = "Tidak Memenuhi Syarat"

        results.append({
            "kasir_nama": r.kasir_nama,
            "omzet": float(r.omzet),
            "avg_trx": round(float(r.avg_trx), 0),
            "jml_trx": r.jml_trx,
            "growth_pct": round(growth_pct, 1),
            "skor_total": round(total_skor, 1),
            "tier": tier
        })

    results.sort(key=lambda x: x["skor_total"], reverse=True)
    return {"kasir": results}


def get_db_session():
    return SessionLocal()


@router.get("/bonus-kasir", dependencies=[Depends(check_access)])
def api_bonus_kasir(
    background_tasks: BackgroundTasks,
    force_refresh: bool = Query(False),
    db: Session = Depends(get_db)
):
    res = get_or_trigger_ml_task(
        key="bonus_kasir",
        compute_func=compute_bonus_kasir,
        db=db,
        bg_tasks=background_tasks,
        db_factory=get_db_session,
        max_age_hours=24,
        force_refresh=force_refresh
    )
    return res
