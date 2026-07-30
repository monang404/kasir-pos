
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.require_role import RequireModule
from app.database import get_db

router = APIRouter(prefix="/kasir", tags=["kasir"])

# Dependensi otorisasi, pastikan role punya akses ke modul 'kasir'
check_kasir_access = RequireModule("kasir")

@router.get("/produk", dependencies=[Depends(check_kasir_access)])
def list_produk_kasir(
    q: str | None = Query(None, description="Search query untuk nama atau kode produk"),
    db: Session = Depends(get_db)
):
    """
    Mendapatkan daftar produk dengan stok_total > 0.
    Produk yang stoknya <= 0 disembunyikan otomatis.
    """
    
    query = """
        SELECT 
            p.id, 
            p.kode, 
            p.nama, 
            p.ukuran, 
            p.harga_beli as harga_beli_referensi, 
            p.harga_jual,
            COALESCE(SUM(pb.qty_sisa), 0) as stok_total
        FROM produk p
        LEFT JOIN produk_batch pb ON p.id = pb.produk_id
        WHERE 1=1
    """
    params = {}
    
    if q:
        query += " AND (LOWER(p.nama) LIKE :q OR LOWER(p.kode) LIKE :q) "
        params["q"] = f"%{q.lower()}%"
        
    query += """
        GROUP BY p.id, p.kode, p.nama, p.ukuran, p.harga_beli, p.harga_jual
        HAVING COALESCE(SUM(pb.qty_sisa), 0) > 0
        ORDER BY p.nama ASC
    """
    
    result = db.execute(text(query), params).fetchall()
    
    produk_list = []
    for row in result:
        produk_list.append({
            "id": row.id,
            "kode": row.kode,
            "nama": row.nama,
            "ukuran": row.ukuran,
            "harga_jual": float(row.harga_jual),
            "stok_total": int(row.stok_total)
        })
        
    return {"data": produk_list}
