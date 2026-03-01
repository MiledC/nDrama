"""Tests for audio track CRUD endpoints."""

import uuid
from unittest.mock import AsyncMock, patch

import httpx
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from tests.factories import make_audio_track, make_episode, make_series


@pytest.fixture
async def episode_with_series(db_session: AsyncSession, admin_user: User):
    """Create a series and episode for audio track tests."""
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
async def test_list_audio_tracks_empty(
    admin_client: httpx.AsyncClient, episode_with_series
):
    """List audio tracks for episode with none → 200, empty list."""
    resp = await admin_client.get(
        f"/api/episodes/{episode_with_series.id}/audio-tracks"
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["items"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_list_audio_tracks_with_data(
    admin_client: httpx.AsyncClient,
    db_session: AsyncSession,
    episode_with_series,
):
    """List audio tracks for episode with tracks → returns them."""
    track = make_audio_track(episode_id=episode_with_series.id, language_code="ar")
    db_session.add(track)
    await db_session.commit()

    resp = await admin_client.get(
        f"/api/episodes/{episode_with_series.id}/audio-tracks"
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["language_code"] == "ar"


@pytest.mark.asyncio
async def test_list_audio_tracks_episode_not_found(admin_client: httpx.AsyncClient):
    """List audio tracks for non-existent episode → 404."""
    resp = await admin_client.get(f"/api/episodes/{uuid.uuid4()}/audio-tracks")
    assert resp.status_code == 404


# --- Create ---


@pytest.mark.asyncio
@patch("app.routers.audio_tracks.storage")
async def test_create_audio_track(
    mock_storage,
    admin_client: httpx.AsyncClient,
    episode_with_series,
):
    """Upload audio track → 201, returns track data."""
    mock_storage.upload = AsyncMock(return_value="http://s3/audio-tracks/test.mp3")

    resp = await admin_client.post(
        f"/api/episodes/{episode_with_series.id}/audio-tracks",
        data={"language_code": "ar", "label": "Arabic", "is_default": "true"},
        files={"file": ("test.mp3", b"fake audio data", "audio/mpeg")},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["language_code"] == "ar"
    assert data["label"] == "Arabic"
    assert data["is_default"] is True
    assert data["file_url"] == "http://s3/audio-tracks/test.mp3"
    mock_storage.upload.assert_called_once()


@pytest.mark.asyncio
@patch("app.routers.audio_tracks.storage")
async def test_create_audio_track_invalid_file_type(
    mock_storage,
    admin_client: httpx.AsyncClient,
    episode_with_series,
):
    """Upload non-audio file → 422."""
    resp = await admin_client.post(
        f"/api/episodes/{episode_with_series.id}/audio-tracks",
        data={"language_code": "ar", "label": "Arabic"},
        files={"file": ("test.txt", b"not audio", "text/plain")},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
@patch("app.routers.audio_tracks.storage")
async def test_create_audio_track_duplicate_language(
    mock_storage,
    admin_client: httpx.AsyncClient,
    db_session: AsyncSession,
    episode_with_series,
):
    """Upload track with duplicate language_code → 409."""
    mock_storage.upload = AsyncMock(return_value="http://s3/audio-tracks/test.mp3")
    mock_storage.delete = AsyncMock()

    # Create existing track
    track = make_audio_track(episode_id=episode_with_series.id, language_code="ar")
    db_session.add(track)
    await db_session.commit()

    resp = await admin_client.post(
        f"/api/episodes/{episode_with_series.id}/audio-tracks",
        data={"language_code": "ar", "label": "Arabic 2"},
        files={"file": ("test2.mp3", b"fake audio", "audio/mpeg")},
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
@patch("app.routers.audio_tracks.storage")
async def test_create_audio_track_episode_not_found(
    mock_storage, admin_client: httpx.AsyncClient
):
    """Upload to non-existent episode → 404."""
    resp = await admin_client.post(
        f"/api/episodes/{uuid.uuid4()}/audio-tracks",
        data={"language_code": "ar", "label": "Arabic"},
        files={"file": ("test.mp3", b"fake audio", "audio/mpeg")},
    )
    assert resp.status_code == 404


# --- Update ---


@pytest.mark.asyncio
async def test_update_audio_track(
    admin_client: httpx.AsyncClient,
    db_session: AsyncSession,
    episode_with_series,
):
    """Update audio track label → 200, updated data."""
    track = make_audio_track(episode_id=episode_with_series.id, language_code="ar")
    db_session.add(track)
    await db_session.commit()
    await db_session.refresh(track)

    resp = await admin_client.patch(
        f"/api/audio-tracks/{track.id}",
        json={"label": "Updated Label"},
    )
    assert resp.status_code == 200
    assert resp.json()["label"] == "Updated Label"


@pytest.mark.asyncio
async def test_update_audio_track_set_default(
    admin_client: httpx.AsyncClient,
    db_session: AsyncSession,
    episode_with_series,
):
    """Setting is_default clears other defaults for the same episode."""
    track1 = make_audio_track(
        episode_id=episode_with_series.id, language_code="ar", is_default=True
    )
    track2 = make_audio_track(
        episode_id=episode_with_series.id, language_code="en"
    )
    db_session.add_all([track1, track2])
    await db_session.commit()
    await db_session.refresh(track2)

    resp = await admin_client.patch(
        f"/api/audio-tracks/{track2.id}",
        json={"is_default": True},
    )
    assert resp.status_code == 200
    assert resp.json()["is_default"] is True

    # Verify track1 is no longer default
    resp2 = await admin_client.get(
        f"/api/episodes/{episode_with_series.id}/audio-tracks"
    )
    items = resp2.json()["items"]
    for item in items:
        if item["id"] == str(track1.id):
            assert item["is_default"] is False


@pytest.mark.asyncio
async def test_update_audio_track_not_found(admin_client: httpx.AsyncClient):
    """Update non-existent audio track → 404."""
    resp = await admin_client.patch(
        f"/api/audio-tracks/{uuid.uuid4()}",
        json={"label": "Nope"},
    )
    assert resp.status_code == 404


# --- Delete ---


@pytest.mark.asyncio
@patch("app.routers.audio_tracks.storage")
async def test_delete_audio_track(
    mock_storage,
    admin_client: httpx.AsyncClient,
    db_session: AsyncSession,
    episode_with_series,
):
    """Delete audio track → 204, file removed from storage."""
    mock_storage.delete = AsyncMock()

    track = make_audio_track(episode_id=episode_with_series.id, language_code="ar")
    db_session.add(track)
    await db_session.commit()
    await db_session.refresh(track)

    resp = await admin_client.delete(f"/api/audio-tracks/{track.id}")
    assert resp.status_code == 204
    mock_storage.delete.assert_called_once()

    # Verify deleted
    resp2 = await admin_client.get(
        f"/api/episodes/{episode_with_series.id}/audio-tracks"
    )
    assert resp2.json()["total"] == 0


@pytest.mark.asyncio
@patch("app.routers.audio_tracks.storage")
async def test_delete_audio_track_not_found(
    mock_storage, admin_client: httpx.AsyncClient
):
    """Delete non-existent audio track → 404."""
    resp = await admin_client.delete(f"/api/audio-tracks/{uuid.uuid4()}")
    assert resp.status_code == 404


# --- Create: auto-unset default ---


@pytest.mark.asyncio
@patch("app.routers.audio_tracks.storage")
async def test_create_audio_track_unsets_existing_default(
    mock_storage,
    admin_client: httpx.AsyncClient,
    db_session: AsyncSession,
    episode_with_series,
):
    """Uploading a new track with is_default=true unsets the existing default."""
    mock_storage.upload = AsyncMock(return_value="http://s3/audio-tracks/new.mp3")

    # Create existing default track
    track1 = make_audio_track(
        episode_id=episode_with_series.id, language_code="ar", is_default=True
    )
    db_session.add(track1)
    await db_session.commit()
    await db_session.refresh(track1)

    # Upload new track as default
    resp = await admin_client.post(
        f"/api/episodes/{episode_with_series.id}/audio-tracks",
        data={"language_code": "en", "label": "English", "is_default": "true"},
        files={"file": ("english.mp3", b"fake audio data", "audio/mpeg")},
    )
    assert resp.status_code == 201
    assert resp.json()["is_default"] is True

    # Verify old default was unset
    resp2 = await admin_client.get(
        f"/api/episodes/{episode_with_series.id}/audio-tracks"
    )
    items = resp2.json()["items"]
    for item in items:
        if item["id"] == str(track1.id):
            assert item["is_default"] is False, "Old default track should be unset"
        elif item["language_code"] == "en":
            assert item["is_default"] is True, "New track should be default"


# --- Auth ---


@pytest.mark.asyncio
async def test_list_audio_tracks_unauthenticated(
    client: httpx.AsyncClient, episode_with_series
):
    """Unauthenticated request → 401."""
    resp = await client.get(
        f"/api/episodes/{episode_with_series.id}/audio-tracks"
    )
    assert resp.status_code == 401
