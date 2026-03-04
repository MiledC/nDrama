import uuid

import pytest
from sqlalchemy import select

from app.cli import _seed_admin
from app.models.user import User, UserRole
from app.services.auth_service import hash_password, verify_password

pytestmark = pytest.mark.anyio


async def test_seed_admin_creates_user(db_session, monkeypatch):
    """seed-admin creates an admin user when none exists."""
    # Patch async_session_maker in cli module to use the test session
    from unittest.mock import AsyncMock

    from app import cli

    class FakeSessionCtx:
        async def __aenter__(self):
            return db_session

        async def __aexit__(self, *args):
            pass

    monkeypatch.setattr(cli, "async_session_maker", lambda: FakeSessionCtx())
    monkeypatch.setattr(cli, "engine", AsyncMock())

    await _seed_admin("newadmin@test.com", "securepass123", "New Admin")

    result = await db_session.execute(
        select(User).where(User.email == "newadmin@test.com")
    )
    user = result.scalar_one()

    assert user.email == "newadmin@test.com"
    assert user.name == "New Admin"
    assert user.role == UserRole.admin
    assert user.is_active is True
    assert verify_password("securepass123", user.password_hash)


async def test_seed_admin_skips_existing(db_session, monkeypatch, capsys):
    """seed-admin prints a message and skips when the email already exists."""
    from unittest.mock import AsyncMock

    from app import cli

    existing = User(
        id=uuid.uuid4(),
        email="existing@test.com",
        password_hash=hash_password("pass"),
        name="Existing",
        role=UserRole.admin,
        is_active=True,
    )
    db_session.add(existing)
    await db_session.commit()

    class FakeSessionCtx:
        async def __aenter__(self):
            return db_session

        async def __aexit__(self, *args):
            pass

    monkeypatch.setattr(cli, "async_session_maker", lambda: FakeSessionCtx())
    monkeypatch.setattr(cli, "engine", AsyncMock())

    await _seed_admin("existing@test.com", "newpass", "Admin")

    captured = capsys.readouterr()
    assert "already exists" in captured.out

    # Verify no duplicate was created
    result = await db_session.execute(
        select(User).where(User.email == "existing@test.com")
    )
    users = result.scalars().all()
    assert len(users) == 1
