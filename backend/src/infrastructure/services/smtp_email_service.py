"""SMTP-based email service using aiosmtplib (or stdlib fallback)."""

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from src.application.i_email_service import IEmailService
from src.core.config import settings


class SmtpEmailService(IEmailService):
    """Send emails via SMTP using Python's built-in smtplib."""

    def __init__(self) -> None:
        self._host = settings.SMTP_HOST
        self._port = int(settings.SMTP_PORT)
        self._user = settings.SMTP_USER
        self._password = settings.SMTP_PASSWORD
        self._from_email = settings.SMTP_FROM_EMAIL

    async def send(
        self,
        to: str,
        subject: str,
        body_html: str,
    ) -> None:
        msg = MIMEMultipart("alternative")
        msg["From"] = self._from_email
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(body_html, "html"))

        # Using stdlib smtplib (synchronous) — works fine for low volume.
        # For high throughput, swap with aiosmtplib.
        with smtplib.SMTP(self._host, self._port) as server:
            server.starttls()
            if self._user and self._password:
                server.login(self._user, self._password)
            server.sendmail(self._from_email, to, msg.as_string())

    async def send_verification_email(
        self,
        to: str,
        verification_url: str,
    ) -> None:
        subject = "Verifikasi Email Anda — Schola"
        body_html = f"""
        <html>
        <body style="font-family: sans-serif; line-height: 1.6;">
            <h2>Verifikasi Email</h2>
            <p>Klik tombol di bawah untuk memverifikasi alamat email Anda:</p>
            <p>
                <a href="{verification_url}"
                   style="display: inline-block; padding: 12px 24px;
                          background-color: #4F46E5; color: #fff;
                          text-decoration: none; border-radius: 6px;">
                    Verifikasi Email
                </a>
            </p>
            <p style="color: #666; font-size: 0.9em;">
                Jika Anda tidak mendaftar di Schola, abaikan email ini.
            </p>
        </body>
        </html>
        """
        await self.send(to, subject, body_html)
