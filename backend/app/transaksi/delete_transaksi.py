from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.require_role import RequireModule
from app.auth.session import get_current_user
from app.database import get_db
from app.activity_log.logger import log_action

router = APIRouter(prefix="/transaksi", tags=["transaksi"])
check_access = RequireModule("transaksi")


@router.delete("/{transaksi_id}", dependencies=[Depends(check_access)])
def delete_transaksi(
    transaksi_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    trx = db.execute(
        text("SELECT id, kode, total FROM transaksi WHERE id = :id"),
        {"id": transaksi_id}
    ).fetchone()

    if not trx:
        raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan")

    # Ambil semua detail item untuk retur stok
    items = db.execute(
        text("""
            SELECT produk_id, qty, harga_beli, is_bonus
            FROM transaksi_detail
            WHERE transaksi_id = :tid
        """),
        {"tid": transaksi_id}
    ).fetchall()

    # Untuk setiap item: buat batch retur baru (PRD §16 aturan 3)
    # HPP batch retur = HPP tersimpan di detail asal (BUKAN harga_beli produk saat ini)
    for item in items:
        # Bonus juga dikembalikan stoknya (stok terpotong saat checkout)
        db.execute(
            text("""
                INSERT INTO produk_batch (produk_id, qty_masuk, qty_sisa, harga_beli, tanggal_masuk)
                VALUES (:pid, :qty, :qty, :hb, CURRENT_TIMESTAMP)
            """),
            {
                "pid": item.produk_id,
                "qty": item.qty,
                "hb": float(item.harga_beli),  # HPP dari detail asal, bukan harga_beli produk terkini
            }
        )

    # Hapus detail lalu header (dalam 1 transaction)
    db.execute(text("DELETE FROM transaksi_detail WHERE transaksi_id = :tid"), {"tid": transaksi_id})
    db.execute(text("DELETE FROM transaksi WHERE id = :id"), {"id": transaksi_id})

    log_action(db, user, 'DELETE', 'transaksi', trx.kode, f"Hapus transaksi {trx.kode} — {len(items)} item stok dikembalikan")

    db.commit()

    return {
        "message": f"Transaksi {trx.kode} berhasil dihapus",
        "stok_diretur": len(items)
    }
