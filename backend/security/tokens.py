from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import jwt

from .config import auth_settings


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    payload = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or auth_settings.access_token_expire_delta)
    payload.update({"exp": expire})
    return jwt.encode(payload, auth_settings.secret_key, algorithm=auth_settings.algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, auth_settings.secret_key, algorithms=[auth_settings.algorithm])