from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.error_handler import add_global_exception_handlers
from src.core.config import settings
from src.features.auth.router import router as auth_router
from src.features.users.router import router as users_router
from src.features.templates.router import router as templates_router
from src.features.submissions.router import router as submissions_router
from src.features.verification.router import router as verification_router
from src.features.files.router import router as files_router
from src.features.notifications.router import router as notifications_router
from src.features.dashboard.router import router as dashboard_router
from src.features.faqs.router import router as faqs_router


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    """Auto-seed DB with demo data on first boot."""
    import logging
    logger = logging.getLogger("uvicorn")
    try:
        from src.infrastructure.seed_data import seed_if_empty
        if await seed_if_empty():
            logger.info("Database seeded with demo data (admin123 / user123)")
        else:
            logger.info("Database already has users - skipping seed")
    except Exception:
        logger.exception("Database seed failed")
    yield


app = FastAPI(
    title="Schola API",
    description="API documentation for Schola",
    version="1.0.0",
    lifespan=lifespan,
)

# Global error handling
add_global_exception_handlers(app)

# CORS
# FRONTEND_BASE_URL may be a comma-separated list of allowed origins.
# Vercel preview deployments get a per-build hash subdomain, so we also
# match them by regex instead of needing each exact URL.
_allowed_origins = [
    origin.strip()
    for origin in (settings.FRONTEND_BASE_URL or "").split(",")
    if origin.strip()
]
# If no origins are set, default to localhost to avoid using wildcard '*' with allow_credentials=True
if not _allowed_origins:
    _allowed_origins = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Feature routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(templates_router)
app.include_router(submissions_router)
app.include_router(verification_router)
app.include_router(files_router)
app.include_router(notifications_router)
app.include_router(dashboard_router)
app.include_router(faqs_router)


@app.get("/")
async def root():
    return {"message": "Welcome to the Schola API"}

