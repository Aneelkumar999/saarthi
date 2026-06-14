import uuid
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, ForeignKey, TIMESTAMP, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


def gen_uuid():
    return uuid.uuid4().hex


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False, default="")
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, unique=True, index=True, nullable=True)
    role = Column(String, default="citizen", nullable=False)
    is_verified = Column(Boolean, default=False)
    avatar_url = Column(String, nullable=True)
    demographics = Column(JSON)
    last_login_at = Column(TIMESTAMP(timezone=True), nullable=True)
    last_login_ip = Column(String, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    profile = relationship("UserProfile", back_populates="user", uselist=False)
    journeys = relationship("UserJourney", back_populates="user")
    documents = relationship("UserDocument", back_populates="user")
    sessions = relationship("UserSession", back_populates="user")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    token_hash = Column(String, nullable=False, index=True)
    expires_at = Column(TIMESTAMP(timezone=True), nullable=False)
    revoked = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class OtpCode(Base):
    __tablename__ = "otp_codes"
    id = Column(String, primary_key=True, default=gen_uuid)
    channel = Column(String, nullable=False, default="phone")
    recipient = Column(String, nullable=False, index=True)
    otp_code = Column(String, nullable=False)
    purpose = Column(String, nullable=False, default="login")
    expires_at = Column(TIMESTAMP(timezone=True), nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    verified = Column(Boolean, default=False)
    consumed_at = Column(TIMESTAMP(timezone=True), nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class UserSession(Base):
    __tablename__ = "user_sessions"
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    login_channel = Column(String, nullable=True)
    login_identifier = Column(String, nullable=True)
    expires_at = Column(TIMESTAMP(timezone=True), nullable=False)
    revoked = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="sessions")


class Intent(Base):
    __tablename__ = "intents"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    trigger_keywords = Column(JSON)
    roadmap_template = Column(JSON, nullable=True)

    services = relationship("IntentService", back_populates="intent")


class Service(Base):
    __tablename__ = "services"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    department = Column(String)
    fee = Column(Float)
    sla_days = Column(Integer)
    description = Column(Text)


class ServiceDependency(Base):
    __tablename__ = "service_dependencies"
    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id"))
    requires_service_id = Column(Integer, ForeignKey("services.id"))


class IntentService(Base):
    __tablename__ = "intent_services"
    id = Column(Integer, primary_key=True, index=True)
    intent_id = Column(Integer, ForeignKey("intents.id"))
    service_id = Column(Integer, ForeignKey("services.id"))
    step_order = Column(Integer, nullable=False)

    intent = relationship("Intent", back_populates="services")
    service = relationship("Service")


class UserJourney(Base):
    __tablename__ = "user_journeys"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    intent_id = Column(Integer, ForeignKey("intents.id"))
    status = Column(String, default="active")
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="journeys")


class JourneyStep(Base):
    __tablename__ = "journey_steps"
    id = Column(Integer, primary_key=True, index=True)
    journey_id = Column(Integer, ForeignKey("user_journeys.id"))
    service_id = Column(Integer, ForeignKey("services.id"))
    status = Column(String, default="pending")
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())


class Scheme(Base):
    __tablename__ = "schemes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    eligibility_rules = Column(JSON)
    description = Column(Text)


class UserProfile(Base):
    __tablename__ = "user_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True)
    full_name = Column(String)
    phone = Column(String)
    email = Column(String, nullable=True)
    location = Column(String, default="Telangana")
    district = Column(String, default="Hyderabad")
    citizen_type = Column(String, default="general")
    preferred_language = Column(String, default="English")
    demographics = Column(JSON, default={})
    consent_document_reuse = Column(Integer, default=1)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="profile")


class UserDocument(Base):
    __tablename__ = "user_documents"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    doc_type = Column(String, nullable=False)
    filename = Column(String)
    raw_text = Column(Text, nullable=True)
    extracted_data = Column(JSON, default={})
    confidence = Column(String, default="0%")
    status = Column(String, default="uploaded")
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="documents")


class UserScheme(Base):
    __tablename__ = "user_schemes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    scheme_id = Column(Integer, ForeignKey("schemes.id"))
    status = Column(String, default="recommended")
    applied_at = Column(TIMESTAMP(timezone=True), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    detail = Column(JSON, default={})
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class ServiceRequest(Base):
    __tablename__ = "service_requests"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    service_name = Column(String, nullable=False)
    service_type = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    form_data = Column(JSON, default={})
    documents = Column(JSON, default=[])
    status = Column(String, default="pending")
    admin_notes = Column(Text, nullable=True)
    processed_by = Column(String, ForeignKey("users.id"), nullable=True)
    processed_at = Column(TIMESTAMP(timezone=True), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", foreign_keys=[user_id])
    processor = relationship("User", foreign_keys=[processed_by])


class WhatsAppSession(Base):
    __tablename__ = "whatsapp_sessions"
    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    data = Column(JSON, default={})
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())


class WhatsAppLog(Base):
    __tablename__ = "whatsapp_logs"
    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String, nullable=False, index=True)
    direction = Column(String, nullable=False)
    message_text = Column(String, nullable=True)
    message_id = Column(String, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
