from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timezone
from pydantic import BaseModel

from app.database import get_db
from app.auth.security import verify_password, create_access_token
from app.auth.lockout import record_failed_attempt, get_lockout_status, reset_attempts

router = APIRouter(prefix="/auth", tags=["auth"])

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    username = form_data.username.lower()
    
    # 1. Cek Lockout
    is_locked, remaining_seconds, _ = get_lockout_status(username)
    if is_locked:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Terlalu banyak percobaan gagal. Coba lagi dalam {remaining_seconds} detik."
        )

    # 2. Ambil user dari DB
    user = db.execute(
        text("SELECT id, username, password_hash, role, is_active, nama_lengkap FROM users WHERE LOWER(username) = :username"),
        {"username": username}
    ).fetchone()
    
    # 3. Verifikasi password (atau jika user tidak ada)
    if not user or not verify_password(form_data.password, user.password_hash):
        # Record failed attempt
        is_locked_now, rem_secs, rem_attempts = record_failed_attempt(username)
        if is_locked_now:
            msg = f"Percobaan login gagal. Akun dikunci selama {rem_secs} detik."
        else:
            msg = f"Username atau password salah. Sisa percobaan: {rem_attempts}"
            
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=msg,
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Akun dinonaktifkan")

    # 4. Sukses Login
    reset_attempts(username)
    
    # Update last_login
    db.execute(
        text("UPDATE users SET last_login = :now WHERE id = :id"),
        {"now": datetime.now(timezone.utc), "id": user.id}
    )
    db.commit()

    # Buat JWT token
    access_token = create_access_token(data={"sub": user.username})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "nama_lengkap": user.nama_lengkap,
            "role": user.role
        }
    }
