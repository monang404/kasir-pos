from collections import defaultdict
from itertools import combinations

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.require_role import RequireModule
from app.database import SessionLocal, get_db
from app.ml.job_infra import get_or_trigger_ml_task

router = APIRouter(prefix="/ml", tags=["ml"])
check_access = RequireModule("ml")


def compute_promo_recommendation(db: Session):
    # ─── 1. Data penjualan 90 hari per produk ───
    rows_90 = db.execute(text("""
        SELECT p.id, p.kode, p.nama, SUM(td.qty) as qty_90,
               COALESCE(SUM(pb.qty_sisa), 0) as stok_sekarang
        FROM transaksi_detail td
        JOIN transaksi t ON td.transaksi_id = t.id
        JOIN produk p ON td.produk_id = p.id
        LEFT JOIN produk_batch pb ON p.id = pb.produk_id
        WHERE date(t.tanggal) >= CURRENT_DATE - INTERVAL '90 days' AND td.is_bonus = FALSE
        GROUP BY p.id, p.kode, p.nama
    """)).fetchall()

    rows_prev_30 = db.execute(text("""
        SELECT td.produk_id, SUM(td.qty) as qty_prev
        FROM transaksi_detail td
        JOIN transaksi t ON td.transaksi_id = t.id
        WHERE date(t.tanggal) >= CURRENT_DATE - INTERVAL '60 days' AND date(t.tanggal) < CURRENT_DATE - INTERVAL '30 days' AND td.is_bonus = FALSE
        GROUP BY td.produk_id
    """)).fetchall()

    rows_curr_30 = db.execute(text("""
        SELECT td.produk_id, SUM(td.qty) as qty_curr
        FROM transaksi_detail td
        JOIN transaksi t ON td.transaksi_id = t.id
        WHERE date(t.tanggal) >= CURRENT_DATE - INTERVAL '30 days' AND td.is_bonus = FALSE
        GROUP BY td.produk_id
    """)).fetchall()

    prev_map = {r.produk_id: r.qty_prev for r in rows_prev_30}
    curr_map = {r.produk_id: r.qty_curr for r in rows_curr_30}

    # ─── 2. Rekomendasi Promo/Bonus (stok menumpuk, tren lemah) ───
    rekomendasi_promo = []
    # Rekomendasi Upselling (fast-moving, tren naik)
    rekomendasi_upsell = []

    for r in rows_90:
        avg_daily = r.qty_90 / 90.0 if r.qty_90 else 0
        estimasi_habis = (r.stok_sekarang / avg_daily) if avg_daily > 0 else 9999

        q_curr = curr_map.get(r.id, 0)
        q_prev = prev_map.get(r.id, 1)
        trend = q_curr / q_prev if q_prev > 0 else (1.0 if q_curr > 0 else 0.0)

        if estimasi_habis > 45 and trend < 0.8:
            rekomendasi_promo.append({
                "kode": r.kode,
                "nama": r.nama,
                "stok": r.stok_sekarang,
                "estimasi_habis_hari": round(estimasi_habis, 1) if estimasi_habis < 9999 else ">90",
                "trend": round(trend, 2),
                "alasan": "Stok menumpuk dan tren penjualan lemah"
            })

        if trend >= 1.2 and avg_daily > 0:
            rekomendasi_upsell.append({
                "kode": r.kode,
                "nama": r.nama,
                "stok": r.stok_sekarang,
                "trend": round(trend, 2),
                "alasan": "Fast-moving dengan tren naik"
            })

    # Sort
    rekomendasi_promo.sort(key=lambda x: x["trend"])
    rekomendasi_upsell.sort(key=lambda x: x["trend"], reverse=True)

    # ─── 3. Apriori Sederhana - Bundling ───
    # Ambil pasangan produk per transaksi
    trx_items = db.execute(text("""
        SELECT td.transaksi_id, td.produk_id, p.nama
        FROM transaksi_detail td
        JOIN transaksi t ON td.transaksi_id = t.id
        JOIN produk p ON td.produk_id = p.id
        WHERE date(t.tanggal) >= CURRENT_DATE - INTERVAL '90 days' AND td.is_bonus = FALSE
    """)).fetchall()

    # Group items by transaction
    trx_groups = defaultdict(list)
    for r in trx_items:
        trx_groups[r.transaksi_id].append((r.produk_id, r.nama))

    # Count pairs
    pair_counts = defaultdict(int)
    item_counts = defaultdict(int)
    total_trx = len(trx_groups)

    for items in trx_groups.values():
        unique_ids = list({pid for pid, _ in items})
        for pid in unique_ids:
            item_counts[pid] += 1
        for pair in combinations(sorted(unique_ids), 2):
            pair_counts[pair] += 1

    # Filter by min support (>=5% transaksi atau >= 3 kali)
    min_support_count = max(3, total_trx * 0.02)

    # Build nama map
    nama_map = {}
    for items in trx_groups.values():
        for pid, pnama in items:
            nama_map[pid] = pnama

    bundling_results = []
    for (pid1, pid2), count in pair_counts.items():
        if count >= min_support_count:
            support = count / total_trx if total_trx > 0 else 0
            conf12 = count / item_counts[pid1] if item_counts[pid1] > 0 else 0
            conf21 = count / item_counts[pid2] if item_counts[pid2] > 0 else 0
            bundling_results.append({
                "produk_a": nama_map.get(pid1, str(pid1)),
                "produk_b": nama_map.get(pid2, str(pid2)),
                "support": round(support * 100, 1),
                "confidence_ab": round(conf12 * 100, 1),
                "confidence_ba": round(conf21 * 100, 1),
                "frekuensi": count
            })

    bundling_results.sort(key=lambda x: x["support"], reverse=True)

    return {
        "rekomendasi_promo": rekomendasi_promo[:20],
        "rekomendasi_upsell": rekomendasi_upsell[:20],
        "bundling_apriori": bundling_results[:30]
    }


def get_db_session():
    return SessionLocal()


@router.get("/promo-recommendation", dependencies=[Depends(check_access)])
def api_promo_recommendation(
    background_tasks: BackgroundTasks,
    force_refresh: bool = Query(False),
    db: Session = Depends(get_db)
):
    res = get_or_trigger_ml_task(
        key="promo_recommendation",
        compute_func=compute_promo_recommendation,
        db=db,
        bg_tasks=background_tasks,
        db_factory=get_db_session,
        max_age_hours=24,
        force_refresh=force_refresh
    )
    return res
