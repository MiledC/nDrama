import pytest


@pytest.mark.asyncio
async def test_get_profile(client, active_subscriber):
    """GET /me returns subscriber profile."""
    sub, token = active_subscriber
    response = await client.get(
        "/api/me", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == sub.email
    assert data["status"] == "active"
    assert data["coin_balance"] == 100


@pytest.mark.asyncio
async def test_get_profile_anonymous(client, anonymous_subscriber):
    """Anonymous subscriber can view profile."""
    sub, token = anonymous_subscriber
    response = await client.get(
        "/api/me", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "anonymous"


@pytest.mark.asyncio
async def test_update_profile(client, active_subscriber):
    """PATCH /me updates allowed fields."""
    sub, token = active_subscriber
    response = await client.patch(
        "/api/me",
        json={"name": "Updated Name", "language": "en"},
        headers={"X-Session-Token": token},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["language"] == "en"


@pytest.mark.asyncio
async def test_update_profile_anonymous_rejected(client, anonymous_subscriber):
    """Anonymous subscriber cannot update profile."""
    sub, token = anonymous_subscriber
    response = await client.patch(
        "/api/me",
        json={"name": "Anon Name"},
        headers={"X-Session-Token": token},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_account(client, active_subscriber):
    """DELETE /me soft-deletes account."""
    sub, token = active_subscriber
    response = await client.delete(
        "/api/me", headers={"X-Session-Token": token}
    )
    assert response.status_code == 204

    # Token should be invalid after deletion
    response = await client.get(
        "/api/me", headers={"X-Session-Token": token}
    )
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_delete_account_anonymous_rejected(client, anonymous_subscriber):
    """Anonymous subscriber cannot delete account."""
    sub, token = anonymous_subscriber
    response = await client.delete(
        "/api/me", headers={"X-Session-Token": token}
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_no_auth_rejected(client):
    """No session token returns 401."""
    response = await client.get("/api/me")
    assert response.status_code == 401
