from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.require_role import RequireModule
from app.auth.session import get_current_user
from app.database import get_db
from app.activity_log.logger import log_action

router = APIRouter(prefix="/inventory/produk", tags=["inventory"])
check_inventory_access = RequireModule("inventory")

@router.delete("/{produk_id}", dependencies=[Depends(check_inventory_access)])
def delete_produk(
    produk_id: int, 
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    # 1. Cek produk eksis
    produk = db.execute(
        text("SELECT id, nama, kode FROM produk WHERE id = :id"),
        {"id": produk_id}
    ).fetchone()
    
    if not produk:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
        
    # 2. Guard: Cek apakah produk sudah ada di transaksi_detail
    transaksi = db.execute(
        text("SELECT id FROM transaksi_detail WHERE produk_id = :id LIMIT 1"),
        {"id": produk_id}
    ).fetchone()
    
    if transaksi:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Produk tidak dapat dihapus karena sudah memiliki riwayat transaksi penjualan."
        )
        
    # 3. Guard: Cek apakah produk memiliki sisa stok di batch
    batch = db.execute(
        text("SELECT id FROM produk_batch WHERE produk_id = :id AND qty_sisa > 0 LIMIT 1"),
        {"id": produk_id}
    ).fetchone()
    
    if batch:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Produk tidak dapat dihapus karena masih memiliki sisa stok di gudang."
        )

    # Lakukan hard-delete (aman karena tidak ada transaksi_detail dan tidak ada stok)
    db.execute(text("DELETE FROM produk_batch WHERE produk_id = :id"), {"id": produk_id})
    db.execute(text("DELETE FROM produk WHERE id = :id"), {"id": produk_id})
    
    # Audit log
    log_action(db, user, 'DELETE', 'produk', produk.kode, f"Menghapus produk {produk.nama} secara permanen")
    
    db.commit()
    
    return {"message": "Produk berhasil dihapus"}
