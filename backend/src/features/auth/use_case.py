"""Use cases for the Auth feature slice."""

from src.application.i_password_service import IPasswordService
from src.application.i_token_service import ITokenService
from src.api.exceptions import (
    AuthenticationException,
    BadRequestException,
    ConflictException,
)
from src.core.config import settings
from src.domain.entity.i_user_repository import IUserRepository
from src.domain.entity.user import User, UserRole


class RegisterUseCase:
    """Create a new user account."""

    def __init__(
        self,
        user_repo: IUserRepository,
        password_service: IPasswordService,
    ) -> None:
        self._user_repo = user_repo
        self._password_service = password_service

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
        # 1. Check for duplicate email
        existing = await self._user_repo.find_by_email(email)
        if existing is not None:
            raise ConflictException("Email sudah terdaftar")

        # 2. Hash the password
        hashed = self._password_service.hash(password)

        # 3. Create the domain entity (validates email domain automatically)
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

        # 4. Persist and return
        return await self._user_repo.save(user)


class LoginUseCase:
    """Authenticate a user and issue a JWT."""

    def __init__(
        self,
        user_repo: IUserRepository,
        password_service: IPasswordService,
        token_service: ITokenService,
    ) -> None:
        self._user_repo = user_repo
        self._password_service = password_service
        self._token_service = token_service

    async def execute(self, email: str, password: str) -> tuple[User, str, int]:
        """
        Returns
        -------
        tuple[User, str, int]
            (domain user, access token, expires_in seconds)
        """
        # 1. Find user
        user = await self._user_repo.find_by_email(email)
        if user is None:
            raise AuthenticationException("Email atau password salah")

        # 2. Verify password
        if not self._password_service.verify(password, user.hashed_password):
            raise AuthenticationException("Email atau password salah")

        # 3. Issue token
        token = self._token_service.create_access_token(user)
        expires_in = settings.JWT_EXPIRE_MINUTES * 60

        return user, token, expires_in
