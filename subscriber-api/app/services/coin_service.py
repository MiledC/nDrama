import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.coin_package import CoinPackage
from app.models.coin_transaction import CoinTransaction, TransactionType
from app.models.episode import Episode, EpisodeStatus
from app.models.episode_unlock import EpisodeUnlock
from app.models.series import Series
from app.models.subscriber import Subscriber


async def get_balance(db: AsyncSession, subscriber_id: uuid.UUID) -> int:
    """Return subscriber coin balance."""
    result = await db.execute(
        select(Subscriber.coin_balance).where(Subscriber.id == subscriber_id)
    )
    return result.scalar_one()


async def list_packages(db: AsyncSession) -> list[CoinPackage]:
    """List active coin packages."""
    result = await db.execute(
        select(CoinPackage)
        .where(CoinPackage.is_active.is_(True))
        .order_by(CoinPackage.sort_order, CoinPackage.name)
    )
    return list(result.scalars().all())


async def purchase_package(
    db: AsyncSession,
    subscriber_id: uuid.UUID,
    package_id: uuid.UUID,
) -> CoinTransaction:
    """Stubbed purchase — credits coins without real payment."""
    # Get package
    result = await db.execute(
        select(CoinPackage).where(
            CoinPackage.id == package_id,
            CoinPackage.is_active.is_(True),
        )
    )
    package = result.scalar_one_or_none()
    if package is None:
        raise ValueError("Package not found or inactive")

    # Lock subscriber row for atomic update
    result = await db.execute(
        select(Subscriber)
        .where(Subscriber.id == subscriber_id)
        .with_for_update()
    )
    subscriber = result.scalar_one()

    new_balance = subscriber.coin_balance + package.coin_amount
    subscriber.coin_balance = new_balance

    transaction = CoinTransaction(
        subscriber_id=subscriber_id,
        type=TransactionType.purchase,
        amount=package.coin_amount,
        balance_after=new_balance,
        reference_type="coin_package",
        reference_id=package.id,
        description=f"Purchased {package.name}",
    )
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    return transaction


async def spend_coins(
    db: AsyncSession,
    subscriber_id: uuid.UUID,
    episode_id: uuid.UUID,
) -> dict:
    """Spend coins to unlock an episode."""
    # Get episode with series
    ep_result = await db.execute(
        select(Episode).where(
            Episode.id == episode_id,
            Episode.status == EpisodeStatus.published,
        )
    )
    episode = ep_result.scalar_one_or_none()
    if episode is None:
        raise ValueError("Episode not found")

    # Get series for cost and free count
    series_result = await db.execute(
        select(Series).where(Series.id == episode.series_id)
    )
    series = series_result.scalar_one()

    # Check if free
    if episode.episode_number <= series.free_episode_count:
        raise ValueError("Episode is free")

    # Check if already unlocked
    unlock_result = await db.execute(
        select(EpisodeUnlock).where(
            EpisodeUnlock.subscriber_id == subscriber_id,
            EpisodeUnlock.episode_id == episode_id,
        )
    )
    if unlock_result.scalar_one_or_none() is not None:
        raise ValueError("Already unlocked")

    cost = series.coin_cost_per_episode

    # Lock subscriber row
    sub_result = await db.execute(
        select(Subscriber)
        .where(Subscriber.id == subscriber_id)
        .with_for_update()
    )
    subscriber = sub_result.scalar_one()

    if subscriber.coin_balance < cost:
        raise PermissionError("Insufficient coins")

    new_balance = subscriber.coin_balance - cost
    subscriber.coin_balance = new_balance

    # Create spend transaction
    transaction = CoinTransaction(
        subscriber_id=subscriber_id,
        type=TransactionType.spend,
        amount=-cost,
        balance_after=new_balance,
        reference_type="episode",
        reference_id=episode_id,
        description=f"Unlocked episode: {episode.title}",
    )
    db.add(transaction)
    await db.flush()

    # Create unlock record
    unlock = EpisodeUnlock(
        subscriber_id=subscriber_id,
        episode_id=episode_id,
        coin_transaction_id=transaction.id,
    )
    db.add(unlock)
    await db.commit()

    return {
        "episode_id": episode_id,
        "new_balance": new_balance,
        "transaction_id": transaction.id,
    }


async def list_transactions(
    db: AsyncSession,
    subscriber_id: uuid.UUID,
    *,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[CoinTransaction], int]:
    """List coin transactions, newest first."""
    count_query = select(func.count()).where(
        CoinTransaction.subscriber_id == subscriber_id
    )
    total = (await db.execute(count_query)).scalar() or 0

    result = await db.execute(
        select(CoinTransaction)
        .where(CoinTransaction.subscriber_id == subscriber_id)
        .order_by(CoinTransaction.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    items = list(result.scalars().all())
    return items, total
