"""Factory functions for creating test model instances.

Usage:
    user = make_user(email="custom@test.com", role=UserRole.admin)
"""

import uuid
from typing import Any

from app.models.episode import Episode, EpisodeStatus
from app.models.series import Series, SeriesStatus
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
