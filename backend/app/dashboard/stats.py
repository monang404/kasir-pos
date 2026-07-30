from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.require_role import RequireModule
from app.database import get_db

router = APIRouter(prefix="/dashboard", tags=["dashboard"])
check_access = RequireModule("dashboard")


def hitung_growth(curr: float, prev: float) -> float | None:
    if prev == 0:
        return None
    return ((curr - prev) / prev) * 100


@router.get("/stats", dependencies=[Depends(check_access)])
def get_dashboard_stats(
    bulan: str | None = Query(None, description="Format YYYY-MM"),
    db: Session = Depends(get_db)
):
    # Default to current month if not provided
    filter_bulan = bulan if bulan else datetime.now().strftime("%Y-%m")

    # 1. Hitung stats untuk bulan terpilih (ikut filter)
    row_trx = db.execute(
        text("""
            SELECT COALESCE(SUM(total), 0) AS omzet, 
                   COALESCE(SUM(profit), 0) AS laba_kotor,
                   COUNT(*) AS jumlah_transaksi
            FROM transaksi 
            WHERE strftime('%Y-%m', tanggal) = :bulan
        """),
        {"bulan": filter_bulan}
    ).fetchone()

    row_pengeluaran = db.execute(
        text("""
            SELECT COALESCE(SUM(jumlah), 0) AS total_pengeluaran
            FROM pengeluaran
            WHERE strftime('%Y-%m', tanggal) = :bulan
        """),
        {"bulan": filter_bulan}
    ).fetchone()

    omzet_filter = float(row_trx.omzet)
    laba_kotor_filter = float(row_trx.laba_kotor)
    pengeluaran_filter = float(row_pengeluaran.total_pengeluaran)
    laba_bersih_filter = laba_kotor_filter - pengeluaran_filter
    trx_filter = row_trx.jumlah_transaksi

    # 2. Hitung growth (SELALU current month vs prev month, tidak ikut filter)
    now = datetime.now()
    curr_month_str = now.strftime("%Y-%m")
    first = now.replace(day=1)
    prev_month = first - timedelta(days=1)
    prev_month_str = prev_month.strftime("%Y-%m")

    # Ambil curr month stats
    curr_trx = db.execute(
        text("""
            SELECT COALESCE(SUM(total), 0) AS omzet, 
                   COALESCE(SUM(profit), 0) AS laba_kotor,
                   COUNT(*) AS jumlah_transaksi
            FROM transaksi 
            WHERE strftime('%Y-%m', tanggal) = :bulan
        """),
        {"bulan": curr_month_str}
    ).fetchone()
    
    curr_peng = db.execute(
        text("SELECT COALESCE(SUM(jumlah), 0) FROM pengeluaran WHERE strftime('%Y-%m', tanggal) = :bulan"),
        {"bulan": curr_month_str}
    ).scalar() or 0

    omzet_curr = float(curr_trx.omzet)
    profit_curr = float(curr_trx.laba_kotor) - float(curr_peng)
    trx_curr = curr_trx.jumlah_transaksi

    # Ambil prev month stats
    prev_trx = db.execute(
        text("""
            SELECT COALESCE(SUM(total), 0) AS omzet, 
                   COALESCE(SUM(profit), 0) AS laba_kotor,
                   COUNT(*) AS jumlah_transaksi
            FROM transaksi 
            WHERE strftime('%Y-%m', tanggal) = :bulan
        """),
        {"bulan": prev_month_str}
    ).fetchone()

    prev_peng = db.execute(
        text("SELECT COALESCE(SUM(jumlah), 0) FROM pengeluaran WHERE strftime('%Y-%m', tanggal) = :bulan"),
        {"bulan": prev_month_str}
    ).scalar() or 0

    omzet_prev = float(prev_trx.omzet)
    profit_prev = float(prev_trx.laba_kotor) - float(prev_peng)
    trx_prev = prev_trx.jumlah_transaksi

    # 3. Transaksi terbaru (5 terakhir)
    recent_trx_rows = db.execute(
        text("""
            SELECT id, kode, tanggal, total, kasir_nama 
            FROM transaksi 
            ORDER BY tanggal DESC LIMIT 5
        """)
    ).fetchall()
    recent_trx = [
        {
            "id": r.id, "kode": r.kode, "tanggal": str(r.tanggal),
            "total": float(r.total), "kasir_nama": r.kasir_nama
        } for r in recent_trx_rows
    ]

    # 4. Stok Hampir Habis (< 20)
    low_stock_rows = db.execute(
        text("""
            SELECT p.id, p.kode, p.nama, COALESCE(SUM(pb.qty_sisa), 0) as total_stok
            FROM produk p
            LEFT JOIN produk_batch pb ON p.id = pb.produk_id
            GROUP BY p.id, p.kode, p.nama
            HAVING COALESCE(SUM(pb.qty_sisa), 0) < 20
            ORDER BY total_stok ASC
            LIMIT 10
        """)
    ).fetchall()
    low_stock = [
        {
            "id": r.id, "kode": r.kode, "nama": r.nama, "stok": r.total_stok
        } for r in low_stock_rows
    ]

    return {
        "stats": {
            "omzet": omzet_filter,
            "laba_kotor": laba_kotor_filter,
            "pengeluaran": pengeluaran_filter,
            "laba_bersih": laba_bersih_filter,
            "jumlah_transaksi": trx_filter
        },
        "growth": {
            "omzet": hitung_growth(omzet_curr, omzet_prev),
            "profit": hitung_growth(profit_curr, profit_prev),
            "transaksi": hitung_growth(trx_curr, trx_prev)
        },
        "recent_transaksi": recent_trx,
        "low_stock": low_stock
    }
