"""Cloudflare R2 (S3-compatible) storage service using httpx."""

import hashlib
import hmac
from datetime import datetime, timezone
from urllib.parse import quote

import httpx

from src.application.i_storage_service import IStorageService, StoredFile
from src.core.config import settings


class R2StorageService(IStorageService):
    """
    File storage backed by Cloudflare R2 using raw S3-compatible HTTP API.

    Uses httpx (already a project dependency) instead of boto3 to keep
    the dependency footprint minimal.
    """

    def __init__(self) -> None:
        self._account_id = settings.R2_ACCOUNT_ID
        self._access_key = settings.R2_ACCESS_KEY
        self._secret_key = settings.R2_SECRET_KEY
        self._bucket = settings.R2_BUCKET_NAME
        self._public_url = settings.R2_PUBLIC_URL.rstrip("/")
        self._endpoint = (
            f"https://{self._account_id}.r2.cloudflarestorage.com"
        )

    def _sign_request(
        self,
        method: str,
        path: str,
        headers: dict[str, str],
        payload_hash: str,
    ) -> dict[str, str]:
        """Produce AWS Signature V4 headers for an S3-compatible request."""
        now = datetime.now(timezone.utc)
        date_stamp = now.strftime("%Y%m%d")
        amz_date = now.strftime("%Y%m%dT%H%M%SZ")
        region = "auto"
        service = "s3"
        credential_scope = f"{date_stamp}/{region}/{service}/aws4_request"

        headers["x-amz-date"] = amz_date
        headers["x-amz-content-sha256"] = payload_hash

        signed_header_keys = sorted(headers.keys())
        signed_headers = ";".join(signed_header_keys)
        canonical_headers = "".join(
            f"{k}:{headers[k]}\n" for k in signed_header_keys
        )

        canonical_request = "\n".join([
            method,
            path,
            "",  # query string
            canonical_headers,
            signed_headers,
            payload_hash,
        ])

        string_to_sign = "\n".join([
            "AWS4-HMAC-SHA256",
            amz_date,
            credential_scope,
            hashlib.sha256(canonical_request.encode()).hexdigest(),
        ])

        def _hmac(key: bytes, msg: str) -> bytes:
            return hmac.new(key, msg.encode(), hashlib.sha256).digest()

        signing_key = _hmac(
            _hmac(
                _hmac(
                    _hmac(f"AWS4{self._secret_key}".encode(), date_stamp),
                    region,
                ),
                service,
            ),
            "aws4_request",
        )
        signature = hmac.new(
            signing_key, string_to_sign.encode(), hashlib.sha256
        ).hexdigest()

        headers["Authorization"] = (
            f"AWS4-HMAC-SHA256 "
            f"Credential={self._access_key}/{credential_scope}, "
            f"SignedHeaders={signed_headers}, "
            f"Signature={signature}"
        )
        return headers

    async def upload(
        self,
        file_data: bytes,
        file_name: str,
        content_type: str,
        folder: str = "",
    ) -> StoredFile:
        key = f"{folder}/{file_name}" if folder else file_name
        path = f"/{self._bucket}/{quote(key, safe='/')}"
        payload_hash = hashlib.sha256(file_data).hexdigest()

        headers = {
            "host": f"{self._account_id}.r2.cloudflarestorage.com",
            "content-type": content_type,
        }
        headers = self._sign_request("PUT", path, headers, payload_hash)

        async with httpx.AsyncClient() as client:
            resp = await client.put(
                f"{self._endpoint}{path}",
                content=file_data,
                headers=headers,
            )
            resp.raise_for_status()

        return StoredFile(
            file_path=key,
            file_url=f"{self._public_url}/{key}" if self._public_url else key,
            file_size=len(file_data),
            content_type=content_type,
        )

    async def delete(self, file_path: str) -> None:
        path = f"/{self._bucket}/{quote(file_path, safe='/')}"
        payload_hash = hashlib.sha256(b"").hexdigest()

        headers = {
            "host": f"{self._account_id}.r2.cloudflarestorage.com",
        }
        headers = self._sign_request("DELETE", path, headers, payload_hash)

        async with httpx.AsyncClient() as client:
            resp = await client.delete(
                f"{self._endpoint}{path}",
                headers=headers,
            )
            resp.raise_for_status()

    async def get_url(self, file_path: str) -> str:
        if self._public_url:
            return f"{self._public_url}/{file_path}"
        return f"{self._endpoint}/{self._bucket}/{file_path}"
