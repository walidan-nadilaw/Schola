from __future__ import annotations

from fastapi import HTTPException, status


class BaseHTTPException(HTTPException):
    def __init__(self, status_code: int, message: str) -> None:
        super().__init__(status_code=status_code, detail=message)


class BadRequestException(BaseHTTPException):
    def __init__(self, message: str = "Bad request") -> None:
        super().__init__(status.HTTP_400_BAD_REQUEST, message)


class AuthenticationException(BaseHTTPException):
    def __init__(self, message: str = "Authentication required") -> None:
        super().__init__(status.HTTP_401_UNAUTHORIZED, message)


class AuthorizationException(BaseHTTPException):
    def __init__(self, message: str = "Forbidden") -> None:
        super().__init__(status.HTTP_403_FORBIDDEN, message)


class NotFoundException(BaseHTTPException):
    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__(status.HTTP_404_NOT_FOUND, message)


class ConflictException(BaseHTTPException):
    def __init__(self, message: str = "Conflict") -> None:
        super().__init__(status.HTTP_409_CONFLICT, message)


class RequestTooLargeException(BaseHTTPException):
    def __init__(self, message: str = "Request entity too large") -> None:
        super().__init__(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, message)


class ServerException(BaseHTTPException):
    def __init__(self, message: str = "Internal server error") -> None:
        super().__init__(status.HTTP_500_INTERNAL_SERVER_ERROR, message)
