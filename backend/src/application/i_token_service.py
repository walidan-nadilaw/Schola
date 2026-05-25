"""Abstract interface for token operations."""

from abc import ABC, abstractmethod

from src.domain.entity.user import User


class TokenPayload:
    """Decoded token payload."""

    def __init__(self, user_id, email: str, role: str) -> None:
        self.user_id = user_id
        self.email = email
        self.role = role


class ITokenService(ABC):
    """Port for JWT / token operations."""

    @abstractmethod
    def create_access_token(self, user: User) -> str:
        """Create a signed access token for *user*."""

    @abstractmethod
    def verify_token(self, token: str) -> TokenPayload:
        """Verify *token* and return its payload."""

    @abstractmethod
    def generate_verification_token(self, email: str) -> str:
        """Create a signed email-verification token."""

    @abstractmethod
    def verify_email_token(
        self, token: str, expiration_seconds: int | None = None
    ) -> str:
        """Verify and decode an email-verification token, returning the email."""
