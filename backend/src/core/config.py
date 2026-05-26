"""
core.config
Configuration settings for the core application.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Configuration settings for the application."""

    def __init__(self) -> None:
        self.APP_ENV = os.getenv("APP_ENV", "development")
        self.DB_HOST = self._get_required_env_var("DB_HOST")
        self.DB_PORT = self._get_required_int_env_var(
            "DB_PORT", min_value=1, max_value=65535
        )
        self.DB_USER = self._get_required_env_var("DB_USER")
        self.DB_PASSWORD = self._get_required_env_var("DB_PASSWORD")
        self.DB_NAME = self._get_required_env_var("DB_NAME")

        self.JWT_SECRET_KEY = self._get_required_env_var("JWT_SECRET_KEY")
        self.JWT_EXPIRE_MINUTES = self._get_required_int_env_var(
            "JWT_EXPIRE_MINUTES", min_value=1, max_value=1440
        )
        self.JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
        self.EMAIL_SALT = self._get_required_env_var("EMAIL_SALT")

        self.BASE_URL = os.getenv("BASE_URL")
        self.FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL")

        self.SMTP_HOST = os.getenv("SMTP_HOST", "")
        self.SMTP_PORT = os.getenv("SMTP_PORT", "587")
        self.SMTP_USER = os.getenv("SMTP_USER", "")
        self.SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
        self.SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "noreply@apps.ipb.ac.id")
        self.VERIFICATION_SECRET_KEY = os.getenv(
            "VERIFICATION_SECRET_KEY", self.JWT_SECRET_KEY
        )

        self.R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID", "")
        self.R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY", "")
        self.R2_SECRET_KEY = os.getenv("R2_SECRET_KEY", "")
        self.R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "")
        self.R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL", "")
        self.FACTORY_STORAGE_TYPE = os.getenv("FACTORY_STORAGE_TYPE", "").lower()

        # ── File upload constraints ──────────────────────
        self.MAX_FILE_SIZE_BYTES = int(
            os.getenv("MAX_FILE_SIZE_BYTES", str(10 * 1024 * 1024))
        )  # default 10 MB
        self.ALLOWED_MIME_TYPES = os.getenv(
            "ALLOWED_MIME_TYPES",
            "application/pdf,image/jpeg,image/png,application/zip",
        ).split(",")

    @staticmethod
    def _get_required_env_var(var_name: str) -> str:
        """Get a required environment variable, raising an error if it's not set."""
        value = os.getenv(var_name)
        if value is None:
            raise ValueError(
                f"Environment variable '{var_name}' is required but not set."
            )
        return value

    @staticmethod
    def _get_required_int_env_var(
        var_name: str, min_value: int = 1, max_value: int = 1440
    ) -> int:
        """Get a required integer environment variable, raising an error if it's not set or not an integer."""
        value_str = Settings._get_required_env_var(var_name)
        try:
            value = int(value_str)
        except ValueError:
            raise ValueError(
                f"Environment variable '{var_name}' must be an integer, but got '{value_str}'."
            )
        if min_value is not None and value < min_value:
            raise ValueError(
                f"Environment variable '{var_name}' must be at least {min_value}, but got {value}."
            )
        if max_value is not None and value > max_value:
            raise ValueError(
                f"Environment variable '{var_name}' must be at most {max_value}, but got {value}."
            )
        return value

    @property
    def DATABASE_URL(self) -> str:
        """Get the database URL from environment variables."""
        return (
            f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )


settings = Settings()
