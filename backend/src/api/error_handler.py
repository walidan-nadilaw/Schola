from __future__ import annotations

from collections.abc import Iterable
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


def _normalize_errors(detail: Any) -> list[dict[str, Any] | str]:
    if detail is None:
        return []
    if isinstance(detail, list):
        normalized: list[dict[str, Any] | str] = []
        for item in detail:
            if isinstance(item, dict | str):
                normalized.append(item)
            else:
                normalized.append(str(item))
        return normalized
    if isinstance(detail, dict | str):
        return [detail]
    if isinstance(detail, Iterable) and not isinstance(detail, bytes):
        return [str(item) for item in detail]
    return [str(detail)]


def add_global_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        _request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        errors = [
            {
                "field": ".".join(str(part) for part in error.get("loc", [])),
                "message": error.get("msg", "Invalid input"),
                "type": error.get("type", "validation_error"),
            }
            for error in exc.errors()
        ]
        return JSONResponse(
            status_code=422,
            content={
                "status": "error",
                "error": "Validation failed",
                "errors": errors,
            },
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(
        _request: Request,
        exc: HTTPException,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "status": "error",
                "error": exc.detail if isinstance(exc.detail, str) else "HTTP error",
                "errors": _normalize_errors(exc.detail),
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        _request: Request,
        _exc: Exception,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "error": "Internal server error",
                "errors": [],
            },
        )
