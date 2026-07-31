from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.require_role import RequireModule
from app.auth.session import get_current_user
from app.database import get_db
from app.activity_log.logger import log_action

router = APIRouter(prefix="/users", tags=["users"])
check_access = RequireModule("users")


@router.delete("/{user_id}", dependencies=[Depends(check_access)])
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # ── Proteksi: jangan hapus diri sendiri ──
    if user_id == current_user.get("id"):
        raise HTTPException(
            status_code=400,
            detail="Tidak dapat menghapus atau menonaktifkan akun yang sedang digunakan."
        )

    target = db.execute(
        text("SELECT id, username, role FROM users WHERE id = :id"), {"id": user_id}
    ).fetchone()
    if not target:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    # ── Cek apakah pernah bertransaksi sebagai kasir ──
    has_trx = db.execute(
        text("SELECT 1 FROM transaksi WHERE kasir_id = :id LIMIT 1"), {"id": user_id}
    ).fetchone()

    if has_trx:
        # Soft-delete: set is_active = 0 untuk jaga integritas histori
        db.execute(
            text("UPDATE users SET is_active = 0 WHERE id = :id"), {"id": user_id}
        )
        action = "SOFT_DELETE"
        detail = f"User {target.username} dinonaktifkan (memiliki riwayat transaksi, tidak dihapus permanen)"
    else:
        # Hard-delete: belum pernah bertransaksi
        db.execute(text("DELETE FROM users WHERE id = :id"), {"id": user_id})
        action = "HARD_DELETE"
        detail = f"User {target.username} dihapus permanen (tidak memiliki riwayat transaksi)"

    # ── Catat ke activity_log ──
    log_action(db, current_user, action, 'users', str(user_id), detail)

    db.commit()
    return {
        "message": detail,
        "action": action
    }
