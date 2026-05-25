"""Abstract interface for email sending."""

from abc import ABC, abstractmethod


class IEmailService(ABC):
    """Port for sending emails."""

    @abstractmethod
    async def send(
        self,
        to: str,
        subject: str,
        body_html: str,
    ) -> None:
        """Send an HTML email to a single recipient."""

    @abstractmethod
    async def send_verification_email(
        self,
        to: str,
        verification_url: str,
    ) -> None:
        """Send an email-verification link to the user."""
