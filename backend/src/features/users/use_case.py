"""Use cases for the Users feature."""

import math

from src.application.i_password_service import IPasswordService
from src.api.exceptions import BadRequestException, ConflictException, NotFoundException
from src.domain.entity.i_user_repository import IUserRepository
from src.domain.entity.user import User, UserRole


class ListUsersUseCase:
    """List all users with basic pagination."""

    def __init__(self, user_repo: IUserRepository) -> None:
        self._repo = user_repo

    async def execute(
        self,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[User], int]:
        """Returns (users_list, total_count)."""
        all_users = list(await self._repo.findAll())
        total = len(all_users)
        start = (page - 1) * limit
        return all_users[start : start + limit], total


class GetUserUseCase:
    """Get a single user by ID."""

    def __init__(self, user_repo: IUserRepository) -> None:
        self._repo = user_repo

    async def execute(self, user_id) -> User:
        user = await self._repo.findById(user_id)
        if user is None:
            raise NotFoundException("User tidak ditemukan")
        return user


class CreateUserUseCase:
    """Admin creates a user (email pre-verified)."""

    def __init__(
        self,
        user_repo: IUserRepository,
        password_service: IPasswordService,
    ) -> None:
        self._repo = user_repo
        self._pw = password_service

    async def execute(
        self,
        email: str,
        password: str,
        role: UserRole = UserRole.MAHASISWA,
        nim: str | None = None,
        fakultas: str | None = None,
        departemen: str | None = None,
        nip: str | None = None,
    ) -> User:
        existing = await self._repo.find_by_email(email)
        if existing is not None:
            raise ConflictException("Email sudah terdaftar")

        hashed = self._pw.hash(password)
        try:
            user = User.New(
                email=email,
                hashed_password=hashed,
                role=role,
                nim=nim,
                fakultas=fakultas,
                departemen=departemen,
                nip=nip,
            )
        except ValueError as exc:
            raise BadRequestException(str(exc))

        # Admin-created users are pre-verified
        user.verify_email()
        return await self._repo.save(user)


class UpdateUserUseCase:
    """Update user attributes."""

    def __init__(self, user_repo: IUserRepository) -> None:
        self._repo = user_repo

    async def execute(
        self,
        user_id,
        role: UserRole | None = None,
        nim: str | None = None,
        fakultas: str | None = None,
        departemen: str | None = None,
        nip: str | None = None,
    ) -> User:
        user = await self._repo.findById(user_id)
        if user is None:
            raise NotFoundException("User tidak ditemukan")

        if role is not None:
            user.role = role
        if nim is not None:
            user.nim = nim
        if fakultas is not None:
            user.fakultas = fakultas
        if departemen is not None:
            user.departemen = departemen
        if nip is not None:
            user.nip = nip

        return await self._repo.update(user)


class DeleteUserUseCase:
    """Hard-delete a user."""

    def __init__(self, user_repo: IUserRepository) -> None:
        self._repo = user_repo

    async def execute(self, user_id) -> None:
        exists = await self._repo.existsById(user_id)
        if not exists:
            raise NotFoundException("User tidak ditemukan")
        await self._repo.deleteById(user_id)
