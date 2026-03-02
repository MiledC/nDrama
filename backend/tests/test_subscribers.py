"""Tests for subscriber management endpoints."""

import uuid

import httpx
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.subscriber import SubscriberStatus
from tests.factories import make_coin_transaction, make_subscriber


@pytest.mark.asyncio
async def test_list_subscribers(admin_client: httpx.AsyncClient, db_session: AsyncSession):
    """Test listing subscribers with pagination."""
    sub1 = make_subscriber(name="Alice", email="alice@test.com", status=SubscriberStatus.active)
    sub2 = make_subscriber(name="Bob", email="bob@test.com", status=SubscriberStatus.active)
    db_session.add_all([sub1, sub2])
    await db_session.commit()

    response = await admin_client.get("/api/subscribers")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2
    assert data["page"] == 1
    assert data["per_page"] == 20


@pytest.mark.asyncio
async def test_list_subscribers_search(admin_client: httpx.AsyncClient, db_session: AsyncSession):
    """Test searching subscribers by name or email."""
    sub1 = make_subscriber(name="Alice Smith", email="alice@test.com")
    sub2 = make_subscriber(name="Bob Jones", email="bob@test.com")
    db_session.add_all([sub1, sub2])
    await db_session.commit()

    response = await admin_client.get("/api/subscribers", params={"search": "alice"})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == "Alice Smith"


@pytest.mark.asyncio
async def test_list_subscribers_filter_status(
    admin_client: httpx.AsyncClient, db_session: AsyncSession
):
    """Test filtering subscribers by status."""
    sub1 = make_subscriber(status=SubscriberStatus.active, email="a1@test.com")
    sub2 = make_subscriber(status=SubscriberStatus.suspended, email="a2@test.com")
    db_session.add_all([sub1, sub2])
    await db_session.commit()

    response = await admin_client.get("/api/subscribers", params={"status": "active"})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["status"] == "active"


@pytest.mark.asyncio
async def test_list_subscribers_as_editor(
    editor_client: httpx.AsyncClient, db_session: AsyncSession
):
    """Editors can view subscribers."""
    sub = make_subscriber(email="viewer@test.com")
    db_session.add(sub)
    await db_session.commit()

    response = await editor_client.get("/api/subscribers")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_list_subscribers_no_auth(client: httpx.AsyncClient):
    """Unauthenticated requests are rejected."""
    response = await client.get("/api/subscribers")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_get_subscriber(admin_client: httpx.AsyncClient, db_session: AsyncSession):
    """Test getting a single subscriber."""
    sub = make_subscriber(
        name="Alice", email="alice@test.com", status=SubscriberStatus.active, coin_balance=50
    )
    db_session.add(sub)
    await db_session.commit()

    response = await admin_client.get(f"/api/subscribers/{sub.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Alice"
    assert data["email"] == "alice@test.com"
    assert data["coin_balance"] == 50
    assert data["status"] == "active"


@pytest.mark.asyncio
async def test_get_subscriber_not_found(admin_client: httpx.AsyncClient):
    """Test 404 on non-existent subscriber."""
    response = await admin_client.get(f"/api/subscribers/{uuid.uuid4()}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_subscriber_status_admin(
    admin_client: httpx.AsyncClient, db_session: AsyncSession
):
    """Admin can suspend a subscriber."""
    sub = make_subscriber(status=SubscriberStatus.active, email="suspend@test.com")
    db_session.add(sub)
    await db_session.commit()

    response = await admin_client.patch(
        f"/api/subscribers/{sub.id}",
        json={"status": "suspended", "admin_notes": "Violation of TOS"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "suspended"
    assert data["admin_notes"] == "Violation of TOS"


@pytest.mark.asyncio
async def test_update_subscriber_editor_rejected(
    editor_client: httpx.AsyncClient, db_session: AsyncSession
):
    """Editors cannot modify subscribers."""
    sub = make_subscriber(email="noedit@test.com")
    db_session.add(sub)
    await db_session.commit()

    response = await editor_client.patch(
        f"/api/subscribers/{sub.id}",
        json={"status": "suspended"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_subscriber_not_found(admin_client: httpx.AsyncClient):
    """Test 404 on updating non-existent subscriber."""
    response = await admin_client.patch(
        f"/api/subscribers/{uuid.uuid4()}",
        json={"status": "suspended"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_adjust_coins_credit(
    admin_client: httpx.AsyncClient, db_session: AsyncSession
):
    """Admin can credit coins to a subscriber."""
    sub = make_subscriber(
        coin_balance=0, status=SubscriberStatus.active, email="credit@test.com"
    )
    db_session.add(sub)
    await db_session.commit()

    response = await admin_client.post(
        f"/api/subscribers/{sub.id}/adjust-coins",
        json={"amount": 100, "description": "Welcome bonus"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["coin_balance"] == 100


@pytest.mark.asyncio
async def test_adjust_coins_debit(
    admin_client: httpx.AsyncClient, db_session: AsyncSession
):
    """Admin can debit coins from a subscriber."""
    sub = make_subscriber(
        coin_balance=100, status=SubscriberStatus.active, email="debit@test.com"
    )
    db_session.add(sub)
    await db_session.commit()

    response = await admin_client.post(
        f"/api/subscribers/{sub.id}/adjust-coins",
        json={"amount": -30, "description": "Refund correction"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["coin_balance"] == 70


@pytest.mark.asyncio
async def test_adjust_coins_negative_balance_rejected(
    admin_client: httpx.AsyncClient, db_session: AsyncSession
):
    """Cannot debit more coins than available."""
    sub = make_subscriber(
        coin_balance=10, status=SubscriberStatus.active, email="negbal@test.com"
    )
    db_session.add(sub)
    await db_session.commit()

    response = await admin_client.post(
        f"/api/subscribers/{sub.id}/adjust-coins",
        json={"amount": -50, "description": "Too much"},
    )
    assert response.status_code == 400
    assert "Insufficient" in response.json()["detail"]


@pytest.mark.asyncio
async def test_adjust_coins_editor_rejected(
    editor_client: httpx.AsyncClient, db_session: AsyncSession
):
    """Editors cannot adjust coins."""
    sub = make_subscriber(email="noadjust@test.com")
    db_session.add(sub)
    await db_session.commit()

    response = await editor_client.post(
        f"/api/subscribers/{sub.id}/adjust-coins",
        json={"amount": 100, "description": "Attempt"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_subscriber_transactions(
    admin_client: httpx.AsyncClient, db_session: AsyncSession
):
    """Test getting transaction history for a subscriber."""
    sub = make_subscriber(coin_balance=100, email="txhist@test.com")
    db_session.add(sub)
    await db_session.commit()

    tx1 = make_coin_transaction(sub.id, amount=50, balance_after=50, description="First")
    tx2 = make_coin_transaction(sub.id, amount=50, balance_after=100, description="Second")
    db_session.add_all([tx1, tx2])
    await db_session.commit()

    response = await admin_client.get(f"/api/subscribers/{sub.id}/transactions")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2
