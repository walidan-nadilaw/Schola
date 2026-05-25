from fastapi import FastAPI

from src.api.error_handler import add_global_exception_handlers
from src.features.auth.router import router as auth_router
from src.features.users.router import router as users_router
from src.features.templates.router import router as templates_router

app = FastAPI(
    title="Schola API",
    description="API documentation for Schola",
    version="1.0.0",
)

# Global error handling
add_global_exception_handlers(app)

# Feature routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(templates_router)


@app.get("/")
async def root():
    return {"message": "Welcome to the Schola API"}

