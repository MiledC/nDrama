import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from tests.factories import make_coin_package, make_episode, make_series, make_user


@pytest.mark.asyncio
async def test_get_balance(client, active_subscriber):
    """Balance endpoint returns current coin_balance."""
    sub, token = active_subscriber
    response = await client.get(
        "/api/coins/balance", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    assert response.json()["balance"] == 100


@pytest.mark.asyncio
async def test_balance_anonymous_rejected(client, anonymous_subscriber):
    """Anonymous subscriber cannot check balance."""
    sub, token = anonymous_subscriber
    response = await client.get(
        "/api/coins/balance", headers={"X-Session-Token": token}
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_packages(client, active_subscriber, db_session: AsyncSession):
    """List active packages only."""
    sub, token = active_subscriber
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    pkg1 = make_coin_package(user.id, name="Starter", is_active=True)
    pkg2 = make_coin_package(user.id, name="Inactive", is_active=False)
    db_session.add_all([pkg1, pkg2])
    await db_session.commit()

    response = await client.get(
        "/api/coins/packages", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    data = response.json()
    names = [p["name"] for p in data]
    assert "Starter" in names
    assert "Inactive" not in names


@pytest.mark.asyncio
async def test_purchase_package(client, active_subscriber, db_session: AsyncSession):
    """Purchase credits coins to subscriber."""
    sub, token = active_subscriber
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    pkg = make_coin_package(user.id, coin_amount=50)
    db_session.add(pkg)
    await db_session.commit()

    response = await client.post(
        "/api/coins/purchase",
        json={"package_id": str(pkg.id)},
        headers={"X-Session-Token": token},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["amount"] == 50
    assert data["balance_after"] == 150  # 100 + 50


@pytest.mark.asyncio
async def test_purchase_nonexistent_package(client, active_subscriber):
    """Purchasing nonexistent package returns 404."""
    sub, token = active_subscriber
    response = await client.post(
        "/api/coins/purchase",
        json={"package_id": str(uuid.uuid4())},
        headers={"X-Session-Token": token},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_spend_coins(client, active_subscriber, db_session: AsyncSession):
    """Spend coins to unlock an episode."""
    sub, token = active_subscriber
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    series = make_series(user.id, free_episode_count=0, coin_cost_per_episode=10)
    db_session.add(series)
    await db_session.flush()

    ep = make_episode(series.id, user.id, episode_number=1, status="published")
    db_session.add(ep)
    await db_session.commit()

    response = await client.post(
        "/api/coins/spend",
        json={"episode_id": str(ep.id)},
        headers={"X-Session-Token": token},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["new_balance"] == 90  # 100 - 10
    assert data["episode_id"] == str(ep.id)


@pytest.mark.asyncio
async def test_spend_on_free_episode(
    client, active_subscriber, db_session: AsyncSession
):
    """Spending on free episode returns 400."""
    sub, token = active_subscriber
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    series = make_series(user.id, free_episode_count=5)
    db_session.add(series)
    await db_session.flush()

    ep = make_episode(series.id, user.id, episode_number=1, status="published")
    db_session.add(ep)
    await db_session.commit()

    response = await client.post(
        "/api/coins/spend",
        json={"episode_id": str(ep.id)},
        headers={"X-Session-Token": token},
    )
    assert response.status_code == 400
    assert "free" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_spend_insufficient_balance(
    client, active_subscriber, db_session: AsyncSession
):
    """Insufficient balance returns 402."""
    sub, token = active_subscriber
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    series = make_series(user.id, free_episode_count=0, coin_cost_per_episode=999)
    db_session.add(series)
    await db_session.flush()

    ep = make_episode(series.id, user.id, episode_number=1, status="published")
    db_session.add(ep)
    await db_session.commit()

    response = await client.post(
        "/api/coins/spend",
        json={"episode_id": str(ep.id)},
        headers={"X-Session-Token": token},
    )
    assert response.status_code == 402


@pytest.mark.asyncio
async def test_spend_already_unlocked(
    client, active_subscriber, db_session: AsyncSession
):
    """Spending on already unlocked episode returns 400."""
    sub, token = active_subscriber
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    series = make_series(user.id, free_episode_count=0, coin_cost_per_episode=10)
    db_session.add(series)
    await db_session.flush()

    ep = make_episode(series.id, user.id, episode_number=1, status="published")
    db_session.add(ep)
    await db_session.commit()

    # First spend succeeds
    await client.post(
        "/api/coins/spend",
        json={"episode_id": str(ep.id)},
        headers={"X-Session-Token": token},
    )
    # Second spend fails
    response = await client.post(
        "/api/coins/spend",
        json={"episode_id": str(ep.id)},
        headers={"X-Session-Token": token},
    )
    assert response.status_code == 400
    assert "already" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_transaction_history(
    client, active_subscriber, db_session: AsyncSession
):
    """Transaction history returns paginated results."""
    sub, token = active_subscriber
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    # Create a purchase to generate a transaction
    pkg = make_coin_package(user.id, coin_amount=50)
    db_session.add(pkg)
    await db_session.commit()

    await client.post(
        "/api/coins/purchase",
        json={"package_id": str(pkg.id)},
        headers={"X-Session-Token": token},
    )

    response = await client.get(
        "/api/coins/transactions", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert len(data["items"]) >= 1
