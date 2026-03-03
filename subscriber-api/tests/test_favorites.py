import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from tests.factories import make_series, make_user


@pytest.mark.asyncio
async def test_add_favorite(client, active_subscriber, db_session: AsyncSession):
    """Add series to favorites."""
    sub, token = active_subscriber
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    series = make_series(user.id)
    db_session.add(series)
    await db_session.commit()

    response = await client.post(
        f"/api/favorites/{series.id}", headers={"X-Session-Token": token}
    )
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_add_favorite_idempotent(
    client, active_subscriber, db_session: AsyncSession
):
    """Adding same favorite twice doesn't error."""
    sub, token = active_subscriber
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    series = make_series(user.id)
    db_session.add(series)
    await db_session.commit()

    await client.post(
        f"/api/favorites/{series.id}", headers={"X-Session-Token": token}
    )
    response = await client.post(
        f"/api/favorites/{series.id}", headers={"X-Session-Token": token}
    )
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_list_favorites(client, active_subscriber, db_session: AsyncSession):
    """List returns favorited series."""
    sub, token = active_subscriber
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    series = make_series(user.id)
    db_session.add(series)
    await db_session.commit()

    await client.post(
        f"/api/favorites/{series.id}", headers={"X-Session-Token": token}
    )

    response = await client.get(
        "/api/favorites", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_remove_favorite(client, active_subscriber, db_session: AsyncSession):
    """Remove favorite returns 204."""
    sub, token = active_subscriber
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    series = make_series(user.id)
    db_session.add(series)
    await db_session.commit()

    await client.post(
        f"/api/favorites/{series.id}", headers={"X-Session-Token": token}
    )
    response = await client.delete(
        f"/api/favorites/{series.id}", headers={"X-Session-Token": token}
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_remove_favorite_idempotent(client, active_subscriber):
    """Removing non-favorite doesn't error."""
    sub, token = active_subscriber
    response = await client.delete(
        f"/api/favorites/{uuid.uuid4()}", headers={"X-Session-Token": token}
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_favorite_nonexistent_series(client, active_subscriber):
    """Favoriting non-existent series returns 404."""
    sub, token = active_subscriber
    response = await client.post(
        f"/api/favorites/{uuid.uuid4()}", headers={"X-Session-Token": token}
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_favorites_anonymous_rejected(client, anonymous_subscriber):
    """Anonymous subscriber cannot use favorites."""
    sub, token = anonymous_subscriber
    response = await client.get(
        "/api/favorites", headers={"X-Session-Token": token}
    )
    assert response.status_code == 403
