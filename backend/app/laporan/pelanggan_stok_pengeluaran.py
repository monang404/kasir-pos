
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.require_role import RequireModule
from app.database import get_db
from app.laporan.ringkasan_transaksi_produk import build_date_filter

router = APIRouter(prefix="/laporan", tags=["laporan"])
check_access = RequireModule("laporan")

@router.get("/pelanggan", dependencies=[Depends(check_access)])
def get_laporan_pelanggan(
    mode: str = Query("bulan"),
    bulan: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    db: Session = Depends(get_db)
):
    where_trx, params = build_date_filter(mode, bulan, start_date, end_date, "t.tanggal")
    
    # Top spender
    rows = db.execute(
        text(f"""
            SELECT p.id, p.nama, p.no_hp,
                   COUNT(t.id) as trx_count,
                   SUM(t.total) as total_belanja,
                   SUM(t.profit) as profit_dihasilkan
            FROM transaksi t
            JOIN pelanggan p ON t.pelanggan_id = p.id
            WHERE {where_trx}
            GROUP BY p.id, p.nama, p.no_hp
            ORDER BY total_belanja DESC
            LIMIT 50
        """),
        params
    ).fetchall()

    return {
        "data": [
            {
                "id": r.id, "nama": r.nama, "no_hp": r.no_hp,
                "trx_count": r.trx_count,
                "total_belanja": float(r.total_belanja),
                "profit_dihasilkan": float(r.profit_dihasilkan)
            } for r in rows
        ]
    }


@router.get("/stok", dependencies=[Depends(check_access)])
def get_laporan_stok(db: Session = Depends(get_db)):
    # REAL-TIME snapshot, ignores any date filter
    rows = db.execute(
        text("""
            SELECT p.id, p.kode, p.nama,
                   p.harga_beli as hpp_default, p.harga_jual,
                   COALESCE(SUM(pb.qty_sisa), 0) as qty_sisa,
                   COALESCE(SUM(pb.qty_sisa * pb.harga_beli), 0) as valuasi
            FROM produk p
            LEFT JOIN produk_batch pb ON p.id = pb.produk_id
            GROUP BY p.id, p.kode, p.nama, p.harga_beli, p.harga_jual
            ORDER BY p.kode ASC
        """)
    ).fetchall()

    return {
        "metadata": {
            "note": "Laporan stok adalah SNAPSHOT REAL-TIME saat ini, tidak dipengaruhi oleh filter periode bulan/tanggal."
        },
        "data": [
            {
                "id": r.id, "kode": r.kode, "nama": r.nama,
                "hpp_default": float(r.hpp_default),
                "harga_jual": float(r.harga_jual),
                "qty_sisa": r.qty_sisa,
                "valuasi": float(r.valuasi)
            } for r in rows
        ]
    }


@router.get("/pengeluaran", dependencies=[Depends(check_access)])
def get_laporan_pengeluaran(
    mode: str = Query("bulan"),
    bulan: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    db: Session = Depends(get_db)
):
    where_peng, params = build_date_filter(mode, bulan, start_date, end_date, "tanggal")
    
    rows = db.execute(
        text(f"""
            SELECT kategori, SUM(jumlah) as total
            FROM pengeluaran
            WHERE {where_peng}
            GROUP BY kategori
            ORDER BY total DESC
        """),
        params
    ).fetchall()

    total_semua = sum(float(r.total) for r in rows)

    return {
        "total_pengeluaran": total_semua,
        "data": [
            {
                "kategori": r.kategori,
                "total": float(r.total)
            } for r in rows
        ]
    }
