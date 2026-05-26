"""Abstract interface for the Submission repository."""

from abc import abstractmethod
from collections.abc import Iterable
from uuid import UUID

from src.domain.entity.submission import Submission, SubmissionStatus, SubmissionVerifier
from src.infrastructure.repositories.repository import IRepository


class ISubmissionRepository(IRepository[Submission, str]):
    """Port for submission persistence with additional query methods."""

    @abstractmethod
    async def update(self, entity: Submission) -> Submission:
        """Persist changes to an existing submission."""
        pass

    @abstractmethod
    async def find_by_submitter_id(self, submitter_id: UUID) -> Iterable[Submission]:
        """Find all submissions belonging to a specific user."""
        pass

    @abstractmethod
    async def find_by_status(self, status: SubmissionStatus) -> Iterable[Submission]:
        """Find all submissions with a given status."""
        pass

    @abstractmethod
    async def find_by_letter_type(self, letter_type: str) -> Iterable[Submission]:
        """Find all submissions of a specific letter type."""
        pass

    @abstractmethod
    async def find_pending_verifications(self, verifier_id: UUID) -> list[Submission]:
        """Find submissions where this user has a pending verification."""
        pass

    @abstractmethod
    async def find_by_verifier_id(self, verifier_id: UUID) -> list[Submission]:
        """Find all submissions where this user is an assigned verifier (any status)."""
        pass

    @abstractmethod
    async def update_verifier(self, verifier: SubmissionVerifier) -> SubmissionVerifier:
        """Persist changes to a single submission verifier row."""
        pass

    @abstractmethod
    async def count_by_status(
        self,
        submitter_id: UUID | None = None,
        verifier_id: UUID | None = None,
    ) -> dict[str, int]:
        """Return a dict of {status: count} filtered optionally by submitter or verifier."""
        pass

