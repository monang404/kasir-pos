import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Union
from jose import jwt
import os

SECRET_KEY = os.environ.get("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = "HS256"
SESSION_TIMEOUT_MINUTES = int(os.environ.get("SESSION_TIMEOUT", "60"))

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifikasi password dengan format salt:hex_digest (PBKDF2 310k iterasi)"""
    try:
        salt, stored_hash = hashed_password.split(":")
        digest = hashlib.pbkdf2_hmac(
            "sha256", 
            plain_password.encode(), 
            bytes.fromhex(salt), 
            310_000
        )
        return secrets.compare_digest(digest.hex(), stored_hash)
    except Exception:
        return False

def hash_password(password: str) -> str:
    """Hash password setara PBKDF2 310k iterasi untuk kompatibilitas data"""
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", 
        password.encode(), 
        bytes.fromhex(salt), 
        310_000
    )
    return f"{salt}:{digest.hex()}"

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    if SESSION_TIMEOUT_MINUTES > 0:
        expire = datetime.now(timezone.utc) + timedelta(minutes=SESSION_TIMEOUT_MINUTES)
        to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
