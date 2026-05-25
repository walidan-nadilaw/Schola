"""JWT-based token service using PyJWT."""

from datetime import datetime, timedelta, timezone

import jwt

from src.application.i_token_service import ITokenService, TokenPayload
from src.core.config import settings
from src.domain.entity.user import User


class JwtTokenService(ITokenService):
    """Concrete JWT implementation backed by PyJWT."""

    def __init__(self) -> None:
        self._secret = settings.JWT_SECRET_KEY
        self._algorithm = settings.JWT_ALGORITHM
        self._expire_minutes = settings.JWT_EXPIRE_MINUTES
        self._verification_secret = settings.VERIFICATION_SECRET_KEY
        self._email_salt = settings.EMAIL_SALT

    # ---- access tokens ----

    def create_access_token(self, user: User) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value,
            "iat": now,
            "exp": now + timedelta(minutes=self._expire_minutes),
        }
        return jwt.encode(payload, self._secret, algorithm=self._algorithm)

    def verify_token(self, token: str) -> TokenPayload:
        try:
            data = jwt.decode(
                token,
                self._secret,
                algorithms=[self._algorithm],
            )
        except jwt.ExpiredSignatureError:
            raise ValueError("Token has expired")
        except jwt.InvalidTokenError as exc:
            raise ValueError(f"Invalid token: {exc}")

        return TokenPayload(
            user_id=data["sub"],
            email=data["email"],
            role=data["role"],
        )

    # ---- email-verification tokens ----

    def generate_verification_token(self, email: str) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            "sub": email,
            "salt": self._email_salt,
            "iat": now,
        }
        return jwt.encode(payload, self._verification_secret, algorithm=self._algorithm)

    def verify_email_token(
        self, token: str, expiration_seconds: int | None = None
    ) -> str:
        try:
            data = jwt.decode(
                token,
                self._verification_secret,
                algorithms=[self._algorithm],
                options={"verify_exp": False},
            )
        except jwt.InvalidTokenError as exc:
            raise ValueError(f"Invalid verification token: {exc}")

        if data.get("salt") != self._email_salt:
            raise ValueError("Invalid verification token salt")

        if expiration_seconds is not None:
            issued_at = datetime.fromtimestamp(data["iat"], tz=timezone.utc)
            if datetime.now(timezone.utc) - issued_at > timedelta(
                seconds=expiration_seconds
            ):
                raise ValueError("Verification token has expired")

        return data["sub"]
