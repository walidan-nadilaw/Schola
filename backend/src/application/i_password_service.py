"""Abstract interface for password hashing."""

from abc import ABC, abstractmethod


class IPasswordService(ABC):
    """Port for password hashing and verification."""

    @abstractmethod
    def hash(self, plain_password: str) -> str:
        """Hash a plain-text password."""

    @abstractmethod
    def verify(self, plain_password: str, hashed_password: str) -> bool:
        """Return True if *plain_password* matches the *hashed_password*."""
