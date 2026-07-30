from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, validator
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.require_role import RequireModule
from app.auth.session import get_current_user
from app.database import get_db

router = APIRouter(prefix="/pengeluaran", tags=["pengeluaran"])
check_access = RequireModule("pengeluaran")

KATEGORI_ALLOWED = [
    'Operasional', 
    'Gaji Karyawan', 
    'Sewa Tempat', 
    'Listrik & Air', 
    'Transport', 
    'Pembelian Peralatan', 
    'Promosi & Iklan', 
    'Lainnya'
]

class PengeluaranBase(BaseModel):
    tanggal: date
    kategori: str
    keterangan: str | None = None
    jumlah: float = Field(..., gt=0)

    @validator('kategori')
    def validate_kategori(cls, v):
        if v not in KATEGORI_ALLOWED:
            raise ValueError(f"Kategori '{v}' tidak valid. Pilih salah satu: {', '.join(KATEGORI_ALLOWED)}")
        return v

@router.get("/", dependencies=[Depends(check_access)])
def list_pengeluaran(
    bulan: str | None = Query(None, description="Format YYYY-MM"),
    kategori: str | None = Query(None),
    q: str | None = Query(None, description="Search kategori / keterangan"),
    db: Session = Depends(get_db)
):
    conditions = []
    params = {}

    if bulan:
        conditions.append("strftime('%Y-%m', tanggal) = :bulan")
        params["bulan"] = bulan
    if kategori:
        conditions.append("kategori = :kategori")
        params["kategori"] = kategori
    if q:
        conditions.append("(kategori LIKE :q OR keterangan LIKE :q)")
        params["q"] = f"%{q}%"

    where = "WHERE " + " AND ".join(conditions) if conditions else ""

    # Stats: total dan jumlah item
    stat_query = f"SELECT COUNT(*), COALESCE(SUM(jumlah), 0) FROM pengeluaran {where}"
    count, total = db.execute(text(stat_query), params).fetchone()

    # List data
    query = f"""
        SELECT id, tanggal, kategori, keterangan, jumlah 
        FROM pengeluaran 
        {where}
        ORDER BY tanggal DESC, id DESC
    """
    rows = db.execute(text(query), params).fetchall()

    return {
        "stats": {
            "jumlah_item": count,
            "total": float(total)
        },
        "data": [
            {
                "id": r.id, 
                "tanggal": str(r.tanggal), 
                "kategori": r.kategori, 
                "keterangan": r.keterangan, 
                "jumlah": float(r.jumlah)
            }
            for r in rows
        ]
    }


@router.post("/", dependencies=[Depends(check_access)])
def create_pengeluaran(
    req: PengeluaranBase,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    result = db.execute(
        text("""
            INSERT INTO pengeluaran (tanggal, kategori, keterangan, jumlah)
            VALUES (:tgl, :kat, :ket, :jumlah)
            RETURNING id
        """),
        {
            "tgl": req.tanggal,
            "kat": req.kategori,
            "ket": req.keterangan,
            "jumlah": req.jumlah
        }
    ).fetchone()

    db.execute(
        text("""
            INSERT INTO activity_log (user_id, username, role, aksi, modul, target_id, target_info)
            VALUES (:uid, :uname, :role, 'CREATE', 'pengeluaran', :kat, :info)
        """),
        {
            "uid": user["id"], "uname": user["username"], "role": user["role"],
            "kat": req.kategori,
            "info": f"Tambah pengeluaran {req.kategori} Rp {req.jumlah:,.0f}"
        }
    )

    db.commit()
    return {"message": "Pengeluaran berhasil ditambahkan", "id": result.id}


@router.put("/{pengeluaran_id}", dependencies=[Depends(check_access)])
def update_pengeluaran(
    pengeluaran_id: int,
    req: PengeluaranBase,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    target = db.execute(text("SELECT id FROM pengeluaran WHERE id = :id"), {"id": pengeluaran_id}).fetchone()
    if not target:
        raise HTTPException(status_code=404, detail="Pengeluaran tidak ditemukan")

    db.execute(
        text("""
            UPDATE pengeluaran 
            SET tanggal = :tgl, kategori = :kat, keterangan = :ket, jumlah = :jumlah
            WHERE id = :id
        """),
        {
            "tgl": req.tanggal,
            "kat": req.kategori,
            "ket": req.keterangan,
            "jumlah": req.jumlah,
            "id": pengeluaran_id
        }
    )

    db.execute(
        text("""
            INSERT INTO activity_log (user_id, username, role, aksi, modul, target_id, target_info)
            VALUES (:uid, :uname, :role, 'UPDATE', 'pengeluaran', :kat, :info)
        """),
        {
            "uid": user["id"], "uname": user["username"], "role": user["role"],
            "kat": req.kategori,
            "info": f"Update pengeluaran {req.kategori} menjadi Rp {req.jumlah:,.0f}"
        }
    )

    db.commit()
    return {"message": "Pengeluaran berhasil diupdate"}


@router.delete("/{pengeluaran_id}", dependencies=[Depends(check_access)])
def delete_pengeluaran(
    pengeluaran_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    target = db.execute(text("SELECT kategori, jumlah FROM pengeluaran WHERE id = :id"), {"id": pengeluaran_id}).fetchone()
    if not target:
        raise HTTPException(status_code=404, detail="Pengeluaran tidak ditemukan")

    db.execute(text("DELETE FROM pengeluaran WHERE id = :id"), {"id": pengeluaran_id})

    db.execute(
        text("""
            INSERT INTO activity_log (user_id, username, role, aksi, modul, target_id, target_info)
            VALUES (:uid, :uname, :role, 'DELETE', 'pengeluaran', :kat, :info)
        """),
        {
            "uid": user["id"], "uname": user["username"], "role": user["role"],
            "kat": target.kategori,
            "info": f"Hapus pengeluaran {target.kategori} sejumlah Rp {target.jumlah:,.0f}"
        }
    )

    db.commit()
    return {"message": "Pengeluaran berhasil dihapus"}
