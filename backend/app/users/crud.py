from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.require_role import RequireModule
from app.auth.security import hash_password
from app.auth.session import get_current_user
from app.database import get_db
from app.activity_log.logger import log_action

router = APIRouter(prefix="/users", tags=["users"])
check_access = RequireModule("users")


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    nama_lengkap: str = Field(..., min_length=1)
    role: str
    is_active: int = 1

    @field_validator('role')
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ('admin', 'kasir', 'gudang'):
            raise ValueError(f"Role tidak valid: {v}")
        return v


class UserUpdate(BaseModel):
    nama_lengkap: str = Field(..., min_length=1)
    password: str | None = None   # Kosong = tidak ganti password
    role: str
    is_active: int = 1

    @field_validator('role')
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ('admin', 'kasir', 'gudang'):
            raise ValueError(f"Role tidak valid: {v}")
        return v


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
    # Cek username unik
    existing = db.execute(
        text("SELECT id FROM users WHERE lower(username) = lower(:u)"),
        {"u": req.username}
    ).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail=f"Username '{req.username}' sudah digunakan")

    pw_hash = hash_password(req.password)
    result = db.execute(
        text("""
            INSERT INTO users (username, password_hash, nama_lengkap, role, is_active)
            VALUES (:u, :pw, :nama, :role, :active)
            RETURNING id
        """),
        {"u": req.username, "pw": pw_hash, "nama": req.nama_lengkap,
         "role": req.role, "active": req.is_active}
    ).fetchone()

    log_action(db, current_user, "CREATE", "users", str(result.id),
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
    target = db.execute(
        text("SELECT id, username FROM users WHERE id = :id"), {"id": user_id}
    ).fetchone()
    if not target:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    if req.password:
        pw_hash = hash_password(req.password)
        db.execute(
            text("UPDATE users SET nama_lengkap=:nama, password_hash=:pw, role=:role, is_active=:active, token_version=token_version+1 WHERE id=:id"),
            {"nama": req.nama_lengkap, "pw": pw_hash, "role": req.role, "active": req.is_active, "id": user_id}
        )
    else:
        db.execute(
            text("UPDATE users SET nama_lengkap=:nama, role=:role, is_active=:active, token_version=token_version+1 WHERE id=:id"),
            {"nama": req.nama_lengkap, "role": req.role, "active": req.is_active, "id": user_id}
        )

    log_action(db, current_user, "UPDATE", "users", str(user_id),
         f"Update user {target.username}: role={req.role}, active={req.is_active}")
    db.commit()
    return {"message": "User berhasil diupdate"}

