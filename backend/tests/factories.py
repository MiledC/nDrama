"""Factory functions for creating test model instances.

Usage:
    user = make_user(email="custom@test.com", role=UserRole.admin)
"""

import uuid
from decimal import Decimal
from typing import Any

from app.models.audio_track import AudioTrack
from app.models.category import Category
from app.models.coin_package import CoinPackage
from app.models.coin_transaction import CoinTransaction, TransactionType
from app.models.episode import Episode, EpisodeStatus
from app.models.series import Series, SeriesStatus
from app.models.subscriber import Subscriber, SubscriberStatus
from app.models.subtitle import Subtitle, SubtitleFormat
from app.models.tag import Tag, TagCategory
from app.models.user import User, UserRole
from app.services.auth_service import hash_password

_counter = 0


def _next_id() -> int:
    global _counter
    _counter += 1
    return _counter


def make_user(**overrides: Any) -> User:
    """Create a User instance with sensible defaults. Does NOT add to session."""
    n = _next_id()
    defaults: dict[str, Any] = {
        "id": uuid.uuid4(),
        "email": f"user{n}@test.com",
        "password_hash": hash_password("testpass123"),
        "name": f"Test User {n}",
        "role": UserRole.editor,
        "is_active": True,
    }
    defaults.update(overrides)
    return User(**defaults)


def make_tag(**overrides: Any) -> Tag:
    """Create a Tag instance with sensible defaults. Does NOT add to session."""
    n = _next_id()
    defaults: dict[str, Any] = {
        "id": uuid.uuid4(),
        "name": f"tag-{n}",
        "category": TagCategory.genre,
    }
    defaults.update(overrides)
    return Tag(**defaults)


def make_series(created_by: uuid.UUID, **overrides: Any) -> Series:
    """Create a Series instance with sensible defaults. Does NOT add to session."""
    n = _next_id()
    defaults: dict[str, Any] = {
        "id": uuid.uuid4(),
        "title": f"Test Series {n}",
        "description": f"Description for series {n}",
        "status": SeriesStatus.draft,
        "free_episode_count": 3,
        "coin_cost_per_episode": 10,
        "created_by": created_by,
    }
    defaults.update(overrides)
    return Series(**defaults)


def make_episode(
    series_id: uuid.UUID, created_by: uuid.UUID, **overrides: Any
) -> Episode:
    """Create an Episode instance with sensible defaults. Does NOT add to session."""
    n = _next_id()
    defaults: dict[str, Any] = {
        "id": uuid.uuid4(),
        "series_id": series_id,
        "title": f"Test Episode {n}",
        "description": f"Description for episode {n}",
        "episode_number": n,
        "status": EpisodeStatus.draft,
        "created_by": created_by,
    }
    defaults.update(overrides)
    return Episode(**defaults)


def make_audio_track(episode_id: uuid.UUID, **overrides: Any) -> AudioTrack:
    """Create an AudioTrack instance with sensible defaults. Does NOT add to session."""
    n = _next_id()
    defaults: dict[str, Any] = {
        "id": uuid.uuid4(),
        "episode_id": episode_id,
        "language_code": "ar",
        "label": f"Arabic Track {n}",
        "file_url": f"http://localhost:9000/test-bucket/audio-tracks/test-{n}.mp3",
        "is_default": False,
    }
    defaults.update(overrides)
    return AudioTrack(**defaults)


def make_subtitle(episode_id: uuid.UUID, **overrides: Any) -> Subtitle:
    """Create a Subtitle instance with sensible defaults. Does NOT add to session."""
    n = _next_id()
    defaults: dict[str, Any] = {
        "id": uuid.uuid4(),
        "episode_id": episode_id,
        "language_code": "ar",
        "label": f"Arabic Subtitles {n}",
        "file_url": f"http://localhost:9000/test-bucket/subtitles/test-{n}.vtt",
        "format": SubtitleFormat.vtt,
        "is_default": False,
    }
    defaults.update(overrides)
    return Subtitle(**defaults)


def make_category(**overrides: Any) -> Category:
    """Create a Category instance with sensible defaults. Does NOT add to session."""
    n = _next_id()
    defaults: dict[str, Any] = {
        "id": uuid.uuid4(),
        "name": f"category-{n}",
        "sort_order": 0,
        "match_mode": "any",
    }
    defaults.update(overrides)
    return Category(**defaults)


def make_subscriber(**overrides: Any) -> Subscriber:
    """Create a Subscriber instance with sensible defaults. Does NOT add to session."""
    defaults: dict[str, Any] = {
        "id": uuid.uuid4(),
        "device_id": f"device-{uuid.uuid4().hex[:12]}",
        "status": SubscriberStatus.anonymous,
        "coin_balance": 0,
    }
    defaults.update(overrides)
    return Subscriber(**defaults)


def make_coin_transaction(subscriber_id: uuid.UUID, **overrides: Any) -> CoinTransaction:
    """Create a CoinTransaction instance with sensible defaults. Does NOT add to session."""
    defaults: dict[str, Any] = {
        "id": uuid.uuid4(),
        "subscriber_id": subscriber_id,
        "type": TransactionType.purchase,
        "amount": 100,
        "balance_after": 100,
        "description": "Test transaction",
    }
    defaults.update(overrides)
    return CoinTransaction(**defaults)


def make_coin_package(created_by: uuid.UUID, **overrides: Any) -> CoinPackage:
    """Create a CoinPackage instance with sensible defaults. Does NOT add to session."""
    n = _next_id()
    defaults: dict[str, Any] = {
        "id": uuid.uuid4(),
        "name": f"Test Package {n}",
        "coin_amount": 100,
        "price_sar": Decimal("9.99"),
        "is_active": True,
        "sort_order": 0,
        "created_by": created_by,
    }
    defaults.update(overrides)
    return CoinPackage(**defaults)
