from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.require_role import RequireModule
from app.auth.session import get_current_user
from app.database import get_db
from app.activity_log.logger import log_action

router = APIRouter(prefix="/inventory/batch", tags=["inventory"])
check_inventory_access = RequireModule("inventory")


class TambahBatchRequest(BaseModel):
    produk_id: int
    qty: int = Field(..., gt=0)
    harga_beli: float = Field(..., ge=0)
    tanggal_masuk: datetime | None = None


@router.get("/{produk_id}", dependencies=[Depends(check_inventory_access)])
def list_batch(produk_id: int, db: Session = Depends(get_db)):
    produk = db.execute(
        text("SELECT id, kode, nama FROM produk WHERE id = :id"),
        {"id": produk_id}
    ).fetchone()

    if not produk:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")

    batches = db.execute(
        text("""
            SELECT id, qty_sisa, harga_beli, tanggal_masuk
            FROM produk_batch
            WHERE produk_id = :pid
            ORDER BY tanggal_masuk DESC
        """),
        {"pid": produk_id}
    ).fetchall()

    total_stok = sum(b.qty_sisa for b in batches)

    return {
        "produk": {"id": produk.id, "kode": produk.kode, "nama": produk.nama},
        "total_stok": total_stok,
        "total_batch": len(batches),
        "batches": [
            {
                "id": b.id,
                "qty_sisa": b.qty_sisa,
                "harga_beli": float(b.harga_beli),
                "tanggal_masuk": b.tanggal_masuk
            }
            for b in batches
        ]
    }


@router.post("/", dependencies=[Depends(check_inventory_access)])
def tambah_batch(
    req: TambahBatchRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    produk = db.execute(
        text("SELECT id, kode, nama FROM produk WHERE id = :id"),
        {"id": req.produk_id}
    ).fetchone()

    if not produk:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")

    tgl = req.tanggal_masuk or datetime.now(timezone.utc)

    result = db.execute(
        text("""
            INSERT INTO produk_batch (produk_id, qty_masuk, qty_sisa, harga_beli, tanggal_masuk)
            VALUES (:pid, :qty, :qty, :hb, :tgl)
            RETURNING id
        """),
        {"pid": req.produk_id, "qty": req.qty, "hb": req.harga_beli, "tgl": tgl}
    ).fetchone()

    log_action(db, user, 'TAMBAH_BATCH', 'inventory', str(produk.kode), f"Tambah batch {req.qty} qty @ Rp {req.harga_beli:,.0f} untuk {produk.nama}")

    db.commit()
    return {"message": "Batch berhasil ditambahkan", "batch_id": result.id}


class HapusBatchRequest(BaseModel):
    alasan: str | None = Field(None, min_length=5)

@router.delete("/{batch_id}", dependencies=[Depends(check_inventory_access)])
def hapus_batch(
    batch_id: int,
    req: HapusBatchRequest = Depends(),
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    batch = db.execute(
        text("""
            SELECT pb.id, pb.qty_sisa, pb.produk_id, pb.harga_beli,
                   p.kode, p.nama
            FROM produk_batch pb
            JOIN produk p ON p.id = pb.produk_id
            WHERE pb.id = :bid
        """),
        {"bid": batch_id}
    ).fetchone()

    if not batch:
        raise HTTPException(status_code=404, detail="Batch tidak ditemukan")

    # Audit berbeda jika batch masih memiliki sisa stok
    if batch.qty_sisa > 0:
        if not req.alasan:
            raise HTTPException(status_code=422, detail="Alasan wajib diisi jika qty_sisa > 0")
        info = (
            f"Hapus batch (stok tersisa {batch.qty_sisa} qty) "
            f"@ Rp {batch.harga_beli:,.0f} dari {batch.nama} — Alasan: {req.alasan}"
        )
    else:
        info = f"Hapus batch kosong (qty_sisa=0) dari {batch.nama}"

    db.execute(
        text("DELETE FROM produk_batch WHERE id = :bid"),
        {"bid": batch_id}
    )

    log_action(db, user, 'HAPUS_BATCH', 'inventory', str(batch.kode), info)

    db.commit()
    return {"message": "Batch berhasil dihapus", "qty_terhapus": batch.qty_sisa}
