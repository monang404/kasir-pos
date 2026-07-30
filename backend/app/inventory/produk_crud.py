
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.require_role import RequireModule
from app.auth.session import get_current_user
from app.database import get_db

router = APIRouter(prefix="/inventory/produk", tags=["inventory"])
check_inventory_access = RequireModule("inventory")

@router.get("/", dependencies=[Depends(check_inventory_access)])
def list_all_produk(db: Session = Depends(get_db)):
    query = """
        SELECT 
            p.id, p.kode, p.nama, p.ukuran, p.harga_beli, p.harga_jual,
            COALESCE(SUM(pb.qty_sisa), 0) as stok_total
        FROM produk p
        LEFT JOIN produk_batch pb ON p.id = pb.produk_id
        GROUP BY p.id, p.kode, p.nama, p.ukuran, p.harga_beli, p.harga_jual
        ORDER BY p.kode ASC
    """
    result = db.execute(text(query)).fetchall()
    
    data = []
    for r in result:
        data.append({
            "id": r.id,
            "kode": r.kode,
            "nama": r.nama,
            "ukuran": r.ukuran,
            "harga_beli": float(r.harga_beli),
            "harga_jual": float(r.harga_jual),
            "stok_total": int(r.stok_total)
        })
    return {"data": data}

class ProdukBase(BaseModel):

    kode: str = Field(..., min_length=1)
    nama: str = Field(..., min_length=1)
    ukuran: str | None = None
    harga_beli: float = Field(0, ge=0)
    harga_jual: float = Field(..., gt=0)

@router.post("/", dependencies=[Depends(check_inventory_access)])
def create_produk(
    produk: ProdukBase, 
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    kode_upper = produk.kode.strip().upper()
    
    # 1. Validasi Harga
    if produk.harga_jual < produk.harga_beli:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Harga Jual tidak boleh lebih kecil dari Harga Beli"
        )
        
    # 2. Validasi Kode Unik
    existing = db.execute(
        text("SELECT id FROM produk WHERE kode = :kode"),
        {"kode": kode_upper}
    ).fetchone()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Produk dengan kode {kode_upper} sudah ada."
        )
        
    # 3. Create
    res = db.execute(
        text("""
            INSERT INTO produk (kode, nama, ukuran, harga_beli, harga_jual)
            VALUES (:kode, :nama, :ukuran, :hb, :hj)
            RETURNING id
        """),
        {
            "kode": kode_upper,
            "nama": produk.nama.strip(),
            "ukuran": produk.ukuran,
            "hb": produk.harga_beli,
            "hj": produk.harga_jual
        }
    ).fetchone()
    
    db.execute(
        text("""
            INSERT INTO activity_log (user_id, username, role, aksi, modul, target_id, target_info)
            VALUES (:uid, :uname, :role, 'CREATE', 'produk', :kode, :info)
        """),
        {
            "uid": user["id"], "uname": user["username"], "role": user["role"],
            "kode": kode_upper, "info": f"Membuat produk {produk.nama}"
        }
    )
    
    db.commit()
    return {"message": "Produk berhasil ditambahkan", "id": res.id}

@router.put("/{produk_id}", dependencies=[Depends(check_inventory_access)])
def update_produk(
    produk_id: int,
    produk: ProdukBase, 
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    kode_upper = produk.kode.strip().upper()
    
    # Validasi eksistensi
    target = db.execute(
        text("SELECT id FROM produk WHERE id = :id"),
        {"id": produk_id}
    ).fetchone()
    
    if not target:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    
    # 1. Validasi Harga
    if produk.harga_jual < produk.harga_beli:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Harga Jual tidak boleh lebih kecil dari Harga Beli"
        )
        
    # 2. Validasi Kode Unik (kecuali ID sendiri)
    existing = db.execute(
        text("SELECT id FROM produk WHERE kode = :kode AND id != :id"),
        {"kode": kode_upper, "id": produk_id}
    ).fetchone()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Produk dengan kode {kode_upper} sudah digunakan produk lain."
        )
        
    # 3. Update
    db.execute(
        text("""
            UPDATE produk 
            SET kode = :kode, nama = :nama, ukuran = :ukuran, 
                harga_beli = :hb, harga_jual = :hj
            WHERE id = :id
        """),
        {
            "kode": kode_upper,
            "nama": produk.nama.strip(),
            "ukuran": produk.ukuran,
            "hb": produk.harga_beli,
            "hj": produk.harga_jual,
            "id": produk_id
        }
    )
    
    db.execute(
        text("""
            INSERT INTO activity_log (user_id, username, role, aksi, modul, target_id, target_info)
            VALUES (:uid, :uname, :role, 'UPDATE', 'produk', :kode, :info)
        """),
        {
            "uid": user["id"], "uname": user["username"], "role": user["role"],
            "kode": kode_upper, "info": f"Update produk {produk.nama}"
        }
    )
    
    db.commit()
    return {"message": "Produk berhasil diupdate"}
