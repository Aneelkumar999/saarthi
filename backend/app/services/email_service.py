import os
import smtplib
import threading
from dataclasses import dataclass
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


@dataclass
class EmailConfig:
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    from_email: str = "Saarthi AI <noreply@saarthi.ai>"
    enabled: bool = False


_email_config: EmailConfig | None = None


def get_email_config() -> EmailConfig:
    global _email_config
    if _email_config is None:
        smtp_user = os.getenv("SMTP_USER", "")
        smtp_password = os.getenv("SMTP_PASSWORD", "")
        _email_config = EmailConfig(
            smtp_host=os.getenv("SMTP_HOST", "smtp.gmail.com"),
            smtp_port=int(os.getenv("SMTP_PORT", "587")),
            smtp_user=smtp_user,
            smtp_password=smtp_password,
            from_email=os.getenv("RESEND_FROM_EMAIL", f"Saarthi AI <{smtp_user}>"),
            enabled=bool(smtp_user and smtp_password),
        )
    return _email_config


def _send_via_smtp(to_email: str, subject: str, html_body: str, text_body: str) -> bool:
    try:
        cfg = get_email_config()

        msg = MIMEMultipart("alternative")
        msg["From"] = cfg.from_email
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(cfg.smtp_host, cfg.smtp_port, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(cfg.smtp_user, cfg.smtp_password)
            server.sendmail(cfg.smtp_user, to_email, msg.as_string())

        print(f"[email_service] Email sent to {to_email}")
        return True
    except Exception as exc:
        print(f"[email_service] SMTP send failed: {exc}")
        return False


def send_otp_email(to_email: str, otp: str, purpose: str = "login") -> bool:
    cfg = get_email_config()
    if not cfg.enabled:
        print(f"[email_service] SMTP not configured — skipping email to {to_email} (OTP: {otp})")
        return False

    purpose_label = "Sign in" if purpose == "login" else "Create your account"
    subject = f"Your Saarthi AI OTP: {otp}"

    html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto;">
    <tr><td style="background: #ffffff; border-radius: 16px; padding: 32px;">
      <h1 style="font-size: 22px; color: #1a365d; margin: 0 0 8px 0;">Saarthi AI</h1>
      <p style="color: #64748b; font-size: 14px; margin: 0 0 20px 0;">{purpose_label}</p>
      <div style="background: #f8fafc; border-radius: 12px; padding: 24px; text-align: center; border: 1px dashed #cbd5e1;">
        <p style="font-size: 13px; color: #94a3b8; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Your OTP</p>
        <p style="font-size: 36px; font-weight: 800; color: #1a365d; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">{otp}</p>
        <p style="font-size: 12px; color: #94a3b8; margin: 12px 0 0 0;">Valid for 5 minutes</p>
      </div>
      <p style="font-size: 12px; color: #94a3b8; margin: 20px 0 0 0; line-height: 1.5;">
        If you did not request this OTP, please ignore this email.<br>
        &copy; 2026 Saarthi AI. All rights reserved.
      </p>
    </td></tr>
  </table>
</body>
</html>"""

    text_body = f"""Saarthi AI - {purpose_label}

Your OTP is: {otp}

Valid for 5 minutes.

If you did not request this OTP, please ignore this email.
"""

    threading.Thread(
        target=_send_via_smtp,
        args=(to_email, subject, html_body, text_body),
        daemon=True,
    ).start()
    return True
