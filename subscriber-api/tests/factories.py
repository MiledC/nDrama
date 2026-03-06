"""Factory functions for subscriber-api test data."""

import uuid
from decimal import Decimal
from typing import Any

from app.models.audio_track import AudioTrack
from app.models.category import Category
from app.models.coin_package import CoinPackage
from app.models.coin_transaction import CoinTransaction, TransactionType
from app.models.episode import Episode, EpisodeStatus
from app.models.episode_unlock import EpisodeUnlock
from app.models.favorite import Favorite
from app.models.series import Series, SeriesStatus
from app.models.subscriber import Subscriber, SubscriberStatus
from app.models.subtitle import Subtitle, SubtitleFormat
from app.models.tag import Tag, TagCategory
from app.models.user import User
from app.models.watch_history import WatchHistory

_counter = 0


def _next_id() -> int:
    global _counter
    _counter += 1
    return _counter


def make_user(**overrides: Any) -> User:
    n = _next_id()
    defaults: dict[str, Any] = {
        "id": uuid.uuid4(),
        "email": f"admin{n}@test.com",
        "name": f"Admin User {n}",
    }
    defaults.update(overrides)
    return User(**defaults)


def make_subscriber(**overrides: Any) -> Subscriber:
    defaults: dict[str, Any] = {
        "id": uuid.uuid4(),
        "device_id": f"device-{uuid.uuid4().hex[:12]}",
        "status": SubscriberStatus.anonymous,
        "coin_balance": 0,
        "phone": None,
    }
    defaults.update(overrides)
    return Subscriber(**defaults)


def make_tag(**overrides: Any) -> Tag:
    n = _next_id()
    defaults: dict[str, Any] = {
        "id": uuid.uuid4(),
        "name": f"tag-{n}",
        "category": TagCategory.genre,
    }
    defaults.update(overrides)
    return Tag(**defaults)


def make_series(created_by: uuid.UUID, **overrides: Any) -> Series:
    n = _next_id()
    defaults: dict[str, Any] = {
        "id": uuid.uuid4(),
        "title": f"Test Series {n}",
        "description": f"Description for series {n}",
        "status": SeriesStatus.published,
        "free_episode_count": 3,
        "coin_cost_per_episode": 10,
        "created_by": created_by,
    }
    defaults.update(overrides)
    return Series(**defaults)


def make_episode(
    series_id: uuid.UUID, created_by: uuid.UUID, **overrides: Any
) -> Episode:
    n = _next_id()
    defaults: dict[str, Any] = {
        "id": uuid.uuid4(),
        "series_id": series_id,
        "title": f"Test Episode {n}",
        "description": f"Description for episode {n}",
        "episode_number": n,
        "status": EpisodeStatus.published,
        "duration_seconds": 600,
        "created_by": created_by,
    }
    defaults.update(overrides)
    return Episode(**defaults)


def make_audio_track(episode_id: uuid.UUID, **overrides: Any) -> AudioTrack:
    n = _next_id()
    defaults: dict[str, Any] = {
        "id": uuid.uuid4(),
        "episode_id": episode_id,
        "language_code": "ar",
        "label": f"Arabic Track {n}",
        "file_url": f"http://localhost:9000/test/audio-{n}.mp3",
        "is_default": True,
    }
    defaults.update(overrides)
    return AudioTrack(**defaults)


def make_subtitle(episode_id: uuid.UUID, **overrides: Any) -> Subtitle:
    n = _next_id()
    defaults: dict[str, Any] = {
        "id": uuid.uuid4(),
        "episode_id": episode_id,
        "language_code": "ar",
        "label": f"Arabic Subs {n}",
        "file_url": f"http://localhost:9000/test/sub-{n}.vtt",
        "format": SubtitleFormat.vtt,
        "is_default": True,
    }
    defaults.update(overrides)
    return Subtitle(**defaults)


def make_coin_package(created_by: uuid.UUID, **overrides: Any) -> CoinPackage:
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


def make_coin_transaction(subscriber_id: uuid.UUID, **overrides: Any) -> CoinTransaction:
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


def make_category(**overrides: Any) -> Category:
    n = _next_id()
    defaults: dict[str, Any] = {
        "id": uuid.uuid4(),
        "name": f"category-{n}",
        "sort_order": 0,
        "match_mode": "any",
    }
    defaults.update(overrides)
    return Category(**defaults)


def make_episode_unlock(
    subscriber_id: uuid.UUID,
    episode_id: uuid.UUID,
    coin_transaction_id: uuid.UUID,
    **overrides: Any,
) -> EpisodeUnlock:
    defaults: dict[str, Any] = {
        "id": uuid.uuid4(),
        "subscriber_id": subscriber_id,
        "episode_id": episode_id,
        "coin_transaction_id": coin_transaction_id,
    }
    defaults.update(overrides)
    return EpisodeUnlock(**defaults)


def make_favorite(
    subscriber_id: uuid.UUID, series_id: uuid.UUID, **overrides: Any
) -> Favorite:
    defaults: dict[str, Any] = {
        "id": uuid.uuid4(),
        "subscriber_id": subscriber_id,
        "series_id": series_id,
    }
    defaults.update(overrides)
    return Favorite(**defaults)


def make_watch_history(
    subscriber_id: uuid.UUID, episode_id: uuid.UUID, **overrides: Any
) -> WatchHistory:
    defaults: dict[str, Any] = {
        "id": uuid.uuid4(),
        "subscriber_id": subscriber_id,
        "episode_id": episode_id,
        "progress_seconds": 0,
        "completed": False,
    }
    defaults.update(overrides)
    return WatchHistory(**defaults)
