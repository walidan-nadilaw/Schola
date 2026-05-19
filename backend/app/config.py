import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/schola_db"

    # JWT
    JWT_SECRET: str = "super-secret-key-change-me-in-production-1234567890"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # App
    APP_ENV: str = "development"
    APP_NAME: str = "Schola IPB Backend"
    PORT: int = 8000
    HOST: str = "127.0.0.1"

    # File upload
    MAX_FILE_SIZE_BYTES: int = 5 * 1024 * 1024   # 5 MB
    ALLOWED_MIME_TYPES: List[str] = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "application/zip",
        "application/x-zip-compressed",
    ]

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
