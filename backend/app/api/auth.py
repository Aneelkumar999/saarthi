import hashlib
import json
import os
from datetime import timedelta
from urllib.request import urlopen

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.email_service import send_otp_email
from app.services.sms_service import send_otp_sms
from app.core.security import (
    create_access_token, create_refresh_token,
    detect_channel, generate_otp, get_current_user, get_current_admin,
    normalize_identifier, normalize_phone, validate_email,
    utc_now, _to_aware, mask_destination,
)
from app.models import models
from app.schemas.schemas import (
    SendOtpRequest, SendOtpResponse, VerifyOtpRequest, VerifyOtpResponse,
    SignupRequest, LoginOtpRequest, RefreshRequest,
    TokenResponse, MessageResponse, AuthUserResponse,
)

router = APIRouter()


# ── Helpers ───────────────────────────────────────────────────────────

def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _get_user_agent(request: Request) -> str:
    return request.headers.get("user-agent", "unknown")[:500]


def _find_user_by_identifier(db: Session, identifier: str) -> models.User | None:
    channel = detect_channel(identifier)
    if channel == "email":
        email = validate_email(identifier)
        return db.query(models.User).filter(models.User.email == email).first()
    else:
        phone = normalize_phone(identifier)
        return db.query(models.User).filter(models.User.phone == phone).first()


def _send_otp_logic(db: Session, identifier: str, purpose: str, ip_address: str, user_agent: str) -> dict:
    channel = detect_channel(identifier)
    normalized = normalize_identifier(identifier)

    recent_otp = db.query(models.OtpCode).filter(
        models.OtpCode.recipient == normalized,
        models.OtpCode.verified == False,
        models.OtpCode.consumed_at.is_(None),
    ).order_by(models.OtpCode.created_at.desc()).first()

    if recent_otp:
        time_diff = utc_now() - _to_aware(recent_otp.created_at)
        if time_diff.total_seconds() < 30:
            remaining = 30 - int(time_diff.total_seconds())
            raise HTTPException(
                status_code=429,
                detail=f"Please wait {remaining} seconds before requesting a new OTP"
            )

    otp = generate_otp()
    expiry_minutes = int(os.getenv("OTP_EXPIRES_MINUTES", "5"))

    db.query(models.OtpCode).filter(
        models.OtpCode.recipient == normalized,
        models.OtpCode.verified == False,
        models.OtpCode.consumed_at.is_(None),
    ).update({"consumed_at": utc_now()})

    db.add(models.OtpCode(
        channel=channel,
        recipient=normalized,
        otp_code=otp,
        purpose=purpose,
        expires_at=utc_now() + timedelta(minutes=expiry_minutes),
        ip_address=ip_address,
        user_agent=user_agent,
    ))
    db.commit()

    if channel == "email":
        send_otp_email(normalized, otp, purpose)
    elif channel == "phone":
        send_otp_sms(normalized, otp)

    dev_mode = os.getenv("AUTH_DEV_MODE", "true").lower() == "true"
    masked = mask_destination(normalized, channel)

    return {
        "channel": channel,
        "masked_destination": masked,
        "expires_in_seconds": expiry_minutes * 60,
        "dev_otp": otp if dev_mode else None,
    }


def _verify_otp_logic(db: Session, identifier: str, otp: str, purpose: str) -> models.OtpCode:
    normalized = normalize_identifier(identifier)
    channel = detect_channel(identifier)

    max_attempts = int(os.getenv("OTP_MAX_ATTEMPTS", "5"))
    otp_record = db.query(models.OtpCode).filter(
        models.OtpCode.recipient == normalized,
        models.OtpCode.channel == channel,
        models.OtpCode.purpose == purpose,
        models.OtpCode.verified == False,
    ).order_by(models.OtpCode.created_at.desc()).first()

    if not otp_record:
        raise HTTPException(status_code=400, detail="No active OTP found. Request a new one.")

    if _to_aware(otp_record.expires_at) < utc_now():
        otp_record.consumed_at = utc_now()
        db.commit()
        raise HTTPException(status_code=400, detail="OTP expired. Request a new one.")

    if otp_record.attempts >= max_attempts:
        otp_record.consumed_at = utc_now()
        db.commit()
        raise HTTPException(status_code=429, detail="Too many OTP attempts. Request a new one.")

    if otp_record.otp_code != otp.strip():
        otp_record.attempts += 1
        db.commit()
        remaining = max_attempts - otp_record.attempts
        raise HTTPException(status_code=400, detail=f"Invalid OTP. {remaining} attempts remaining.")

    otp_record.verified = True
    otp_record.consumed_at = utc_now()
    db.commit()
    return otp_record



