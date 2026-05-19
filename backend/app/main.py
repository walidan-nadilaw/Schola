import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import auth, dashboard, files, submissions, templates, users, verification, notifications, faqs

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for Schola: IPB Academic Help Center",
    version="2.0.0",
)

# CORS — restrict to configured origins (not wildcard in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.APP_ENV != "development" else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# ── Register all routers ──────────────────────────────────────
app.include_router(auth.router, prefix="/api")
app.include_router(templates.router, prefix="/api")
app.include_router(submissions.router, prefix="/api")
app.include_router(files.router, prefix="/api")
app.include_router(verification.router, prefix="/api")   # path: /api/verifications
app.include_router(dashboard.router, prefix="/api")       # path: /api/dashboard/stats
app.include_router(users.router, prefix="/api")           # path: /api/users
app.include_router(notifications.router, prefix="/api")   # path: /api/notifications
app.include_router(faqs.router, prefix="/api")            # path: /api/faqs


@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "version": "2.0.0",
        "environment": settings.APP_ENV,
        "docs": "/docs",
    }


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.APP_ENV == "development",
    )
