import uuid
from collections.abc import AsyncGenerator

import httpx
import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import get_db
from app.main import app
from app.models import Base
from app.models.subscriber import Subscriber, SubscriberStatus
from app.redis import SESSION_PREFIX
from app.services.auth_service import hash_password

# In-memory SQLite for fast, isolated tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(autouse=True)
async def setup_db():
    """Create all tables before each test and drop them after."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide a transactional async session."""
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()


@pytest.fixture
def fake_redis():
    """Provide a fakeredis instance and patch the app to use it."""
    import fakeredis.aioredis

    return fakeredis.aioredis.FakeRedis(decode_responses=True)


@pytest.fixture
async def client(
    db_session: AsyncSession, fake_redis
) -> AsyncGenerator[httpx.AsyncClient, None]:
    """httpx.AsyncClient with test DB and fake Redis overrides."""
    import app.redis as redis_module

    async def _override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    # Patch Redis
    original_get_redis = redis_module.get_redis

    async def _fake_get_redis():
        return fake_redis

    redis_module.get_redis = _fake_get_redis

    app.dependency_overrides[get_db] = _override_get_db
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
    redis_module.get_redis = original_get_redis


async def _create_subscriber_with_session(
    db_session: AsyncSession,
    fake_redis,
    *,
    status: SubscriberStatus,
    email: str | None = None,
    password: str | None = None,
    name: str | None = None,
    coin_balance: int = 0,
) -> tuple[Subscriber, str]:
    """Helper to create a subscriber and store a session in fake Redis."""
    sub = Subscriber(
        id=uuid.uuid4(),
        device_id=f"device-{uuid.uuid4().hex[:12]}",
        status=status,
        coin_balance=coin_balance,
        email=email,
        name=name,
        password_hash=hash_password(password) if password else None,
        language="ar",
    )
    db_session.add(sub)
    await db_session.commit()
    await db_session.refresh(sub)

    token = f"ndrama_sess_test_{uuid.uuid4().hex}"
    await fake_redis.setex(f"{SESSION_PREFIX}{token}", 86400, str(sub.id))
    return sub, token


@pytest.fixture
async def anonymous_subscriber(
    db_session: AsyncSession, fake_redis
) -> tuple[Subscriber, str]:
    """Anonymous subscriber with valid session."""
    return await _create_subscriber_with_session(
        db_session, fake_redis, status=SubscriberStatus.anonymous
    )


@pytest.fixture
async def active_subscriber(
    db_session: AsyncSession, fake_redis
) -> tuple[Subscriber, str]:
    """Active (registered) subscriber with valid session."""
    return await _create_subscriber_with_session(
        db_session,
        fake_redis,
        status=SubscriberStatus.active,
        email="subscriber@test.com",
        password="testpass123",
        name="Test Subscriber",
        coin_balance=100,
    )


@pytest.fixture
async def suspended_subscriber(
    db_session: AsyncSession, fake_redis
) -> tuple[Subscriber, str]:
    """Suspended subscriber with valid session."""
    return await _create_subscriber_with_session(
        db_session, fake_redis, status=SubscriberStatus.suspended
    )
