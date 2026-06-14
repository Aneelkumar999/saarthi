import hashlib
import os
import random
import re
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import models

bearer_scheme = HTTPBearer(auto_error=False)

JWT_SECRET = os.getenv("JWT_SECRET", "saarthi-ai-dev-secret-change-in-production-2026")
JWT_REFRESH_SECRET = os.getenv("JWT_REFRESH_SECRET", "saarthi-ai-refresh-secret-change-in-production-2026")


def normalize_phone(phone: str) -> str:
    digits = re.sub(r"\D", "", phone or "")
    if len(digits) == 10:
        digits = f"91{digits}"
    if len(digits) != 12 or not digits.startswith("91"):
        raise HTTPException(status_code=422, detail="Enter a valid 10-digit Indian mobile number")
    return f"+{digits}"


def validate_email(email: str) -> str:
    email = email.strip().lower()
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        raise HTTPException(status_code=422, detail="Enter a valid email address")
    return email


def detect_channel(identifier: str) -> str:
    identifier = identifier.strip()
    if "@" in identifier:
        return "email"
    digits = re.sub(r"\D", "", identifier)
    if len(digits) >= 10:
        return "phone"
    raise HTTPException(status_code=422, detail="Enter a valid phone number or email address")


def normalize_identifier(identifier: str) -> str:
    channel = detect_channel(identifier)
    if channel == "phone":
        return normalize_phone(identifier)
    return validate_email(identifier)


def generate_otp() -> str:
    if os.getenv("AUTH_DEV_FIXED_OTP", "true").lower() == "true":
        return "123456"
    return f"{random.randint(0, 999999):06d}"


def mask_destination(identifier: str, channel: str) -> str:
    if channel == "phone":
        return f"+91****{identifier[-4:]}"
    parts = identifier.split("@")
    if len(parts[0]) <= 2:
        masked = parts[0][0] + "***"
    else:
        masked = parts[0][:2] + "***"
    return f"{masked}@{parts[1]}"


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _to_aware(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def create_access_token(user: models.User) -> str:
    expires_minutes = int(os.getenv("JWT_EXPIRES_MINUTES", "60"))
    payload = {
        "sub": user.id,
        "phone": user.phone,
        "email": user.email,
        "name": user.name,
        "role": getattr(user, "role", "citizen"),
        "type": "access",
        "exp": utc_now() + timedelta(minutes=expires_minutes),
        "iat": utc_now(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def create_refresh_token(user: models.User, db: Session) -> tuple:
    expires_days = int(os.getenv("JWT_REFRESH_EXPIRES_DAYS", "30"))
    raw_token = os.urandom(40).hex()
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    expires_at = utc_now() + timedelta(days=expires_days)

    db_token = models.RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token, raw_token


def decode_token(token: str, secret: str = JWT_SECRET) -> dict:
    try:
        return jwt.decode(token, secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    payload = decode_token(credentials.credentials)
    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    user_id = payload["sub"]
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    user = get_current_user(credentials, db)
    if getattr(user, "role", "citizen") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user
