"""Tests for notifications feature: list + mark as read."""

import pytest
from httpx import AsyncClient
from sqlalchemy import text

from tests.conftest import engine


async def _register_and_login(client: AsyncClient, email: str, pw: str = "pass123"):
    await client.post("/auth/register", json={"email": email, "password": pw})
    resp = await client.post("/auth/login", json={"email": email, "password": pw})
    return resp.json()["data"]["token"]


async def _auth_header(client: AsyncClient, email: str) -> dict:
    token = await _register_and_login(client, email)
    return {"Authorization": f"Bearer {token}"}


# -- Auth guard --


@pytest.mark.asyncio
async def test_list_notifications_requires_auth(client: AsyncClient):
    resp = await client.get("/notifications/")
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_mark_read_requires_auth(client: AsyncClient):
    resp = await client.post("/notifications/00000000-0000-0000-0000-000000000001/read")
    assert resp.status_code in (401, 403)


# -- Empty list --


@pytest.mark.asyncio
async def test_list_notifications_empty(client: AsyncClient):
    headers = await _auth_header(client, "notif_empty@apps.ipb.ac.id")
    resp = await client.get("/notifications/", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


# -- Mark read not found --


@pytest.mark.asyncio
async def test_mark_read_not_found(client: AsyncClient):
    headers = await _auth_header(client, "notif_nf@apps.ipb.ac.id")
    resp = await client.post(
        "/notifications/00000000-0000-0000-0000-000000000099/read",
        headers=headers,
    )
    assert resp.status_code == 404


# -- Mark read wrong user --


@pytest.mark.asyncio
async def test_mark_read_wrong_user(client: AsyncClient):
    # user A creates notification
    h_a = await _auth_header(client, "notif_a@apps.ipb.ac.id")
    async with engine.begin() as conn:
        await conn.execute(
            text(
                """
                INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at)
                SELECT gen_random_uuid(), id, 'test', 'Test', 'Test msg', false, NOW()
                FROM users WHERE email = 'notif_a@apps.ipb.ac.id'
                """
            )
        )
        result = await conn.execute(text("SELECT id FROM notifications WHERE type='test'"))
        notif_id = str(result.scalar_one())

    # user B tries to mark it as read
    h_b = await _auth_header(client, "notif_b@apps.ipb.ac.id")
    resp = await client.post(f"/notifications/{notif_id}/read", headers=h_b)
    assert resp.status_code == 403


# -- Full flow: list + mark read --


@pytest.mark.asyncio
async def test_full_notification_flow(client: AsyncClient):
    headers = await _auth_header(client, "notif_flow@apps.ipb.ac.id")

    # insert a notification
    async with engine.begin() as conn:
        await conn.execute(
            text(
                """
                INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at)
                SELECT gen_random_uuid(), id, 'submission_approved', 'Disetujui', 'Pengajuan Anda disetujui', false, NOW()
                FROM users WHERE email = 'notif_flow@apps.ipb.ac.id'
                """
            )
        )
        result = await conn.execute(
            text("SELECT id FROM notifications WHERE type='submission_approved'")
        )
        notif_id = str(result.scalar_one())

    # list — should have 1
    resp = await client.get("/notifications/", headers=headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert len(data) == 1
    assert data[0]["type"] == "submission_approved"
    assert data[0]["is_read"] is False

    # mark as read
    resp = await client.post(f"/notifications/{notif_id}/read", headers=headers)
    assert resp.status_code == 204

    # list — should now be read
    resp = await client.get("/notifications/", headers=headers)
    assert resp.json()["data"][0]["is_read"] is True
