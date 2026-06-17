import os
import resend

resend.api_key = os.getenv("RESEND_API_KEY")


def send_otp_email(to_email: str, otp: str, purpose: str = "login") -> bool:
    try:
        purpose_label = "Sign in" if purpose == "login" else "Create your account"

        subject = f"{purpose_label} Verification Code"

        html_body = f"""
        <html>
            <body>
                <h2>{purpose_label}</h2>
                <p>Your OTP is:</p>
                <h1>{otp}</h1>
                <p>This OTP expires in 10 minutes.</p>
            </body>
        </html>
        """


        params = {
            "from": "onboarding@resend.dev",
            "to": [to_email],
            "subject": subject,
            "html": html_body,
        }

        resend.Emails.send(params)

        print(f"[email_service] Email sent to {to_email}")
        return True

    except Exception as exc:
        print(f"[email_service] Email send failed: {exc}")
        return False
