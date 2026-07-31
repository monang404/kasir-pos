
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.require_role import RequireModule
from app.auth.session import get_current_user
from app.database import get_db
from app.activity_log.logger import log_action

router = APIRouter(prefix="/pelanggan", tags=["pelanggan"])
check_access = RequireModule("pelanggan")


class PelangganBase(BaseModel):
    nama: str = Field(..., min_length=1)
    no_hp: str | None = None
    alamat: str | None = None
    keterangan: str | None = None


@router.get("/", dependencies=[Depends(check_access)])
def list_pelanggan(
    q: str | None = None,
    db: Session = Depends(get_db)
):
    query = "SELECT id, nama, no_hp, alamat, keterangan FROM pelanggan"
    params = {}
    if q:
        query += " WHERE nama LIKE :q OR no_hp LIKE :q"
        params["q"] = f"%{q}%"
    query += " ORDER BY nama ASC"

    rows = db.execute(text(query), params).fetchall()
    return {
        "data": [
            {"id": r.id, "nama": r.nama, "no_hp": r.no_hp, "alamat": r.alamat, "keterangan": r.keterangan}
            for r in rows
        ]
    }


@router.post("/", dependencies=[Depends(check_access)])
def create_pelanggan(
    pelanggan: PelangganBase,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    no_hp = (pelanggan.no_hp or "").strip()

    # Validasi no HP unik (jika diisi)
    if no_hp:
        existing = db.execute(
            text("SELECT id FROM pelanggan WHERE no_hp = :hp AND no_hp != ''"),
            {"hp": no_hp}
        ).fetchone()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No HP {no_hp} sudah digunakan pelanggan lain."
            )

    result = db.execute(
        text("""
            INSERT INTO pelanggan (nama, no_hp, alamat, keterangan)
            VALUES (:nama, :hp, :alamat, :keterangan)
            RETURNING id
        """),
        {
            "nama": pelanggan.nama.strip(),
            "hp": no_hp or None,
            "alamat": pelanggan.alamat,
            "keterangan": pelanggan.keterangan
        }
    ).fetchone()

    log_action(db, user, 'CREATE', 'pelanggan', pelanggan.nama, f"Tambah pelanggan {pelanggan.nama}")

    db.commit()
    return {"message": "Pelanggan berhasil ditambahkan", "id": result.id}


@router.put("/{pelanggan_id}", dependencies=[Depends(check_access)])
def update_pelanggan(
    pelanggan_id: int,
    pelanggan: PelangganBase,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    target = db.execute(
        text("SELECT id FROM pelanggan WHERE id = :id"),
        {"id": pelanggan_id}
    ).fetchone()

    if not target:
        raise HTTPException(status_code=404, detail="Pelanggan tidak ditemukan")

    no_hp = (pelanggan.no_hp or "").strip()

    # Validasi no HP unik (kecuali diri sendiri)
    if no_hp:
        existing = db.execute(
            text("SELECT id FROM pelanggan WHERE no_hp = :hp AND no_hp != '' AND id != :id"),
            {"hp": no_hp, "id": pelanggan_id}
        ).fetchone()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No HP {no_hp} sudah digunakan pelanggan lain."
            )

    db.execute(
        text("""
            UPDATE pelanggan SET nama = :nama, no_hp = :hp, alamat = :alamat, keterangan = :keterangan
            WHERE id = :id
        """),
        {
            "nama": pelanggan.nama.strip(),
            "hp": no_hp or None,
            "alamat": pelanggan.alamat,
            "keterangan": pelanggan.keterangan,
            "id": pelanggan_id
        }
    )

    log_action(db, user, 'UPDATE', 'pelanggan', pelanggan.nama, f"Update pelanggan {pelanggan.nama}")

    db.commit()
    return {"message": "Pelanggan berhasil diupdate"}
