import uuid

import httpx
import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.database import get_db
from app.main import app


def _unique_email(label: str) -> str:
    """Return a unique email for each test invocation to avoid collisions."""
    return f"test_{label}_{uuid.uuid4().hex[:8]}@example.com"


@pytest.fixture
async def client():
    # Create a fresh engine per test to avoid connection pool sharing issues
    test_engine = create_async_engine(settings.database_url)
    test_session_maker = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async def override_get_db():
        async with test_session_maker() as session:
            try:
                yield session
            finally:
                await session.close()

    app.dependency_overrides[get_db] = override_get_db

    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app),
        base_url="http://testserver",
    ) as ac:
        yield ac

    # Cleanup: remove all test users created during this test
    async with test_session_maker() as session:
        await session.execute(text("DELETE FROM users WHERE email LIKE 'test_%'"))
        await session.commit()

    app.dependency_overrides.clear()
    await test_engine.dispose()


# --- Registration ---

async def test_register_success(client):
    email = _unique_email("register")
    response = await client.post("/api/auth/register", json={
        "email": email,
        "password": "securepassword123",
        "name": "Test User",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["access_token"]
    assert data["refresh_token"]
    assert data["token_type"] == "bearer"


async def test_register_duplicate_email(client):
    email = _unique_email("duplicate")
    payload = {
        "email": email,
        "password": "securepassword123",
        "name": "Test User",
    }
    await client.post("/api/auth/register", json=payload)
    response = await client.post("/api/auth/register", json=payload)
    assert response.status_code == 409


async def test_register_invalid_email(client):
    response = await client.post("/api/auth/register", json={
        "email": "not-an-email",
        "password": "securepassword123",
        "name": "Test User",
    })
    assert response.status_code == 422


# --- Login ---

async def test_login_success(client):
    email = _unique_email("login")
    await client.post("/api/auth/register", json={
        "email": email,
        "password": "securepassword123",
        "name": "Login User",
    })
    response = await client.post("/api/auth/login", json={
        "email": email,
        "password": "securepassword123",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["access_token"]
    assert data["refresh_token"]


async def test_login_wrong_password(client):
    email = _unique_email("wrongpw")
    await client.post("/api/auth/register", json={
        "email": email,
        "password": "securepassword123",
        "name": "Wrong Pass User",
    })
    response = await client.post("/api/auth/login", json={
        "email": email,
        "password": "wrongpassword",
    })
    assert response.status_code == 401


async def test_login_nonexistent_user(client):
    response = await client.post("/api/auth/login", json={
        "email": _unique_email("nobody"),
        "password": "whatever",
    })
    assert response.status_code == 401


# --- Refresh ---

async def test_refresh_token_success(client):
    email = _unique_email("refresh")
    reg = await client.post("/api/auth/register", json={
        "email": email,
        "password": "securepassword123",
        "name": "Refresh User",
    })
    refresh_token = reg.json()["refresh_token"]
    response = await client.post("/api/auth/refresh", json={
        "refresh_token": refresh_token,
    })
    assert response.status_code == 200
    assert response.json()["access_token"]


async def test_refresh_with_access_token_fails(client):
    email = _unique_email("badrefresh")
    reg = await client.post("/api/auth/register", json={
        "email": email,
        "password": "securepassword123",
        "name": "Bad Refresh User",
    })
    access_token = reg.json()["access_token"]
    response = await client.post("/api/auth/refresh", json={
        "refresh_token": access_token,
    })
    assert response.status_code == 401


# --- Me ---

async def test_me_success(client):
    email = _unique_email("me")
    reg = await client.post("/api/auth/register", json={
        "email": email,
        "password": "securepassword123",
        "name": "Me User",
    })
    access_token = reg.json()["access_token"]
    response = await client.get("/api/auth/me", headers={
        "Authorization": f"Bearer {access_token}",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == email
    assert data["name"] == "Me User"
    assert data["role"] == "editor"


async def test_me_no_token(client):
    response = await client.get("/api/auth/me")
    # HTTPBearer returns 403 (sync TestClient) or 401 (async httpx) when no
    # credentials are provided.  Either indicates the request was rejected.
    assert response.status_code in (401, 403)
