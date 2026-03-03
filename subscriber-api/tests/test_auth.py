import pytest


@pytest.mark.asyncio
async def test_device_register(client):
    """Device registration creates anonymous subscriber."""
    response = await client.post(
        "/api/auth/device", json={"device_id": "test-device-001"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "session_token" in data
    assert "subscriber_id" in data


@pytest.mark.asyncio
async def test_device_register_idempotent(client):
    """Same device_id returns same subscriber."""
    r1 = await client.post(
        "/api/auth/device", json={"device_id": "test-device-002"}
    )
    r2 = await client.post(
        "/api/auth/device", json={"device_id": "test-device-002"}
    )
    assert r1.json()["subscriber_id"] == r2.json()["subscriber_id"]


@pytest.mark.asyncio
async def test_register_account(client, anonymous_subscriber):
    """Anonymous subscriber can register with email/password."""
    sub, token = anonymous_subscriber
    response = await client.post(
        "/api/auth/register",
        json={
            "email": "newuser@test.com",
            "password": "securepass123",
            "name": "New User",
        },
        headers={"X-Session-Token": token},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["subscriber"]["status"] == "active"
    assert data["subscriber"]["email"] == "newuser@test.com"
    assert "session_token" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(
    client, anonymous_subscriber, active_subscriber
):
    """Registration fails with duplicate email."""
    sub, token = anonymous_subscriber
    active_sub, _ = active_subscriber
    response = await client.post(
        "/api/auth/register",
        json={
            "email": active_sub.email,
            "password": "securepass123",
            "name": "Dup User",
        },
        headers={"X-Session-Token": token},
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_register_already_active(client, active_subscriber):
    """Active subscriber cannot register again."""
    sub, token = active_subscriber
    response = await client.post(
        "/api/auth/register",
        json={
            "email": "another@test.com",
            "password": "securepass123",
            "name": "Active User",
        },
        headers={"X-Session-Token": token},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_login_success(client, active_subscriber, db_session):
    """Valid credentials return session token."""
    sub, _ = active_subscriber
    response = await client.post(
        "/api/auth/login",
        json={"email": sub.email, "password": "testpass123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "session_token" in data
    assert data["subscriber"]["email"] == sub.email


@pytest.mark.asyncio
async def test_login_wrong_password(client, active_subscriber):
    """Wrong password returns 401."""
    sub, _ = active_subscriber
    response = await client.post(
        "/api/auth/login",
        json={"email": sub.email, "password": "wrongpassword"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_email(client):
    """Nonexistent email returns 401."""
    response = await client.post(
        "/api/auth/login",
        json={"email": "noone@test.com", "password": "whatever"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_suspended_account(client, suspended_subscriber, db_session):
    """Suspended subscriber gets 403 on session auth."""
    sub, token = suspended_subscriber
    response = await client.get(
        "/api/me", headers={"X-Session-Token": token}
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_logout(client, active_subscriber):
    """Logout invalidates session token."""
    sub, token = active_subscriber
    # Logout
    response = await client.post(
        "/api/auth/logout", headers={"X-Session-Token": token}
    )
    assert response.status_code == 204

    # Token should be invalid now
    response = await client.get(
        "/api/me", headers={"X-Session-Token": token}
    )
    assert response.status_code == 401
