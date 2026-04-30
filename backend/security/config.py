from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta
import os


@dataclass(frozen=True)
class AuthSettings:
    secret_key: str = os.getenv("SECRET_KEY", "change-me")
    algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    )

    @property
    def access_token_expire_delta(self) -> timedelta:
        return timedelta(minutes=self.access_token_expire_minutes)


auth_settings = AuthSettings()