def _create_tokens(user: models.User, db: Session) -> dict:
    access = create_access_token(user)
    _, raw_refresh = create_refresh_token(user, db)
    expires_minutes = int(os.getenv("JWT_EXPIRES_MINUTES", "60"))
    return {
        "access_token": access,
        "refresh_token": raw_refresh,
        "token_type": "bearer",
        "expires_in": expires_minutes * 60,
        "user": AuthUserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            phone=user.phone,
            role=getattr(user, "role", "citizen"),
            is_verified=user.is_verified,
            avatar_url=user.avatar_url,
            created_at=user.created_at.isoformat() if user.created_at else None,
        ).model_dump(),
    }


def _upsert_user(db: Session, phone: str = None, email: str = None, name: str = None) -> models.User:
    user = None
    if phone:
        user = db.query(models.User).filter(models.User.phone == phone).first()
    if not user and email:
        user = db.query(models.User).filter(models.User.email == email).first()

    if user:
        if name and not user.name:
            user.name = name
        if phone and not user.phone:
            user.phone = phone
        if email and not user.email:
            user.email = email
        if not user.is_verified:
            user.is_verified = True
        db.commit()
        db.refresh(user)
        return user

    user = models.User(
        name=name or "Citizen",
        phone=phone,
        email=email,
        is_verified=True,
    )
    db.add(user)
    db.flush()

    db.add(models.UserProfile(
        user_id=user.id,
        full_name=name or "Citizen",
        phone=phone,
        email=email,
    ))
    db.commit()
    db.refresh(user)
    return user


def _create_session(db: Session, user: models.User, ip: str, ua: str, channel: str, identifier: str):
    session_days = int(os.getenv("SESSION_EXPIRES_DAYS", "30"))
    db.add(models.UserSession(
        user_id=user.id,
        ip_address=ip,
        user_agent=ua,
        login_channel=channel,
        login_identifier=identifier,
        expires_at=utc_now() + timedelta(days=session_days),
    ))
    user.last_login_at = utc_now()
    user.last_login_ip = ip
    db.commit()


# ── Send OTP ──────────────────────────────────────────────────────────

@router.post("/send-otp", response_model=SendOtpResponse)
def send_otp(request: SendOtpRequest, http_request: Request, db: Session = Depends(get_db)):
    result = _send_otp_logic(
        db, request.identifier, request.purpose,
        _get_client_ip(http_request), _get_user_agent(http_request),
    )
    return SendOtpResponse(
        message=f"OTP sent to your {result['channel']}",
        **result,
    )


# ── Verify OTP ────────────────────────────────────────────────────────

@router.post("/verify-otp", response_model=VerifyOtpResponse)
def verify_otp(request: VerifyOtpRequest, db: Session = Depends(get_db)):
    otp = (request.otp or "").strip()
    if len(otp) != 6 or not otp.isdigit():
        raise HTTPException(status_code=422, detail="Enter the 6-digit OTP")

    _verify_otp_logic(db, request.identifier, otp, request.purpose)

    channel = detect_channel(request.identifier)
    normalized = normalize_identifier(request.identifier)

    user = None
    if channel == "email":
        user = db.query(models.User).filter(models.User.email == normalized).first()
    else:
        user = db.query(models.User).filter(models.User.phone == normalized).first()

    token = None
    if user:
        token = create_access_token(user)

    return VerifyOtpResponse(
        message="OTP verified successfully",
        verified=True,
        token=token,
    )


# ── Sign Up ───────────────────────────────────────────────────────────

