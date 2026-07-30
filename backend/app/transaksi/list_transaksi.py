
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.require_role import RequireModule
from app.database import get_db

router = APIRouter(prefix="/transaksi", tags=["transaksi"])
check_access = RequireModule("transaksi")


@router.get("/", dependencies=[Depends(check_access)])
def list_transaksi(
    db: Session = Depends(get_db),
    bulan: str | None = Query(None, description="Format YYYY-MM, misal 2024-01"),
    pelanggan_id: int | None = Query(None),
    q: str | None = Query(None, description="Search kode transaksi / nama pelanggan"),
):
    # ─── Stats (tidak terpengaruh filter bulan/pelanggan/search) ───
    total_trx = db.execute(text("SELECT COUNT(*) FROM transaksi")).scalar() or 0

    # ─── Base query dengan filter ───
    conditions = []
    params: dict = {}

    if bulan:
        conditions.append("strftime('%Y-%m', t.tanggal) = :bulan")
        params["bulan"] = bulan

    if pelanggan_id:
        conditions.append("t.pelanggan_id = :pelanggan_id")
        params["pelanggan_id"] = pelanggan_id

    if q:
        conditions.append("(t.kode LIKE :q OR t.kasir_nama LIKE :q)")
        params["q"] = f"%{q}%"

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    # Stats yang ikut filter (omzet & profit)
    stat_row = db.execute(
        text(f"SELECT COALESCE(SUM(t.total),0), COALESCE(SUM(t.profit),0) FROM transaksi t {where}"),
        params
    ).fetchone()
    total_omzet = float(stat_row[0])
    total_profit = float(stat_row[1])

    # List transaksi
    rows = db.execute(
        text(f"""
            SELECT t.id, t.kode, t.tanggal, t.total, t.profit,
                   t.pelanggan_id, t.kasir_nama, t.metode_bayar
            FROM transaksi t
            {where}
            ORDER BY t.tanggal DESC
        """),
        params
    ).fetchall()

    data = [
        {
            "id": r.id,
            "kode": r.kode,
            "tanggal": str(r.tanggal),
            "total": float(r.total),
            "profit": float(r.profit),
            "pelanggan_id": r.pelanggan_id,
            "kasir_nama": r.kasir_nama,
            "metode_bayar": r.metode_bayar,
        }
        for r in rows
    ]

    return {
        "stats": {
            "total_transaksi": total_trx,   # fix, tidak ikut filter
            "total_omzet": total_omzet,      # ikut filter
            "total_profit": total_profit,    # ikut filter
            "ditampilkan": len(data),
        },
        "data": data,
    }


@router.get("/{transaksi_id}", dependencies=[Depends(check_access)])
def detail_transaksi(transaksi_id: int, db: Session = Depends(get_db)):
    trx = db.execute(
        text("SELECT * FROM transaksi WHERE id = :id"),
        {"id": transaksi_id}
    ).fetchone()

    if not trx:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan")

    items = db.execute(
        text("""
            SELECT td.*, p.nama AS produk_nama, p.kode AS produk_kode
            FROM transaksi_detail td
            LEFT JOIN produk p ON p.id = td.produk_id
            WHERE td.transaksi_id = :tid
        """),
        {"tid": transaksi_id}
    ).fetchall()

    return {
        "transaksi": {
            "id": trx.id, "kode": trx.kode, "tanggal": str(trx.tanggal),
            "total": float(trx.total), "profit": float(trx.profit),
            "pelanggan_id": trx.pelanggan_id, "kasir_nama": trx.kasir_nama,
            "metode_bayar": trx.metode_bayar,
        },
        "items": [
            {
                "id": i.id,
                "produk_id": i.produk_id,
                "produk_nama": i.produk_nama,
                "produk_kode": i.produk_kode,
                "qty": i.qty,
                "harga_jual": float(i.harga_jual),
                "harga_beli": float(i.harga_beli),
                "warna": i.warna,
                "harga_tinta": float(i.harga_tinta or 0),
                "diskon": float(i.diskon or 0),
                "harga_asli": float(i.harga_asli or 0),
                "is_bonus": bool(i.is_bonus),
            }
            for i in items
        ],
    }
