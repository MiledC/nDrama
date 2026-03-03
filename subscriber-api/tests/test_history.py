import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from tests.factories import make_episode, make_series, make_user


@pytest.mark.asyncio
async def test_report_progress(
    client, anonymous_subscriber, db_session: AsyncSession
):
    """Any authenticated subscriber can report progress."""
    sub, token = anonymous_subscriber
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    series = make_series(user.id)
    db_session.add(series)
    await db_session.flush()

    ep = make_episode(
        series.id, user.id, episode_number=1, status="published", duration_seconds=600
    )
    db_session.add(ep)
    await db_session.commit()

    response = await client.post(
        f"/api/history/{ep.id}",
        json={"progress_seconds": 120},
        headers={"X-Session-Token": token},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_report_progress_upsert(
    client, anonymous_subscriber, db_session: AsyncSession
):
    """Subsequent reports update existing record."""
    sub, token = anonymous_subscriber
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    series = make_series(user.id)
    db_session.add(series)
    await db_session.flush()

    ep = make_episode(
        series.id, user.id, episode_number=1, status="published", duration_seconds=600
    )
    db_session.add(ep)
    await db_session.commit()

    await client.post(
        f"/api/history/{ep.id}",
        json={"progress_seconds": 120},
        headers={"X-Session-Token": token},
    )
    response = await client.post(
        f"/api/history/{ep.id}",
        json={"progress_seconds": 300},
        headers={"X-Session-Token": token},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_continue_watching(
    client, active_subscriber, db_session: AsyncSession
):
    """Continue watching returns incomplete episodes."""
    sub, token = active_subscriber
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    series = make_series(user.id)
    db_session.add(series)
    await db_session.flush()

    ep = make_episode(
        series.id, user.id, episode_number=1, status="published", duration_seconds=600
    )
    db_session.add(ep)
    await db_session.commit()

    # Report partial progress
    await client.post(
        f"/api/history/{ep.id}",
        json={"progress_seconds": 120},
        headers={"X-Session-Token": token},
    )

    response = await client.get(
        "/api/history", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert data["items"][0]["progress_seconds"] == 120
    assert data["items"][0]["completed"] is False


@pytest.mark.asyncio
async def test_auto_complete_at_90_percent(
    client, active_subscriber, db_session: AsyncSession
):
    """Progress >= 90% of duration marks episode as completed."""
    sub, token = active_subscriber
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    series = make_series(user.id)
    db_session.add(series)
    await db_session.flush()

    ep = make_episode(
        series.id, user.id, episode_number=1, status="published", duration_seconds=100
    )
    db_session.add(ep)
    await db_session.commit()

    await client.post(
        f"/api/history/{ep.id}",
        json={"progress_seconds": 91},
        headers={"X-Session-Token": token},
    )

    # Completed episodes shouldn't show in continue watching
    response = await client.get(
        "/api/history", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_history_list_anonymous_rejected(client, anonymous_subscriber):
    """Anonymous subscriber cannot view history list."""
    sub, token = anonymous_subscriber
    response = await client.get(
        "/api/history", headers={"X-Session-Token": token}
    )
    assert response.status_code == 403
