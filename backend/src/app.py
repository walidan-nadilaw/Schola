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
        logger.info("Database already has users - skipping seed")
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_BASE_URL] if settings.FRONTEND_BASE_URL else ["*"],
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
async def root():
    return {"message": "Welcome to the Schola API"}

