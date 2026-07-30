from fastapi import APIRouter, BackgroundTasks, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.require_role import RequireModule
from app.database import SessionLocal, get_db
from app.ml.job_infra import get_or_trigger_ml_task

router = APIRouter(prefix="/ml", tags=["ml"])
check_access = RequireModule("ml")


def compute_prediksi_demand(db: Session):
    # Skor kombinasi qty & tren 30 hari terakhir vs 30 hari sebelumnya
    # Ambil penjualan per produk 30 hari vs 30-60 hari
    rows_30 = db.execute(text("""
        SELECT p.id, p.kode, p.nama, SUM(td.qty) as qty_30
        FROM transaksi_detail td
        JOIN transaksi t ON td.transaksi_id = t.id
        JOIN produk p ON td.produk_id = p.id
        WHERE date(t.tanggal) >= date('now', '-30 days') AND td.is_bonus = 0
        GROUP BY p.id, p.kode, p.nama
    """)).fetchall()
    
    rows_prev_30 = db.execute(text("""
        SELECT td.produk_id, SUM(td.qty) as qty_prev
        FROM transaksi_detail td
        JOIN transaksi t ON td.transaksi_id = t.id
        WHERE date(t.tanggal) >= date('now', '-60 days') AND date(t.tanggal) < date('now', '-30 days') AND td.is_bonus = 0
        GROUP BY td.produk_id
    """)).fetchall()
    
    prev_map = {r.produk_id: r.qty_prev for r in rows_prev_30}
    
    results = []
    for r in rows_30:
        q_curr = r.qty_30
        q_prev = prev_map.get(r.id, 0)
        
        # Tren: rasio q_curr / q_prev (dibatasi maks 3.0, min 0.1)
        trend = min(3.0, (q_curr / q_prev) if q_prev > 0 else 1.5)
        
        # Score = qty * trend factor
        score = q_curr * trend
        
        results.append({
            "kode": r.kode,
            "nama": r.nama,
            "qty_30_hari": q_curr,
            "qty_prev_30_hari": q_prev,
            "trend_multiplier": round(trend, 2),
            "demand_score": round(score, 2)
        })
        
    # Sort by score descending
    results.sort(key=lambda x: x["demand_score"], reverse=True)
    
    return {"top_demand": results[:50]}  # Top 50

def get_db_session():
    return SessionLocal()

@router.get("/prediksi-demand", dependencies=[Depends(check_access)])
def api_prediksi_demand(
    background_tasks: BackgroundTasks,
    force_refresh: bool = Query(False),
    db: Session = Depends(get_db)
):
    res = get_or_trigger_ml_task(
        key="prediksi_demand",
        compute_func=compute_prediksi_demand,
        db=db,
        bg_tasks=background_tasks,
        db_factory=get_db_session,
        max_age_hours=24,
        force_refresh=force_refresh
    )
    return res
