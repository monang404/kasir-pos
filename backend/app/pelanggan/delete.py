from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.require_role import RequireModule
from app.auth.session import get_current_user
from app.database import get_db
from app.activity_log.logger import log_action

router = APIRouter(prefix="/pelanggan", tags=["pelanggan"])
check_access = RequireModule("pelanggan")


@router.delete("/{pelanggan_id}", dependencies=[Depends(check_access)])
def delete_pelanggan(
    pelanggan_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    pelanggan = db.execute(
        text("SELECT id, nama FROM pelanggan WHERE id = :id"),
        {"id": pelanggan_id}
    ).fetchone()

    if not pelanggan:
        raise HTTPException(status_code=404, detail="Pelanggan tidak ditemukan")

    # Guard: blokir jika ada riwayat transaksi (TANPA jalur bypass)
    trx_count = db.execute(
        text("SELECT COUNT(*) FROM transaksi WHERE pelanggan_id = :id"),
        {"id": pelanggan_id}
    ).scalar()

    if trx_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Pelanggan '{pelanggan.nama}' tidak dapat dihapus karena memiliki "
                f"{trx_count} riwayat transaksi. Hapus semua transaksinya terlebih dahulu."
            )
        )

    db.execute(text("DELETE FROM pelanggan WHERE id = :id"), {"id": pelanggan_id})

    log_action(db, user, 'DELETE', 'pelanggan', pelanggan.nama, f"Hapus pelanggan {pelanggan.nama} (tidak ada transaksi)")

    db.commit()
    return {"message": f"Pelanggan '{pelanggan.nama}' berhasil dihapus"}
