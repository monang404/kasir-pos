from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.require_role import RequireModule
from app.auth.session import get_current_user
from app.database import get_db
from app.inventory.fifo_service import keluar_fifo
from app.kasir.pricing import hitung_total_dan_profit
from app.activity_log.logger import log_action

router = APIRouter(prefix="/transaksi", tags=["transaksi"])
check_access = RequireModule("transaksi")


class EditItemRequest(BaseModel):
    qty_baru: int = Field(..., gt=0)


def recalculate_total_profit(db: Session, transaksi_id: int):
    """Hitung ulang total & profit header transaksi dari seluruh detail terkini."""
    rows = db.execute(
        text("""
            SELECT qty, harga_jual, harga_beli, harga_tinta, is_bonus
            FROM transaksi_detail
            WHERE transaksi_id = :tid
        """),
        {"tid": transaksi_id}
    ).fetchall()

    total = 0.0
    profit = 0.0
    for r in rows:
        omzet_item, profit_item = hitung_total_dan_profit(
            harga_jual=float(r.harga_jual),
            harga_beli=float(r.harga_beli),
            harga_tinta=float(r.harga_tinta or 0),
            qty=r.qty,
            is_bonus=r.is_bonus
        )
        total += omzet_item
        profit += profit_item

    db.execute(
        text("UPDATE transaksi SET total = :total, profit = :profit WHERE id = :tid"),
        {"total": total, "profit": profit, "tid": transaksi_id}
    )


@router.patch("/{transaksi_id}/item/{detail_id}", dependencies=[Depends(check_access)])
def edit_item_transaksi(
    transaksi_id: int,
    detail_id: int,
    req: EditItemRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    # Ambil detail item
    detail = db.execute(
        text("""
            SELECT td.id, td.produk_id, td.qty, td.harga_beli, td.is_bonus,
                   t.kode AS trx_kode
            FROM transaksi_detail td
            JOIN transaksi t ON t.id = td.transaksi_id
            WHERE td.id = :did AND td.transaksi_id = :tid
        """),
        {"did": detail_id, "tid": transaksi_id}
    ).fetchone()

    if not detail:
        raise HTTPException(status_code=404, detail="Item tidak ditemukan")

    qty_lama = detail.qty
    qty_baru = req.qty_baru
    selisih = qty_baru - qty_lama

    if selisih == 0:
        return {"message": "Tidak ada perubahan qty"}

    if selisih > 0:
        # Qty NAIK: potong FIFO tambahan
        db.execute(
            text("SELECT id FROM produk_batch WHERE produk_id = :pid ORDER BY tanggal_masuk ASC FOR UPDATE"),
            {"pid": detail.produk_id}
        ).fetchall()
        
        stok_tersedia = db.execute(
            text("SELECT COALESCE(SUM(qty_sisa), 0) FROM produk_batch WHERE produk_id = :pid"),
            {"pid": detail.produk_id}
        ).scalar()

        if selisih > stok_tersedia:
            raise HTTPException(
                status_code=400,
                detail=f"Stok tidak cukup. Tersedia {stok_tersedia}, dibutuhkan {selisih} tambahan."
            )

        total_hpp, qty_berhasil = keluar_fifo(db, detail.produk_id, selisih)
        if qty_berhasil < selisih:
            raise HTTPException(
                status_code=400,
                detail=f"Stok tidak cukup saat pemotongan (race condition). Hanya berhasil dipotong {qty_berhasil} dari {selisih}."
            )
            
        # Hitung weighted average HPP
        harga_beli_lama_total = float(detail.harga_beli) * qty_lama
        harga_beli_baru = (harga_beli_lama_total + total_hpp) / qty_baru
        
        db.execute(
            text("UPDATE transaksi_detail SET harga_beli = :hbb WHERE id = :did"),
            {"hbb": harga_beli_baru, "did": detail_id}
        )
        
        aksi_info = f"Edit qty {qty_lama}→{qty_baru} (FIFO potong {selisih})"

    else:
        # Qty TURUN: retur selisih sebagai batch baru (PRD §16 aturan 3)
        qty_retur = abs(selisih)
        db.execute(
            text("""
                INSERT INTO produk_batch (produk_id, qty_masuk, qty_sisa, harga_beli, tanggal_masuk)
                VALUES (:pid, :qty, :qty, :hb, CURRENT_TIMESTAMP)
            """),
            {
                "pid": detail.produk_id,
                "qty": qty_retur,
                "hb": float(detail.harga_beli),  # HPP dari detail asal
            }
        )
        aksi_info = f"Edit qty {qty_lama}→{qty_baru} (Retur {qty_retur} unit ke stok)"

    # Update qty di detail
    db.execute(
        text("UPDATE transaksi_detail SET qty = :qty WHERE id = :did"),
        {"qty": qty_baru, "did": detail_id}
    )

    # Recalculate total & profit header dari semua detail terkini
    recalculate_total_profit(db, transaksi_id)

    log_action(db, user, 'EDIT_ITEM', 'transaksi', detail.trx_kode, aksi_info)

    db.commit()

    # Ambil ulang header untuk return nilai terkini
    trx = db.execute(text("SELECT total, profit FROM transaksi WHERE id = :id"), {"id": transaksi_id}).fetchone()
    return {
        "message": aksi_info,
        "total_baru": float(trx.total),
        "profit_baru": float(trx.profit),
    }
