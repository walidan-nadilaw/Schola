from abc import abstractmethod
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
