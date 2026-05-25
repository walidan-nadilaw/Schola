"""Argon2-based password hashing via passlib."""

from passlib.hash import pbkdf2_sha256

from src.application.i_password_service import IPasswordService


class ArgonPasswordService(IPasswordService):
    """
    Password hashing using passlib's pbkdf2_sha256.

    passlib is already in the project dependencies. If you install
    ``argon2-cffi`` later, swap ``pbkdf2_sha256`` for ``argon2`` here.
    """

    def hash(self, plain_password: str) -> str:
        return pbkdf2_sha256.hash(plain_password)

    def verify(self, plain_password: str, hashed_password: str) -> bool:
        return pbkdf2_sha256.verify(plain_password, hashed_password)
