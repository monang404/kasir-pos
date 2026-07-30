
from fastapi import APIRouter, Depends, HTTPException
from passlib.context import CryptContext
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.require_role import RequireModule
from app.auth.session import get_current_user
from app.database import get_db

router = APIRouter(prefix="/users", tags=["users"])
check_access = RequireModule("users")

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    nama_lengkap: str = Field(..., min_length=1)
    role: str
    is_active: int = 1

    def validate_role(self):
        if self.role not in ('admin', 'kasir', 'gudang'):
            raise ValueError(f"Role tidak valid: {self.role}")


class UserUpdate(BaseModel):
    nama_lengkap: str = Field(..., min_length=1)
    password: str | None = None   # Kosong = tidak ganti password
    role: str
    is_active: int = 1

    def validate_role(self):
        if self.role not in ('admin', 'kasir', 'gudang'):
            raise ValueError(f"Role tidak valid: {self.role}")


@router.get("/", dependencies=[Depends(check_access)])
def list_users(db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT id, username, nama_lengkap, role, is_active, created_at, last_login
        FROM users
        ORDER BY id ASC
    """)).fetchall()
    return {
        "data": [
            {
                "id": r.id, "username": r.username, "nama_lengkap": r.nama_lengkap,
                "role": r.role, "is_active": r.is_active,
                "created_at": str(r.created_at) if r.created_at else None,
                "last_login": str(r.last_login) if r.last_login else None
            } for r in rows
        ]
    }


@router.post("/", dependencies=[Depends(check_access)])
def create_user(
    req: UserCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    req.validate_role()
    # Cek username unik
    existing = db.execute(
        text("SELECT id FROM users WHERE lower(username) = lower(:u)"),
        {"u": req.username}
    ).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail=f"Username '{req.username}' sudah digunakan")

    pw_hash = pwd_ctx.hash(req.password)
    result = db.execute(
        text("""
            INSERT INTO users (username, password_hash, nama_lengkap, role, is_active)
            VALUES (:u, :pw, :nama, :role, :active)
            RETURNING id
        """),
        {"u": req.username, "pw": pw_hash, "nama": req.nama_lengkap,
         "role": req.role, "active": req.is_active}
    ).fetchone()

    _log(db, current_user, "CREATE", "users", str(result.id),
         f"Buat user baru: {req.username} ({req.role})")
    db.commit()
    return {"message": "User berhasil dibuat", "id": result.id}


@router.put("/{user_id}", dependencies=[Depends(check_access)])
def update_user(
    user_id: int,
    req: UserUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    req.validate_role()
    target = db.execute(
        text("SELECT id, username FROM users WHERE id = :id"), {"id": user_id}
    ).fetchone()
    if not target:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    if req.password:
        pw_hash = pwd_ctx.hash(req.password)
        db.execute(
            text("UPDATE users SET nama_lengkap=:nama, password_hash=:pw, role=:role, is_active=:active WHERE id=:id"),
            {"nama": req.nama_lengkap, "pw": pw_hash, "role": req.role, "active": req.is_active, "id": user_id}
        )
    else:
        db.execute(
            text("UPDATE users SET nama_lengkap=:nama, role=:role, is_active=:active WHERE id=:id"),
            {"nama": req.nama_lengkap, "role": req.role, "active": req.is_active, "id": user_id}
        )

    _log(db, current_user, "UPDATE", "users", str(user_id),
         f"Update user {target.username}: role={req.role}, active={req.is_active}")
    db.commit()
    return {"message": "User berhasil diupdate"}


def _log(db: Session, actor: dict, aksi: str, modul: str, target_id: str, info: str):
    try:
        db.execute(text("""
            INSERT INTO activity_log (user_id, username, role, aksi, modul, target_id, target_info)
            VALUES (:uid, :uname, :role, :aksi, :modul, :tid, :info)
        """), {
            "uid": actor.get("id"), "uname": actor.get("username"), "role": actor.get("role"),
            "aksi": aksi, "modul": modul, "tid": target_id, "info": info
        })
    except Exception:
        pass  # best-effort log
