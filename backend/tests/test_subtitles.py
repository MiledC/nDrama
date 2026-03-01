"""Tests for subtitle CRUD endpoints."""

import uuid
from unittest.mock import AsyncMock, patch

import httpx
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from tests.factories import make_episode, make_series, make_subtitle


@pytest.fixture
async def episode_with_series(db_session: AsyncSession, admin_user: User):
    """Create a series and episode for subtitle tests."""
    series = make_series(created_by=admin_user.id)
    db_session.add(series)
    await db_session.commit()

    episode = make_episode(series_id=series.id, created_by=admin_user.id, episode_number=1)
    db_session.add(episode)
    await db_session.commit()
    await db_session.refresh(episode)
    return episode


# --- List ---


@pytest.mark.asyncio
async def test_list_subtitles_empty(
    admin_client: httpx.AsyncClient, episode_with_series
):
    """List subtitles for episode with none → 200, empty list."""
    resp = await admin_client.get(
        f"/api/episodes/{episode_with_series.id}/subtitles"
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["items"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_list_subtitles_with_data(
    admin_client: httpx.AsyncClient,
    db_session: AsyncSession,
    episode_with_series,
):
    """List subtitles with existing data → returns them."""
    sub = make_subtitle(episode_id=episode_with_series.id, language_code="en")
    db_session.add(sub)
    await db_session.commit()

    resp = await admin_client.get(
        f"/api/episodes/{episode_with_series.id}/subtitles"
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["language_code"] == "en"
    assert data["items"][0]["format"] == "vtt"


@pytest.mark.asyncio
async def test_list_subtitles_episode_not_found(admin_client: httpx.AsyncClient):
    """List subtitles for non-existent episode → 404."""
    resp = await admin_client.get(f"/api/episodes/{uuid.uuid4()}/subtitles")
    assert resp.status_code == 404


# --- Create ---


@pytest.mark.asyncio
@patch("app.routers.subtitles.storage")
async def test_create_subtitle_vtt(
    mock_storage,
    admin_client: httpx.AsyncClient,
    episode_with_series,
):
    """Upload VTT subtitle → 201, returns subtitle data."""
    mock_storage.upload = AsyncMock(return_value="http://s3/subtitles/test.vtt")

    resp = await admin_client.post(
        f"/api/episodes/{episode_with_series.id}/subtitles",
        data={"language_code": "en", "label": "English", "is_default": "true"},
        files={"file": ("subs.vtt", b"WEBVTT\n\n00:00.000 --> 00:01.000\nHello", "text/vtt")},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["language_code"] == "en"
    assert data["label"] == "English"
    assert data["format"] == "vtt"
    assert data["is_default"] is True


@pytest.mark.asyncio
@patch("app.routers.subtitles.storage")
async def test_create_subtitle_srt(
    mock_storage,
    admin_client: httpx.AsyncClient,
    episode_with_series,
):
    """Upload SRT subtitle → 201, detected as srt format."""
    mock_storage.upload = AsyncMock(return_value="http://s3/subtitles/test.srt")

    resp = await admin_client.post(
        f"/api/episodes/{episode_with_series.id}/subtitles",
        data={"language_code": "ar", "label": "Arabic"},
        files={"file": (
            "subs.srt", b"1\n00:00:00,000 --> 00:00:01,000\nHello",
            "application/x-subrip",
        )},
    )
    assert resp.status_code == 201
    assert resp.json()["format"] == "srt"


@pytest.mark.asyncio
@patch("app.routers.subtitles.storage")
async def test_create_subtitle_srt_by_extension(
    mock_storage,
    admin_client: httpx.AsyncClient,
    episode_with_series,
):
    """Upload SRT subtitle with text/plain content type → detected by extension."""
    mock_storage.upload = AsyncMock(return_value="http://s3/subtitles/test.srt")

    resp = await admin_client.post(
        f"/api/episodes/{episode_with_series.id}/subtitles",
        data={"language_code": "ar", "label": "Arabic"},
        files={"file": ("subs.srt", b"1\n00:00:00,000 --> 00:00:01,000\nHello", "text/plain")},
    )
    assert resp.status_code == 201
    assert resp.json()["format"] == "srt"


@pytest.mark.asyncio
@patch("app.routers.subtitles.storage")
async def test_create_subtitle_invalid_format(
    mock_storage,
    admin_client: httpx.AsyncClient,
    episode_with_series,
):
    """Upload non-subtitle file (no valid extension, unknown type) → 422."""
    resp = await admin_client.post(
        f"/api/episodes/{episode_with_series.id}/subtitles",
        data={"language_code": "ar", "label": "Arabic"},
        files={"file": ("data.json", b"{}", "application/json")},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
@patch("app.routers.subtitles.storage")
async def test_create_subtitle_duplicate_language(
    mock_storage,
    admin_client: httpx.AsyncClient,
    db_session: AsyncSession,
    episode_with_series,
):
    """Upload subtitle with duplicate language_code → 409."""
    mock_storage.upload = AsyncMock(return_value="http://s3/subtitles/test.vtt")
    mock_storage.delete = AsyncMock()

    sub = make_subtitle(episode_id=episode_with_series.id, language_code="en")
    db_session.add(sub)
    await db_session.commit()

    resp = await admin_client.post(
        f"/api/episodes/{episode_with_series.id}/subtitles",
        data={"language_code": "en", "label": "English 2"},
        files={"file": ("subs.vtt", b"WEBVTT\n\ntest", "text/vtt")},
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
@patch("app.routers.subtitles.storage")
async def test_create_subtitle_episode_not_found(
    mock_storage, admin_client: httpx.AsyncClient
):
    """Upload to non-existent episode → 404."""
    resp = await admin_client.post(
        f"/api/episodes/{uuid.uuid4()}/subtitles",
        data={"language_code": "en", "label": "English"},
        files={"file": ("subs.vtt", b"WEBVTT\n\ntest", "text/vtt")},
    )
    assert resp.status_code == 404


# --- Update ---


@pytest.mark.asyncio
async def test_update_subtitle(
    admin_client: httpx.AsyncClient,
    db_session: AsyncSession,
    episode_with_series,
):
    """Update subtitle label → 200, updated data."""
    sub = make_subtitle(episode_id=episode_with_series.id, language_code="en")
    db_session.add(sub)
    await db_session.commit()
    await db_session.refresh(sub)

    resp = await admin_client.patch(
        f"/api/subtitles/{sub.id}",
        json={"label": "Updated English"},
    )
    assert resp.status_code == 200
    assert resp.json()["label"] == "Updated English"


@pytest.mark.asyncio
async def test_update_subtitle_set_default(
    admin_client: httpx.AsyncClient,
    db_session: AsyncSession,
    episode_with_series,
):
    """Setting is_default clears other defaults for the same episode."""
    sub1 = make_subtitle(
        episode_id=episode_with_series.id, language_code="ar", is_default=True
    )
    sub2 = make_subtitle(
        episode_id=episode_with_series.id, language_code="en"
    )
    db_session.add_all([sub1, sub2])
    await db_session.commit()
    await db_session.refresh(sub2)

    resp = await admin_client.patch(
        f"/api/subtitles/{sub2.id}",
        json={"is_default": True},
    )
    assert resp.status_code == 200
    assert resp.json()["is_default"] is True

    # Verify sub1 is no longer default
    resp2 = await admin_client.get(
        f"/api/episodes/{episode_with_series.id}/subtitles"
    )
    items = resp2.json()["items"]
    for item in items:
        if item["id"] == str(sub1.id):
            assert item["is_default"] is False


@pytest.mark.asyncio
async def test_update_subtitle_not_found(admin_client: httpx.AsyncClient):
    """Update non-existent subtitle → 404."""
    resp = await admin_client.patch(
        f"/api/subtitles/{uuid.uuid4()}",
        json={"label": "Nope"},
    )
    assert resp.status_code == 404


# --- Delete ---


@pytest.mark.asyncio
@patch("app.routers.subtitles.storage")
async def test_delete_subtitle(
    mock_storage,
    admin_client: httpx.AsyncClient,
    db_session: AsyncSession,
    episode_with_series,
):
    """Delete subtitle → 204, file removed from storage."""
    mock_storage.delete = AsyncMock()

    sub = make_subtitle(episode_id=episode_with_series.id, language_code="en")
    db_session.add(sub)
    await db_session.commit()
    await db_session.refresh(sub)

    resp = await admin_client.delete(f"/api/subtitles/{sub.id}")
    assert resp.status_code == 204
    mock_storage.delete.assert_called_once()

    # Verify deleted
    resp2 = await admin_client.get(
        f"/api/episodes/{episode_with_series.id}/subtitles"
    )
    assert resp2.json()["total"] == 0


@pytest.mark.asyncio
@patch("app.routers.subtitles.storage")
async def test_delete_subtitle_not_found(
    mock_storage, admin_client: httpx.AsyncClient
):
    """Delete non-existent subtitle → 404."""
    resp = await admin_client.delete(f"/api/subtitles/{uuid.uuid4()}")
    assert resp.status_code == 404


# --- Auth ---


@pytest.mark.asyncio
async def test_list_subtitles_unauthenticated(
    client: httpx.AsyncClient, episode_with_series
):
    """Unauthenticated request → 401."""
    resp = await client.get(
        f"/api/episodes/{episode_with_series.id}/subtitles"
    )
    assert resp.status_code == 401
