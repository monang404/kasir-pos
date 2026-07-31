
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.require_role import RequireModule
from app.database import get_db

router = APIRouter(prefix="/laporan", tags=["laporan"])
check_access = RequireModule("laporan")

def build_date_filter(
    mode: str, 
    bulan: str | None, 
    start_date: str | None, 
    end_date: str | None,
    column: str = "tanggal"
):
    """Helper to build WHERE clause for dates."""
    if mode == "bulan" and bulan:
        return f"to_char({column}, 'YYYY-MM') = :bulan", {"bulan": bulan}
    elif mode == "rentang" and start_date and end_date:
        return f"date({column}) >= :start_date AND date({column}) <= :end_date", {"start_date": start_date, "end_date": end_date}
    # default fallback to no filter, or maybe current month?
    # we just return empty
    return "1=1", {}

@router.get("/ringkasan", dependencies=[Depends(check_access)])
def get_laporan_ringkasan(
    mode: str = Query("bulan"),
    bulan: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    db: Session = Depends(get_db)
):
    where_trx, params = build_date_filter(mode, bulan, start_date, end_date, "tanggal")
    
    # Kinerja Penjualan
    row_trx = db.execute(
        text(f"""
            SELECT COALESCE(SUM(total), 0) AS omzet, 
                   COALESCE(SUM(profit), 0) AS laba_kotor,
                   COUNT(*) AS trx_count
            FROM transaksi 
            WHERE {where_trx}
        """),
        params
    ).fetchone()
    
    row_pengeluaran = db.execute(
        text(f"""
            SELECT COALESCE(SUM(jumlah), 0) AS total_pengeluaran
            FROM pengeluaran
            WHERE {where_trx}
        """),
        params
    ).fetchone()

    omzet = float(row_trx.omzet)
    laba_kotor = float(row_trx.laba_kotor)
    pengeluaran = float(row_pengeluaran.total_pengeluaran)
    laba_bersih = laba_kotor - pengeluaran
    trx_count = row_trx.trx_count

    # Ringkasan Naratif Otomatis
    if trx_count > 0:
        avg_trx = omzet / trx_count
        margin = (laba_bersih / omzet * 100) if omzet > 0 else 0
        narasi = f"Pada periode ini, terjadi {trx_count} transaksi dengan total omzet Rp {omzet:,.0f}. "
        narasi += f"Rata-rata nilai per transaksi adalah Rp {avg_trx:,.0f}. "
        narasi += f"Total pengeluaran tercatat Rp {pengeluaran:,.0f}, menghasilkan laba bersih sebesar Rp {laba_bersih:,.0f} "
        narasi += f"dengan margin keuntungan bersih {margin:.1f}%."
    else:
        narasi = "Tidak ada transaksi pada periode yang dipilih."

    return {
        "kpi": {
            "omzet": omzet,
            "laba_kotor": laba_kotor,
            "pengeluaran": pengeluaran,
            "laba_bersih": laba_bersih,
            "jumlah_transaksi": trx_count
        },
        "narasi": narasi
    }


@router.get("/transaksi", dependencies=[Depends(check_access)])
def get_laporan_transaksi(
    mode: str = Query("bulan"),
    bulan: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    db: Session = Depends(get_db)
):
    where_trx, params = build_date_filter(mode, bulan, start_date, end_date, "tanggal")
    
    rows = db.execute(
        text(f"""
            SELECT t.id, t.kode, t.tanggal, t.total, t.profit, t.kasir_nama, t.metode_bayar,
                   p.nama as pelanggan_nama
            FROM transaksi t
            LEFT JOIN pelanggan p ON t.pelanggan_id = p.id
            WHERE {where_trx}
            ORDER BY t.tanggal DESC
        """),
        params
    ).fetchall()

    return {
        "data": [
            {
                "id": r.id, "kode": r.kode, "tanggal": str(r.tanggal),
                "total": float(r.total), "profit": float(r.profit),
                "kasir_nama": r.kasir_nama, "metode_bayar": r.metode_bayar,
                "pelanggan_nama": r.pelanggan_nama or "Umum"
            } for r in rows
        ]
    }


@router.get("/produk", dependencies=[Depends(check_access)])
def get_laporan_produk(
    mode: str = Query("bulan"),
    bulan: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    db: Session = Depends(get_db)
):
    where_trx, params = build_date_filter(mode, bulan, start_date, end_date, "t.tanggal")
    
    rows = db.execute(
        text(f"""
            SELECT p.kode, p.nama, 
                   SUM(td.qty) as qty_terjual,
                   SUM(td.harga_jual * td.qty) as omzet,
                   SUM((td.harga_jual - td.harga_beli - td.harga_tinta) * td.qty) as profit
            FROM transaksi_detail td
            JOIN transaksi t ON td.transaksi_id = t.id
            JOIN produk p ON td.produk_id = p.id
            WHERE {where_trx} AND td.is_bonus = FALSE
            GROUP BY p.id, p.kode, p.nama
            ORDER BY qty_terjual DESC
        """),
        params
    ).fetchall()

    return {
        "data": [
            {
                "kode": r.kode, "nama": r.nama,
                "qty_terjual": r.qty_terjual,
                "omzet": float(r.omzet),
                "profit": float(r.profit)
            } for r in rows
        ]
    }
