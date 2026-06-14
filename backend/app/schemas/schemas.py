from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime


# ── Auth Schemas ──────────────────────────────────────────────────────

class SendOtpRequest(BaseModel):
    identifier: str = Field(..., description="Phone number (+91XXXXXXXXXX) or email address")
    purpose: str = Field(default="login", description="login | signup | reset")

class SendOtpResponse(BaseModel):
    success: bool = True
    message: str
    channel: str
    masked_destination: str
    expires_in_seconds: int = 300
    dev_otp: Optional[str] = None

class VerifyOtpRequest(BaseModel):
    identifier: str
    otp: str = Field(..., min_length=6, max_length=6)
    purpose: str = Field(default="login")

class VerifyOtpResponse(BaseModel):
    success: bool = True
    message: str
    verified: bool = True
    token: Optional[str] = None

class SignupRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=5)
    phone_number: Optional[str] = None
    otp: str = Field(..., min_length=6, max_length=6)

class LoginOtpRequest(BaseModel):
    identifier: str = Field(..., description="Phone number or email")
    otp: str = Field(..., min_length=6, max_length=6)

class TokenResponse(BaseModel):
    success: bool = True
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 3600
    user: Optional["AuthUserResponse"] = None

class RefreshRequest(BaseModel):
    refresh_token: str

class MessageResponse(BaseModel):
    success: bool = True
    message: str

class AuthUserResponse(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str = "citizen"
    is_verified: bool = False
    avatar_url: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


# ── Intent Schemas ────────────────────────────────────────────────────
class IntentBase(BaseModel):
    name: str
    description: Optional[str] = None
    trigger_keywords: List[str] = []

class Intent(IntentBase):
    id: int
    class Config:
        from_attributes = True


# ── Service Schemas ───────────────────────────────────────────────────
class ServiceBase(BaseModel):
    name: str
    department: str
    fee: float
    sla_days: int
    description: Optional[str] = None

class Service(ServiceBase):
    id: int
    class Config:
        from_attributes = True

class WorkflowStep(BaseModel):
    service: Service
    status: str
    dependencies: List[int] = []

class ServiceCreate(BaseModel):
    name: str
    department: str
    fee: float = 0.0
    sla_days: int = 7
    description: Optional[str] = None

class ServiceResponse(BaseModel):
    id: int
    name: str
    department: str
    fee: float
    sla_days: int
    description: Optional[str] = None
    class Config:
        from_attributes = True


# ── Chat / Journey Schemas ────────────────────────────────────────────
class UserJourneyRequest(BaseModel):
    query: str

class ChatRequest(BaseModel):
    message: str
    journey_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    intent_id: Optional[int] = None
    workflow_id: Optional[str] = None
    roadmap: Optional[dict[str, Any]] = None


# ── Profile Schemas ───────────────────────────────────────────────────
class UserProfileResponse(BaseModel):
    id: int
    user_id: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    location: Optional[str] = None
    district: Optional[str] = None
    citizen_type: Optional[str] = None
    preferred_language: Optional[str] = None
    demographics: Optional[dict[str, Any]] = None
    consent_document_reuse: Optional[int] = None
    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    location: Optional[str] = None
    district: Optional[str] = None
    citizen_type: Optional[str] = None
    preferred_language: Optional[str] = None
    demographics: Optional[dict[str, Any]] = None


# ── Scheme Schemas ────────────────────────────────────────────────────
class SchemeResponse(BaseModel):
    id: int
    name: str
    benefit: Optional[str] = None
    eligibility_rules: Optional[dict[str, Any]] = None
    description: Optional[str] = None
    category: Optional[str] = None
    fit_score: Optional[str] = None
    class Config:
        from_attributes = True


# ── Dashboard Schemas ─────────────────────────────────────────────────
class DashboardStats(BaseModel):
    active_journeys: int
    completed_steps: int
    total_steps: int
    uploaded_documents: int
    eligible_schemes: int
    days_saved: int
    recent_activities: list[dict[str, Any]]
