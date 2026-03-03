from datetime import UTC, datetime

from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.subscriber import Subscriber, SubscriberStatus
from app.redis import create_session, delete_all_sessions, delete_session

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


async def register_device(
    db: AsyncSession, *, device_id: str
) -> tuple[Subscriber, str]:
    """Register a device — creates anonymous subscriber or returns existing one."""
    result = await db.execute(
        select(Subscriber).where(Subscriber.device_id == device_id)
    )
    subscriber = result.scalar_one_or_none()

    if subscriber is None:
        subscriber = Subscriber(
            device_id=device_id,
            status=SubscriberStatus.anonymous,
            coin_balance=0,
        )
        db.add(subscriber)
        await db.commit()
        await db.refresh(subscriber)

    token = await create_session(str(subscriber.id))
    return subscriber, token


async def register_account(
    db: AsyncSession,
    *,
    subscriber: Subscriber,
    email: str,
    password: str,
    name: str,
) -> tuple[Subscriber, str]:
    """Upgrade anonymous subscriber to active with email/password."""
    if subscriber.status != SubscriberStatus.anonymous:
        raise ValueError("Only anonymous subscribers can register")

    # Check email uniqueness
    result = await db.execute(
        select(Subscriber).where(Subscriber.email == email)
    )
    existing = result.scalar_one_or_none()
    if existing is not None:
        raise ValueError("Email already registered")

    subscriber.email = email
    subscriber.password_hash = hash_password(password)
    subscriber.name = name
    subscriber.status = SubscriberStatus.active
    subscriber.registered_at = datetime.now(UTC)

    await db.commit()
    await db.refresh(subscriber)

    # Invalidate old sessions, create new one
    await delete_all_sessions(str(subscriber.id))
    token = await create_session(str(subscriber.id))
    return subscriber, token


async def login(
    db: AsyncSession, *, email: str, password: str
) -> tuple[Subscriber, str]:
    """Authenticate with email/password."""
    result = await db.execute(
        select(Subscriber).where(Subscriber.email == email)
    )
    subscriber = result.scalar_one_or_none()

    if subscriber is None or subscriber.password_hash is None:
        raise ValueError("Invalid credentials")

    if not verify_password(password, subscriber.password_hash):
        raise ValueError("Invalid credentials")

    if subscriber.status in (SubscriberStatus.suspended, SubscriberStatus.banned):
        raise PermissionError(f"Account is {subscriber.status.value}")

    token = await create_session(str(subscriber.id))
    return subscriber, token


async def logout(token: str) -> None:
    """Invalidate session token."""
    await delete_session(token)
