from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.require_role import RequireModule
from app.auth.session import get_current_user
from app.database import get_db

router = APIRouter(prefix="/transaksi", tags=["transaksi"])
check_access = RequireModule("transaksi")


class GantiPelangganRequest(BaseModel):
    pelanggan_id: int


@router.patch("/{transaksi_id}/pelanggan", dependencies=[Depends(check_access)])
def ganti_pelanggan(
    transaksi_id: int,
    req: GantiPelangganRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    trx = db.execute(
        text("SELECT id, kode, pelanggan_id FROM transaksi WHERE id = :id"),
        {"id": transaksi_id}
    ).fetchone()

    if not trx:
        raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan")

    pelanggan = db.execute(
        text("SELECT id, nama FROM pelanggan WHERE id = :id"),
        {"id": req.pelanggan_id}
    ).fetchone()

    if not pelanggan:
        raise HTTPException(status_code=404, detail="Pelanggan tidak ditemukan")

    # Update pelanggan_id saja — tidak trigger recalculate finansial
    # Keputusan: snapshot nama pelanggan TIDAK disimpan di header transaksi saat ini
    # (pelanggan_nama tidak ada di skema), konsisten dengan kasir_nama yang sudah ada.
    # Jika kelak dibutuhkan, perlu migrasi kolom pelanggan_nama ke tabel transaksi.
    db.execute(
        text("UPDATE transaksi SET pelanggan_id = :pid WHERE id = :tid"),
        {"pid": req.pelanggan_id, "tid": transaksi_id}
    )

    db.execute(
        text("""
            INSERT INTO activity_log (user_id, username, role, aksi, modul, target_id, target_info)
            VALUES (:uid, :uname, :role, 'EDIT', 'transaksi', :kode, :info)
        """),
        {
            "uid": user["id"], "uname": user["username"], "role": user["role"],
            "kode": trx.kode,
            "info": f"Ganti pelanggan dari ID {trx.pelanggan_id} ke {req.pelanggan_id} ({pelanggan.nama})"
        }
    )

    db.commit()
    return {
        "message": f"Pelanggan transaksi {trx.kode} berhasil diganti ke {pelanggan.nama}"
    }
