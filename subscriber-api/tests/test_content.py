import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from tests.factories import (
    make_audio_track,
    make_category,
    make_coin_transaction,
    make_episode,
    make_episode_unlock,
    make_series,
    make_subtitle,
    make_user,
)


@pytest.mark.asyncio
async def test_list_series(client, active_subscriber, db_session: AsyncSession):
    """List returns published series only."""
    sub, token = active_subscriber
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    s1 = make_series(user.id, status="published")
    s2 = make_series(user.id, status="draft")
    db_session.add_all([s1, s2])
    await db_session.commit()

    response = await client.get(
        "/api/series", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["title"] == s1.title


@pytest.mark.asyncio
async def test_get_series_with_episodes(
    client, active_subscriber, db_session: AsyncSession
):
    """Series detail includes episodes with unlock status."""
    sub, token = active_subscriber
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    series = make_series(user.id, free_episode_count=1)
    db_session.add(series)
    await db_session.flush()

    ep1 = make_episode(series.id, user.id, episode_number=1, status="published")
    ep2 = make_episode(series.id, user.id, episode_number=2, status="published")
    db_session.add_all([ep1, ep2])
    await db_session.commit()

    response = await client.get(
        f"/api/series/{series.id}", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["episodes"]) == 2
    # Episode 1 is free (episode_number <= free_episode_count)
    assert data["episodes"][0]["is_free"] is True
    assert data["episodes"][0]["is_unlocked"] is True
    # Episode 2 is NOT free
    assert data["episodes"][1]["is_free"] is False
    assert data["episodes"][1]["is_unlocked"] is False


@pytest.mark.asyncio
async def test_episode_detail_locked(
    client, active_subscriber, db_session: AsyncSession
):
    """Locked episode returns no playback URL."""
    sub, token = active_subscriber
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    series = make_series(user.id, free_episode_count=0)
    db_session.add(series)
    await db_session.flush()

    ep = make_episode(
        series.id, user.id,
        episode_number=1, status="published", video_playback_id="mux123"
    )
    db_session.add(ep)
    await db_session.commit()

    response = await client.get(
        f"/api/episodes/{ep.id}", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["locked"] is True
    assert data["playback_url"] is None
    assert data["audio_tracks"] == []
    assert data["subtitles"] == []


@pytest.mark.asyncio
async def test_episode_detail_free(
    client, active_subscriber, db_session: AsyncSession
):
    """Free episode returns playback URL and tracks."""
    sub, token = active_subscriber
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    series = make_series(user.id, free_episode_count=3)
    db_session.add(series)
    await db_session.flush()

    ep = make_episode(
        series.id, user.id,
        episode_number=1, status="published", video_playback_id="mux456"
    )
    db_session.add(ep)
    await db_session.flush()

    at = make_audio_track(ep.id)
    st = make_subtitle(ep.id)
    db_session.add_all([at, st])
    await db_session.commit()

    response = await client.get(
        f"/api/episodes/{ep.id}", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["locked"] is False
    assert data["is_free"] is True
    assert "mux456" in data["playback_url"]
    assert len(data["audio_tracks"]) == 1
    assert len(data["subtitles"]) == 1


@pytest.mark.asyncio
async def test_episode_detail_unlocked(
    client, active_subscriber, db_session: AsyncSession
):
    """Unlocked (purchased) episode returns playback URL."""
    sub, token = active_subscriber
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    series = make_series(user.id, free_episode_count=0)
    db_session.add(series)
    await db_session.flush()

    ep = make_episode(
        series.id, user.id,
        episode_number=1, status="published", video_playback_id="mux789"
    )
    db_session.add(ep)
    await db_session.flush()

    txn = make_coin_transaction(sub.id)
    db_session.add(txn)
    await db_session.flush()

    unlock = make_episode_unlock(sub.id, ep.id, txn.id)
    db_session.add(unlock)
    await db_session.commit()

    response = await client.get(
        f"/api/episodes/{ep.id}", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["locked"] is False
    assert data["is_unlocked"] is True
    assert "mux789" in data["playback_url"]


@pytest.mark.asyncio
async def test_series_not_found(client, active_subscriber):
    """Non-existent series returns 404."""
    sub, token = active_subscriber
    import uuid
    response = await client.get(
        f"/api/series/{uuid.uuid4()}", headers={"X-Session-Token": token}
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_category_tree(client, active_subscriber, db_session: AsyncSession):
    """Category tree returns top-level categories."""
    sub, token = active_subscriber
    cat = make_category(name="Drama")
    db_session.add(cat)
    await db_session.commit()

    response = await client.get(
        "/api/categories/tree", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