@router.post("/signup", response_model=TokenResponse)
def signup(request: SignupRequest, http_request: Request, db: Session = Depends(get_db)):
    email = validate_email(request.email)

    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=409, detail="Email already registered")

    phone = None
    if request.phone_number:
        phone = normalize_phone(request.phone_number)
        if db.query(models.User).filter(models.User.phone == phone).first():
            raise HTTPException(status_code=409, detail="Phone number already registered")

    _verify_otp_logic(db, email, request.otp, "signup")

    user = models.User(
        name=request.name,
        email=email,
        phone=phone,
        is_verified=True,
    )
    db.add(user)
    db.flush()

    db.add(models.UserProfile(
        user_id=user.id,
        full_name=request.name,
        phone=phone,
        email=email,
    ))
    db.commit()
    db.refresh(user)

    _create_session(db, user, _get_client_ip(http_request), _get_user_agent(http_request), "email", email)

    return TokenResponse(**_create_tokens(user, db))


# ── Login (OTP via Phone or Email) ────────────────────────────────────

@router.post("/login-otp", response_model=TokenResponse)
def login_otp(request: LoginOtpRequest, http_request: Request, db: Session = Depends(get_db)):
    otp = (request.otp or "").strip()
    if len(otp) != 6 or not otp.isdigit():
        raise HTTPException(status_code=422, detail="Enter the 6-digit OTP")

    channel = detect_channel(request.identifier)
    normalized = normalize_identifier(request.identifier)

    _verify_otp_logic(db, request.identifier, otp, "login")

    user = _upsert_user(db,
        phone=normalized if channel == "phone" else None,
        email=normalized if channel == "email" else None,
    )

    _create_session(db, user, _get_client_ip(http_request), _get_user_agent(http_request), channel, normalized)

    return TokenResponse(**_create_tokens(user, db))


