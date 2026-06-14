from fastapi import APIRouter, Request, Query, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import models
from app.services.whatsapp_service import whatsapp_service

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp Integration"])


@router.get("/webhook")
async def verify_webhook(
    hub_mode: str | None = Query(None, alias="hub.mode"),
    hub_verify_token: str | None = Query(None, alias="hub.verify_token"),
    hub_challenge: str | None = Query(None, alias="hub.challenge"),
):
    valid, challenge = whatsapp_service.verify_webhook(hub_mode, hub_verify_token, hub_challenge)
    if valid:
        return int(challenge)
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/webhook")
async def receive_message(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    await whatsapp_service.process_incoming(db, body)
    return {"status": "ok"}


@router.post("/send")
async def send_whatsapp(
    phone: str,
    message: str,
    user: models.User = Depends(get_current_user),
):
    result = await whatsapp_service.send_message(phone, message)
    return result


@router.get("/status")
async def get_whatsapp_status():
    return {
        "configured": whatsapp_service.is_configured,
        "phone_number_id": whatsapp_service.phone_number_id,
    }
