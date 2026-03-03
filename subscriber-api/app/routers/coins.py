from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.session_auth import get_current_subscriber, require_active_subscriber
from app.models.subscriber import Subscriber
from app.schemas.coins import (
    BalanceResponse,
    CoinPackageResponse,
    PurchaseRequest,
    SpendRequest,
    TransactionResponse,
    UnlockResponse,
)
from app.schemas.content import PaginatedResponse
from app.services import coin_service

router = APIRouter(prefix="/api/coins", tags=["coins"])


@router.get("/balance", response_model=BalanceResponse)
async def get_balance(
    subscriber: Subscriber = Depends(require_active_subscriber),
    db: AsyncSession = Depends(get_db),
):
    """Get current coin balance."""
    balance = await coin_service.get_balance(db, subscriber.id)
    return BalanceResponse(balance=balance)


@router.get("/packages", response_model=list[CoinPackageResponse])
async def list_packages(
    _subscriber: Subscriber = Depends(get_current_subscriber),
    db: AsyncSession = Depends(get_db),
):
    """List active coin packages."""
    packages = await coin_service.list_packages(db)
    return [CoinPackageResponse.model_validate(p) for p in packages]


@router.post("/purchase", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def purchase_package(
    request: PurchaseRequest,
    subscriber: Subscriber = Depends(require_active_subscriber),
    db: AsyncSession = Depends(get_db),
):
    """Purchase a coin package (stubbed — no real payment)."""
    try:
        transaction = await coin_service.purchase_package(
            db, subscriber.id, request.package_id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    return TransactionResponse.model_validate(transaction)


@router.post("/spend", response_model=UnlockResponse, status_code=status.HTTP_201_CREATED)
async def spend_coins(
    request: SpendRequest,
    subscriber: Subscriber = Depends(require_active_subscriber),
    db: AsyncSession = Depends(get_db),
):
    """Spend coins to unlock an episode."""
    try:
        result = await coin_service.spend_coins(db, subscriber.id, request.episode_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Insufficient coins",
        )
    return UnlockResponse(**result)


@router.get("/transactions", response_model=PaginatedResponse[TransactionResponse])
async def list_transactions(
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    subscriber: Subscriber = Depends(require_active_subscriber),
    db: AsyncSession = Depends(get_db),
):
    """List transaction history."""
    items, total = await coin_service.list_transactions(
        db, subscriber.id, offset=offset, limit=limit
    )
    return PaginatedResponse(
        items=[TransactionResponse.model_validate(t) for t in items],
        total=total,
        offset=offset,
        limit=limit,
    )