# ── Refresh Token ─────────────────────────────────────────────────────

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(request: RefreshRequest, http_request: Request, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(request.refresh_token.encode()).hexdigest()
    db_token = db.query(models.RefreshToken).filter(
        models.RefreshToken.token_hash == token_hash,
        models.RefreshToken.revoked == False,
    ).first()

    if not db_token:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if _to_aware(db_token.expires_at) < utc_now():
        db_token.revoked = True
        db.commit()
        raise HTTPException(status_code=401, detail="Refresh token expired")

    user = db.query(models.User).filter(models.User.id == db_token.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    db_token.revoked = True
    db.commit()

    return TokenResponse(**_create_tokens(user, db))


# ── Logout ────────────────────────────────────────────────────────────

@router.post("/logout", response_model=MessageResponse)
def logout(request: RefreshRequest, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(request.refresh_token.encode()).hexdigest()
    db.query(models.RefreshToken).filter(
        models.RefreshToken.token_hash == token_hash,
    ).update({"revoked": True})
    db.commit()
    return MessageResponse(message="Logged out successfully")


# ── Me (current user) ────────────────────────────────────────────────

@router.get("/me", response_model=AuthUserResponse)
def me(current_user: models.User = Depends(get_current_user)):
    return AuthUserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        role=getattr(current_user, "role", "citizen"),
        is_verified=current_user.is_verified,
        avatar_url=current_user.avatar_url,
        created_at=current_user.created_at.isoformat() if current_user.created_at else None,
    )


# ── Firebase Phone Auth ─────────────────────────────────────────────

_FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "saarthi-ai-bcc29")
_google_keys_cache: dict = {}
_google_keys_fetched_at: float = 0


def _get_google_public_keys() -> dict:
    global _google_keys_cache, _google_keys_fetched_at
    import time
    now = time.time()
    if _google_keys_cache and (now - _google_keys_fetched_at) < 3600:
        return _google_keys_cache
    url = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
    try:
        with urlopen(url, timeout=10) as resp:
            _google_keys_cache = json.loads(resp.read())
            _google_keys_fetched_at = now
            return _google_keys_cache
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Unable to fetch Firebase public keys: {exc}")


def _verify_firebase_token(id_token: str) -> dict:
    import jwt as pyjwt

    unverified = pyjwt.decode(id_token, options={"verify_signature": False})
    kid = unverified.get("kid")
    if not kid:
        raise HTTPException(status_code=401, detail="Invalid Firebase token: missing kid")

    keys = _get_google_public_keys()
    if kid not in keys:
        raise HTTPException(status_code=401, detail="Invalid Firebase token: unknown key")

    from cryptography.x509 import load_pem_x509_certificate
    cert = load_pem_x509_certificate(keys[kid].encode())
    public_key = cert.public_key()

    from cryptography.hazmat.primitives.asymmetric import padding
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.backends import default_backend

    try:
        payload = pyjwt.decode(
            id_token,
            public_key,
            algorithms=["RS256"],
            audience=_FIREBASE_PROJECT_ID,
            issuer=f"https://securetoken.google.com/{_FIREBASE_PROJECT_ID}",
        )
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Firebase token expired")
    except pyjwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid Firebase token: {exc}")

    return payload


class FirebaseLoginRequest(BaseModel):
    id_token: str
    name: str | None = None


@router.post("/firebase-login", response_model=TokenResponse)
def firebase_login(request: FirebaseLoginRequest, http_request: Request, db: Session = Depends(get_db)):
    payload = _verify_firebase_token(request.id_token)

    uid = payload.get("sub")
    phone = payload.get("phone_number")
    firebase_email = payload.get("email")

    if not uid:
        raise HTTPException(status_code=401, detail="Firebase token missing user ID")

    user = None
    if phone:
        user = db.query(models.User).filter(models.User.phone == phone).first()
    if not user and firebase_email:
        user = db.query(models.User).filter(models.User.email == firebase_email).first()
    if not user:
        user = db.query(models.User).filter(
            models.User.demographics.isnot(None),
            models.User.name == "Firebase Citizen",
        ).first() if not phone and not firebase_email else None

    if user:
        if phone and not user.phone:
            user.phone = phone
        if firebase_email and not user.email:
            user.email = firebase_email
        if request.name and not user.name:
            user.name = request.name
        user.is_verified = True
    else:
        display_name = request.name or "Citizen"
        if phone:
            display_name = request.name or f"User {phone[-4:]}"
        if firebase_email:
            display_name = request.name or firebase_email.split("@")[0]

        user = models.User(
            phone=phone,
            email=firebase_email,
            name=display_name,
            is_verified=True,
        )
        db.add(user)
        db.flush()

        db.add(models.UserProfile(
            user_id=user.id,
            full_name=display_name,
            phone=phone,
            email=firebase_email,
        ))

    db.commit()
    db.refresh(user)

    _create_session(db, user, _get_client_ip(http_request), _get_user_agent(http_request), "phone", phone or "")

    return TokenResponse(**_create_tokens(user, db))


# ── Admin Management ─────────────────────────────────────────────────

class PromoteUserRequest(BaseModel):
    email: str

class RoleUpdateResponse(BaseModel):
    success: bool = True
    message: str
    user_id: str
    role: str


@router.get("/admin/users")
def list_users(
    search: str = "",
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(models.User)
    if search:
        like = f"%{search}%"
        query = query.filter(
            (models.User.email.ilike(like)) |
            (models.User.name.ilike(like)) |
            (models.User.phone.ilike(like))
        )
    users = query.order_by(models.User.created_at.desc()).limit(100).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "role": getattr(u, "role", "citizen"),
            "is_verified": u.is_verified,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
        }
        for u in users
    ]


@router.post("/admin/promote", response_model=RoleUpdateResponse)
def promote_user(
    request: PromoteUserRequest,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found with this email")
    user.role = "admin"
    db.commit()
    return RoleUpdateResponse(
        message=f"{user.name or user.email} promoted to admin",
        user_id=user.id,
        role="admin",
    )


@router.post("/admin/demote", response_model=RoleUpdateResponse)
def demote_user(
    request: PromoteUserRequest,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found with this email")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot demote yourself")
    user.role = "citizen"
    db.commit()
    return RoleUpdateResponse(
        message=f"{user.name or user.email} demoted to citizen",
        user_id=user.id,
        role="citizen",
    )
