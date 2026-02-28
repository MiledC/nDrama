import uuid

import httpx


def _unique_email(label: str) -> str:
    """Return a unique email for each test invocation to avoid collisions."""
    return f"test_{label}_{uuid.uuid4().hex[:8]}@example.com"


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
    assert response.status_code in (401, 403)
