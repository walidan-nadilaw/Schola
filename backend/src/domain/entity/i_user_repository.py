from abc import abstractmethod
from collections.abc import Iterable
from uuid import UUID

from src.domain.entity.user import User
from src.infrastructure.repositories.repository import IRepository


class IUserRepository(IRepository[User, UUID]):
    """Port for user persistence with additional query methods."""

    @abstractmethod
    async def find_by_email(self, email: str) -> User | None:
        """Look up a user by email address."""
        pass

    @abstractmethod
    async def update(self, entity: User) -> User:
        """Persist changes to an existing user."""
        pass

    @abstractmethod
    async def find_all_filtered(
        self,
        search: str | None = None,
        role: str | None = None,
        department: str | None = None,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[User], int]:
        """Server-side filtered and paginated user list. Returns (users, total)."""
        pass
