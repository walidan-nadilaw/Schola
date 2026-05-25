from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class HTTPDataResponse(BaseModel, Generic[T]):
    status: str
    data: T
    message: str


class HTTPMessageResponse(BaseModel):
    status: str
    message: str


class HTTPErrorResponse(BaseModel):
    status: str
    error: str
    errors: list[dict[str, Any] | str]


ApiResponse = HTTPDataResponse
