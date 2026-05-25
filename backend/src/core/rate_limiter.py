from fastapi import Depends
from fastapi_limiter.depends import RateLimiter
from pyrate_limiter import Limiter, Rate

from src.core.config import settings


def rate_limit_dependency(max_requests: int, window_seconds):
    if settings.APP_ENV == "test":
        return
    return [
        Depends(
            RateLimiter(
                limiter=Limiter(Rate(max_requests, window_seconds)),
            )
        )
    ]
