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


@pytest.mark.asyncio
async def test_otp_request(client):
    """OTP request returns success message."""
    response = await client.post(
        "/api/auth/otp/request", json={"phone": "+966512345678"}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "OTP sent"


@pytest.mark.asyncio
async def test_otp_verify_stub_code(client):
    """Stub OTP code 1234 creates new subscriber and returns session."""
    response = await client.post(
        "/api/auth/otp/verify",
        json={"phone": "+966512345678", "code": "1234"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "session_token" in data
    assert data["subscriber"]["status"] == "active"
    assert data["is_new_account"] is True


@pytest.mark.asyncio
async def test_otp_verify_returning_user(client):
    """Existing phone returns same subscriber, is_new_account=False."""
    # First verify creates account
    await client.post(
        "/api/auth/otp/verify",
        json={"phone": "+966598765432", "code": "1234"},
    )
    # Second verify returns existing
    r2 = await client.post(
        "/api/auth/otp/verify",
        json={"phone": "+966598765432", "code": "1234"},
    )
    assert r2.status_code == 200
    assert r2.json()["is_new_account"] is False


@pytest.mark.asyncio
async def test_otp_verify_wrong_code(client):
    """Wrong OTP code returns 401."""
    response = await client.post(
        "/api/auth/otp/verify",
        json={"phone": "+966512345678", "code": "9999"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_otp_verify_invalid_phone(client):
    """Invalid phone format returns 422."""
    response = await client.post(
        "/api/auth/otp/verify",
        json={"phone": "12345", "code": "1234"},
    )
    assert response.status_code == 422
