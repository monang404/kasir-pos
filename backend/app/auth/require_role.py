
from fastapi import Depends, HTTPException

from app.auth.access_matrix import has_access
from app.auth.session import get_current_user


class RequireRole:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = [r.lower() for r in allowed_roles]

    def __call__(self, user: dict = Depends(get_current_user)):
        if user["role"].lower() not in self.allowed_roles:
            raise HTTPException(status_code=403, detail="Akses ditolak: role tidak sesuai")
        return user

class RequireModule:
    """Dependency untuk mengecek apakah role user memiliki akses ke modul tertentu"""
    def __init__(self, module: str):
        self.module = module
        
    def __call__(self, user: dict = Depends(get_current_user)):
        if not has_access(user["role"], self.module):
            raise HTTPException(status_code=403, detail=f"Akses ditolak ke modul {self.module}")
        return user
