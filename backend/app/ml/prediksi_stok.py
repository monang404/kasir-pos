import math
import statistics

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.require_role import RequireModule
from app.database import SessionLocal, get_db
from app.ml.job_infra import get_or_trigger_ml_task

router = APIRouter(prefix="/ml", tags=["ml"])
check_access = RequireModule("ml")

def compute_prediksi_stok(db: Session):
    """
    Hitung prediksi stok untuk semua produk aktif.
    """
    # 1. Ambil semua produk dan stok saat ini
    produk_rows = db.execute(text("""
        SELECT p.id, p.kode, p.nama, COALESCE(SUM(pb.qty_sisa), 0) as stok_sekarang
        FROM produk p
        LEFT JOIN produk_batch pb ON p.id = pb.produk_id
        GROUP BY p.id, p.kode, p.nama
    """)).fetchall()
    
    # 2. Ambil data penjualan 90 hari terakhir per hari
    sales_rows = db.execute(text("""
        SELECT td.produk_id, date(t.tanggal) as tgl, SUM(td.qty) as daily_qty
        FROM transaksi_detail td
        JOIN transaksi t ON td.transaksi_id = t.id
        WHERE date(t.tanggal) >= CURRENT_DATE - INTERVAL '90 days' AND td.is_bonus = FALSE
        GROUP BY td.produk_id, date(t.tanggal)
    """)).fetchall()
    
    # Kelompokkan ke dalam dict
    sales_data = {}
    for r in sales_rows:
        if r.produk_id not in sales_data:
            sales_data[r.produk_id] = []
        sales_data[r.produk_id].append(r.daily_qty)
        
    results = []
    
    for p in produk_rows:
        daily_sales = sales_data.get(p.id, [])
        # Pad with 0 for days without sales up to 90
        # For simplicity, we just assume 90 days total
        full_90_days = daily_sales + [0] * (90 - len(daily_sales))
        
        sum_qty = sum(full_90_days)
        
        if sum_qty == 0:
            avg_daily = 0.0
            std_daily = 0.0
            cv = 0.0
            sisa_hari = 999
            status = "Tidak Bergerak"
            reorder_qty = 0
            confidence = "N/A"
        else:
            avg_daily = sum_qty / 90.0
            std_daily = statistics.stdev(full_90_days) if len(full_90_days) > 1 else 0
            cv = std_daily / avg_daily if avg_daily > 0 else 0
            
            sisa_hari = p.stok_sekarang / avg_daily if avg_daily > 0 else 999
            
            if sisa_hari <= 7:
                status = "Kritis"
            elif sisa_hari <= 14:
                status = "Rendah"
            elif sisa_hari <= 30:
                status = "Normal"
            else:
                status = "Aman"
                
            reorder_qty = max(0, math.ceil(avg_daily * 14 - p.stok_sekarang))
            
            # Confidence score based on CV and data points
            if len(daily_sales) < 5:
                confidence = "Rendah" # Kurang data
            elif cv < 0.5:
                confidence = "Tinggi" # Stabil
            elif cv < 1.0:
                confidence = "Sedang"
            else:
                confidence = "Rendah" # Fluktuatif
        
        results.append({
            "kode": p.kode,
            "nama": p.nama,
            "stok_sekarang": p.stok_sekarang,
            "avg_daily": round(avg_daily, 2),
            "cv": round(cv, 2),
            "sisa_hari": math.floor(sisa_hari) if sisa_hari < 999 else ">90",
            "status": status,
            "reorder_qty": reorder_qty,
            "confidence": confidence
        })
        
    return {"prediksi_stok": results}


def get_db_session():
    return SessionLocal()


@router.get("/prediksi-stok", dependencies=[Depends(check_access)])
def api_prediksi_stok(
    background_tasks: BackgroundTasks,
    force_refresh: bool = Query(False),
    db: Session = Depends(get_db)
):
    res = get_or_trigger_ml_task(
        key="prediksi_stok",
        compute_func=compute_prediksi_stok,
        db=db,
        bg_tasks=background_tasks,
        db_factory=get_db_session,
        max_age_hours=24,
        force_refresh=force_refresh
    )
    return res
