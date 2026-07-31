from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.require_role import RequireModule
from app.auth.session import get_current_user
from app.database import get_db
from app.inventory.fifo_service import keluar_fifo, tambah_stok
from app.activity_log.logger import log_action

router = APIRouter(prefix="/inventory/adjustment", tags=["inventory"])
check_inventory_access = RequireModule("inventory")

class AdjustmentRequest(BaseModel):
    produk_id: int
    tipe: Literal['+', '-']
    qty: int = Field(..., gt=0, description="Jumlah yang disesuaikan (harus > 0)")
    alasan: str = Field(..., min_length=5, description="Alasan wajib diisi minimal 5 karakter")

@router.post("/", dependencies=[Depends(check_inventory_access)])
def stock_adjustment(
    req: AdjustmentRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    # Cek produk eksis dan ambil info referensi
    produk = db.execute(
        text("SELECT id, kode, nama, harga_beli FROM produk WHERE id = :pid"),
        {"pid": req.produk_id}
    ).fetchone()
    
    if not produk:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
        
    alasan_bersih = req.alasan.strip()
    
    if req.tipe == '+':
        # Tambah membuat batch baru
        # Sesuai spec: harga_beli default mengambil dari referensi produk
        tambah_stok(db, produk.id, req.qty, float(produk.harga_beli))
        info_audit = f"Penyesuaian (+) {req.qty} qty. Alasan: {alasan_bersih}"
    
    elif req.tipe == '-':
        # Lock row produk_batch
        db.execute(
            text("SELECT id FROM produk_batch WHERE produk_id = :pid ORDER BY tanggal_masuk ASC FOR UPDATE"),
            {"pid": produk.id}
        ).fetchall()
        
        # Validasi stok dulu
        stok_total = db.execute(
            text("SELECT COALESCE(SUM(qty_sisa), 0) FROM produk_batch WHERE produk_id = :pid"),
            {"pid": produk.id}
        ).scalar()
        
        if req.qty > stok_total:
            raise HTTPException(
                status_code=400,
                detail=f"Gagal: Stok tersedia ({stok_total}) tidak cukup untuk dikurangi {req.qty}"
            )
            
        # Kurangi pakai FIFO
        total_hpp, qty_berhasil = keluar_fifo(db, produk.id, req.qty)
        if qty_berhasil < req.qty:
            raise HTTPException(
                status_code=400,
                detail=f"Gagal: Stok tidak cukup saat pemotongan (race condition). Hanya berhasil dipotong {qty_berhasil} dari {req.qty}."
            )
        info_audit = f"Penyesuaian (-) {req.qty} qty. Alasan: {alasan_bersih}"
    
    # Catat ke activity log
    log_action(db, user, 'ADJUSTMENT', 'inventory', produk.kode, info_audit)
    
    db.commit()
    return {"message": "Stock adjustment berhasil dilakukan", "info": info_audit}
