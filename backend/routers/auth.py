from fastapi import APIRouter, Depends, HTTPException
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from database import get_db
from models import User

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/api/auth/login")
def login(payload: dict, db: Session = Depends(get_db)):
    user_id = payload.get("id", "").strip()
    password = payload.get("password", "")

    if len(user_id) != 8:
        raise HTTPException(status_code=400, detail="user ID tidak ditemukan")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not pwd_context.verify(password, user.password_hash):
        raise HTTPException(status_code=401, detail="user ID tidak ditemukan")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Akun ini sedang dinonaktifkan.")

    return {
        "id": user.id,
        "name": user.name,
        "unit": user.unit,
        "roles": user.roles,
        "activeRole": user.active_role,
        "isActive": user.is_active,
        "phone": user.phone,
    }