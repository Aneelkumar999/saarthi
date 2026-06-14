import os
import threading
from dataclasses import dataclass


@dataclass
class SMSConfig:
    account_sid: str = ""
    auth_token: str = ""
    from_number: str = ""
    enabled: bool = False


_sms_config: SMSConfig | None = None


def get_sms_config() -> SMSConfig:
    global _sms_config
    if _sms_config is None:
        sid = os.getenv("TWILIO_ACCOUNT_SID", "")
        token = os.getenv("TWILIO_AUTH_TOKEN", "")
        _sms_config = SMSConfig(
            account_sid=sid,
            auth_token=token,
            from_number=os.getenv("TWILIO_PHONE_NUMBER", ""),
            enabled=bool(sid and token),
        )
    return _sms_config


def _send_via_twilio(to_phone: str, otp: str) -> bool:
    try:
        from twilio.rest import Client

        cfg = get_sms_config()
        client = Client(cfg.account_sid, cfg.auth_token)

        message = client.messages.create(
            body=f"Your Saarthi AI OTP is {otp}. Valid for 5 minutes. Do not share this code.",
            from_=cfg.from_number,
            to=to_phone,
        )

        print(f"[sms_service] SMS sent to {to_phone} — SID: {message.sid}")
        return True
    except Exception as exc:
        print(f"[sms_service] Twilio send failed: {exc}")
        return False


def send_otp_sms(to_phone: str, otp: str) -> bool:
    cfg = get_sms_config()
    if not cfg.enabled:
        print(f"[sms_service] Twilio not configured — skipping SMS to {to_phone} (OTP: {otp})")
        return False

    threading.Thread(
        target=_send_via_twilio,
        args=(to_phone, otp),
        daemon=True,
    ).start()
    return True
