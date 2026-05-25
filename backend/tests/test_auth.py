"""Tests for auth feature: register, login, me, logout."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    resp = await client.post("/auth/register", json={
        "email": "student@apps.ipb.ac.id",
        "password": "secret123",
        "role": "mahasiswa",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "success"
    assert data["data"]["email"] == "student@apps.ipb.ac.id"
    assert data["data"]["role"] == "mahasiswa"
    assert data["data"]["is_email_verified"] is False


@pytest.mark.asyncio
async def test_register_bad_domain(client: AsyncClient):
    resp = await client.post("/auth/register", json={
        "email": "user@gmail.com",
        "password": "secret123",
    })
    assert resp.status_code == 400
    assert "tidak diizinkan" in resp.json()["error"]


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {"email": "dup@apps.ipb.ac.id", "password": "pass123"}
    await client.post("/auth/register", json=payload)
    resp = await client.post("/auth/register", json=payload)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    await client.post("/auth/register", json={
        "email": "login@apps.ipb.ac.id",
        "password": "mypassword",
    })
    resp = await client.post("/auth/login", json={
        "email": "login@apps.ipb.ac.id",
        "password": "mypassword",
    })
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "token" in data
    assert data["expires_in"] > 0


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post("/auth/register", json={
        "email": "wrong@apps.ipb.ac.id",
        "password": "correct",
    })
    resp = await client.post("/auth/login", json={
        "email": "wrong@apps.ipb.ac.id",
        "password": "incorrect",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_requires_auth(client: AsyncClient):
    resp = await client.get("/auth/me")
    assert resp.status_code in (401, 403)  # HTTPBearer returns 403 when missing


@pytest.mark.asyncio
async def test_me_with_token(client: AsyncClient):
    await client.post("/auth/register", json={
        "email": "me@apps.ipb.ac.id",
        "password": "pass123",
    })
    login = await client.post("/auth/login", json={
        "email": "me@apps.ipb.ac.id",
        "password": "pass123",
    })
    token = login.json()["data"]["token"]

    resp = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["data"]["email"] == "me@apps.ipb.ac.id"
