from __future__ import annotations

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

from backend.database import Base, get_db
from backend.main import app

TEST_DATABASE_URL = "sqlite://"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db() -> Generator:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_test_db() -> Generator[None, None, None]:
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    try:
        yield
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as test_client:
        yield test_client


def register_payload() -> dict[str, object]:
    return {
        "email": "student@example.com",
        "nama": "Student One",
        "role": "mahasiswa",
        "password": "password123",
        "nim": "12345678",
        "fakultas": "Fakultas Teknik",
        "program_studi": "Informatika",
        "status_aktif": "aktif",
    }


def test_register_user_success(client: TestClient) -> None:
    response = client.post("/auth/register", json=register_payload())

    assert response.status_code == 201
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["email"] == "student@example.com"
    assert body["user"]["nama"] == "Student One"
    assert body["user"]["role"] == "mahasiswa"


def test_register_user_rejects_duplicate_email(client: TestClient) -> None:
    response_one = client.post("/auth/register", json=register_payload())
    assert response_one.status_code == 201

    response_two = client.post("/auth/register", json=register_payload())

    assert response_two.status_code == 400
    assert response_two.json()["detail"] == "Email is already registered"


def test_login_user_success(client: TestClient) -> None:
    client.post("/auth/register", json=register_payload())

    response = client.post(
        "/auth/login",
        json={"email": "student@example.com", "password": "password123"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["email"] == "student@example.com"


def test_login_user_rejects_bad_password(client: TestClient) -> None:
    client.post("/auth/register", json=register_payload())

    response = client.post(
        "/auth/login",
        json={"email": "student@example.com", "password": "wrong-password"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"


def test_current_user_requires_token(client: TestClient) -> None:
    response = client.get("/auth/me")

    assert response.status_code == 401


def test_current_user_returns_profile_with_token(client: TestClient) -> None:
    register_response = client.post("/auth/register", json=register_payload())
    token = register_response.json()["access_token"]

    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "student@example.com"
    assert body["nama"] == "Student One"
    assert body["role"] == "mahasiswa"
