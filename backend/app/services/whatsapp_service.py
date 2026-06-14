import os
import hashlib
import hmac
import json
import logging
from datetime import datetime, timezone
from typing import Optional

import httpx
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.models import models

logger = logging.getLogger(__name__)
load_dotenv()


class WhatsAppService:
    def __init__(self):
        self.api_version = "v21.0"
        self.phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
        self.access_token = os.getenv("WHATSAPP_ACCESS_TOKEN")
        self.webhook_verify_token = os.getenv("WHATSAPP_WEBHOOK_VERIFY_TOKEN", "saarthi_verify_token")
        self.base_url = f"https://graph.facebook.com/{self.api_version}/{self.phone_number_id}" if self.phone_number_id else None
        self.client = httpx.AsyncClient(timeout=15.0)

    @property
    def is_configured(self) -> bool:
        return bool(self.phone_number_id and self.access_token)

    async def send_message(self, to: str, text: str) -> dict:
        if not self.is_configured:
            logger.warning(f"WhatsApp not configured — would send to {to}: {text[:60]}...")
            return {"status": "simulated", "to": to, "text": text[:60]}

        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"preview_url": False, "body": text},
        }
        try:
            resp = await self.client.post(
                f"{self.base_url}/messages",
                headers={
                    "Authorization": f"Bearer {self.access_token}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            data = resp.json()
            if resp.is_error:
                logger.error(f"WhatsApp send error: {data}")
                return {"status": "error", "error": data}
            return {"status": "sent", "message_id": data.get("messages", [{}])[0].get("id")}
        except Exception as e:
            logger.error(f"WhatsApp send exception: {e}")
            return {"status": "error", "error": str(e)}

    async def send_template(self, to: str, template_name: str, components: list[dict] | None = None) -> dict:
        if not self.is_configured:
            return {"status": "simulated", "to": to, "template": template_name}

        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "template",
            "template": {"name": template_name, "language": {"code": "en"}},
        }
        if components:
            payload["template"]["components"] = components

        try:
            resp = await self.client.post(
                f"{self.base_url}/messages",
                headers={
                    "Authorization": f"Bearer {self.access_token}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            data = resp.json()
            if resp.is_error:
                logger.error(f"WhatsApp template error: {data}")
            return data
        except Exception as e:
            logger.error(f"WhatsApp template exception: {e}")
            return {"error": str(e)}

    def verify_webhook(self, mode: str | None, verify_token: str | None, challenge: str | None) -> tuple[bool, str]:
        if mode == "subscribe" and verify_token == self.webhook_verify_token and challenge:
            return True, challenge
        return False, "Verification failed"

    async def process_incoming(self, db: Session, body: dict) -> None:
        entry = body.get("entry", [])
        if not entry:
            return

        for change in entry[0].get("changes", []):
            value = change.get("value", {})
            messages = value.get("messages", [])
            metadata = value.get("metadata", {})

            for msg in messages:
                await self._handle_message(db, msg, metadata)

    async def _handle_message(self, db: Session, msg: dict, metadata: dict) -> None:
        from_number = msg.get("from", "")
        msg_type = msg.get("type", "text")
        msg_id = msg.get("id", "")

        text = ""
        if msg_type == "text":
            text = msg.get("text", {}).get("body", "")
        elif msg_type == "interactive":
            interactive = msg.get("interactive", {})
            if interactive.get("type") == "button_reply":
                text = interactive.get("button_reply", {}).get("id", "")
            elif interactive.get("type") == "list_reply":
                text = interactive.get("list_reply", {}).get("id", "")

        self._log_conversation(db, from_number, text, "received", msg_id)

        session = self._get_or_create_session(db, from_number)

        welcome_replied = session.data.get("welcome_replied", False) if session.data else False

        if not welcome_replied:
            await self._send_welcome(db, session, from_number)
            return

        from app.services.ai_service import ai_service

        try:
            roadmap = await ai_service.generate_roadmap(db, text)
            response = roadmap.get("response", "I found a roadmap for you.")
            steps = roadmap.get("steps", [])

            steps_text = "\n\n".join([
                f"*Step {s['id']}: {s['title']}*\n🏛️ {s['dept']}\n📄 Docs: {', '.join(s['documents'])}"
                for s in steps[:4]
            ])
            if steps:
                response += f"\n\n{steps_text}"
                if len(steps) > 4:
                    response += f"\n\n+{len(steps)-4} more steps. Visit our portal for the full roadmap."
                response += f"\n\n⏱️ Timeline: {roadmap.get('timeline', 'N/A')} days"

            chat_response = await ai_service.get_chat_response(db, text)
            final_text = f"{chat_response}\n\n{response}" if not steps else response
            await self.send_message(from_number, final_text)
        except Exception as e:
            logger.error(f"WhatsApp AI error: {e}")
            default_intents = db.query(models.Intent).limit(5).all()
            intent_names = ", ".join([i.name for i in default_intents])
            await self.send_message(
                from_number,
                f"Welcome to Saarthi AI! 🇮🇳\n\nI can help you with:\n• {intent_names}\n\nSend me your goal (e.g., 'I want to open a tea shop') and I'll build a roadmap for you."
            )

    async def _send_welcome(self, db: Session, session, from_number: str) -> None:
        default_intents = db.query(models.Intent).limit(5).all()
        intent_names = "\n".join([f"• {i.name}" for i in default_intents])

        welcome_text = (
            "Namaste! 🙏 I am *Saarthi AI*, your assistant for Indian government services.\n\n"
            "I can help you with:\n"
            f"{intent_names}\n\n"
            "Just tell me your goal — for example:\n"
            "👉 \"I want to open a tea shop in Hyderabad\"\n"
            "👉 \"How do I get a birth certificate?\"\n"
            "👉 \"Apply for a marriage certificate\"\n\n"
            "Or type *help* to see all options."
        )

        if session.data:
            session.data["welcome_replied"] = True
            session.updated_at = datetime.now(timezone.utc)
            db.commit()

        await self.send_message(from_number, welcome_text)

    def _get_or_create_session(self, db: Session, phone: str):
        session = db.query(models.WhatsAppSession).filter(
            models.WhatsAppSession.phone_number == phone
        ).first()
        if not session:
            session_data = {"welcome_replied": False, "conversation_count": 0}
            if not self.is_configured:
                session_data["welcome_replied"] = True

            session = models.WhatsAppSession(
                phone_number=phone,
                data=session_data,
                updated_at=datetime.now(timezone.utc),
            )
            db.add(session)
            db.commit()
            db.refresh(session)
        return session

    def _log_conversation(self, db: Session, phone: str, text: str, direction: str, msg_id: str = "") -> None:
        log = models.WhatsAppLog(
            phone_number=phone,
            direction=direction,
            message_text=text,
            message_id=msg_id,
        )
        db.add(log)
        db.commit()


whatsapp_service = WhatsAppService()
