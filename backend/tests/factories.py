"""Factory functions for creating test model instances.

Usage:
    user = make_user(email="custom@test.com", role=UserRole.admin)
"""

import uuid
from typing import Any

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
