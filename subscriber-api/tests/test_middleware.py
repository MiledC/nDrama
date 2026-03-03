import pytest


@pytest.mark.asyncio
async def test_missing_session_token(client):
    """Request without X-Session-Token returns 401."""
    response = await client.get("/api/me")
    assert response.status_code == 401
    assert "missing" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_invalid_session_token(client):
    """Invalid token returns 401."""
    response = await client.get(
        "/api/me", headers={"X-Session-Token": "ndrama_sess_invalid_token"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_suspended_subscriber_returns_403(client, suspended_subscriber):
    """Suspended subscriber gets 403."""
    sub, token = suspended_subscriber
    response = await client.get(
        "/api/me", headers={"X-Session-Token": token}
    )
    assert response.status_code == 403
    assert "suspended" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_health_no_auth_required(client):
    """Health endpoint doesn't require auth."""
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
