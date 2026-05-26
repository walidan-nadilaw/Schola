"""Tests for users feature: CRUD with role-based access."""

import pytest
from httpx import AsyncClient


async def _register_and_login(
    client: AsyncClient, email: str, password: str = "pass123"
):
    """Helper: register + login, return token."""
    await client.post("/auth/register", json={"email": email, "password": password})
    resp = await client.post("/auth/login", json={"email": email, "password": password})
    return resp.json()["data"]["token"]


async def _auth_header(client: AsyncClient, email: str) -> dict:
    token = await _register_and_login(client, email)
    return {"Authorization": f"Bearer {token}"}


# -- List / Get --


@pytest.mark.asyncio
async def test_list_users_requires_auth(client: AsyncClient):
    resp = await client.get("/users/")
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_list_users_success(client: AsyncClient):
    headers = await _auth_header(client, "lister@apps.ipb.ac.id")
    resp = await client.get("/users/", headers=headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "data" in data
    assert "pagination" in data
    assert data["pagination"]["total_items"] >= 1


@pytest.mark.asyncio
async def test_get_user_success(client: AsyncClient):
    headers = await _auth_header(client, "getter@apps.ipb.ac.id")
    # list to get a user id
    users = (await client.get("/users/", headers=headers)).json()["data"]["data"]
    uid = users[0]["id"]

    resp = await client.get(f"/users/{uid}", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["id"] == uid


@pytest.mark.asyncio
async def test_get_user_not_found(client: AsyncClient):
    headers = await _auth_header(client, "getfail@apps.ipb.ac.id")
    resp = await client.get(
        "/users/00000000-0000-0000-0000-000000000000", headers=headers
    )
    assert resp.status_code == 404


# -- Create / Update / Delete (operator only) --


@pytest.mark.asyncio
async def test_create_user_forbidden_for_mahasiswa(client: AsyncClient):
    headers = await _auth_header(client, "mhs@apps.ipb.ac.id")
    resp = await client.post(
        "/users/",
        headers=headers,
        json={
            "email": "new@apps.ipb.ac.id",
            "password": "test123",
        },
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_delete_user_forbidden_for_mahasiswa(client: AsyncClient):
    headers = await _auth_header(client, "mhs2@apps.ipb.ac.id")
    resp = await client.delete(
        "/users/00000000-0000-0000-0000-000000000000", headers=headers
    )
    assert resp.status_code == 403


# -- Search / filter --


@pytest.mark.asyncio
async def test_search_users_by_email(client: AsyncClient):
    headers = await _auth_header(client, "search_u1@apps.ipb.ac.id")
    resp = await client.get("/users", params={"search": "search_u1"}, headers=headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert len(data["data"]) == 1
    assert "search_u1" in data["data"][0]["email"]


@pytest.mark.asyncio
async def test_filter_users_by_role(client: AsyncClient):
    from sqlalchemy import text
    from tests.conftest import engine

    # Create an operator
    op_email = "role_op@apps.ipb.ac.id"
    await client.post("/auth/register", json={"email": op_email, "password": "pass123"})
    async with engine.begin() as conn:
        await conn.execute(
            text("UPDATE users SET role = 'OPERATOR_LEMBAGA' WHERE email = :e"),
            {"e": op_email},
        )

    # Login as mahasiswa and filter by role
    headers = await _auth_header(client, "role_mhs@apps.ipb.ac.id")
    resp = await client.get("/users/?role=MAHASISWA", headers=headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    for u in data["data"]:
        assert u["role"] == "MAHASISWA"
