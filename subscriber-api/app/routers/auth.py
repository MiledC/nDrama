from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.session_auth import get_current_subscriber
from app.models.subscriber import Subscriber
from app.schemas.auth import (
    AuthResponse,
    DeviceRegisterRequest,
    DeviceRegisterResponse,
    LoginRequest,
    OtpRequestRequest,
    OtpRequestResponse,
    OtpVerifyRequest,
    OtpVerifyResponse,
    RegisterRequest,
    SubscriberProfile,
)
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/device", response_model=DeviceRegisterResponse)
async def device_register(
    request: DeviceRegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register device and get anonymous session."""
    subscriber, token = await auth_service.register_device(
        db, device_id=request.device_id
    )
    return DeviceRegisterResponse(
        session_token=token,
        subscriber_id=subscriber.id,
    )


@router.post("/register", response_model=AuthResponse)
async def register(
    request: RegisterRequest,
    subscriber: Subscriber = Depends(get_current_subscriber),
    db: AsyncSession = Depends(get_db),
):
    """Upgrade anonymous subscriber to registered account."""
    try:
        subscriber, token = await auth_service.register_account(
            db,
            subscriber=subscriber,
            email=request.email,
            password=request.password,
            name=request.name,
        )
    except ValueError as e:
        error_msg = str(e)
        if "already registered" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail=error_msg
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg
        )
    return AuthResponse(
        session_token=token,
        subscriber=SubscriberProfile.model_validate(subscriber),
    )


@router.post("/login", response_model=AuthResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Login with email and password."""
    try:
        subscriber, token = await auth_service.login(
            db, email=request.email, password=request.password
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=str(e)
        )
    return AuthResponse(
        session_token=token,
        subscriber=SubscriberProfile.model_validate(subscriber),
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: Request,
    _subscriber: Subscriber = Depends(get_current_subscriber),
):
    """Invalidate current session token."""
    token = request.state.session_token
    await auth_service.logout(token)


@router.post("/otp/request", response_model=OtpRequestResponse)
async def otp_request(request: OtpRequestRequest):
    """Request OTP for phone number."""
    await auth_service.request_otp(request.phone)
    return OtpRequestResponse()


@router.post("/otp/verify", response_model=OtpVerifyResponse)
async def otp_verify(
    request: OtpVerifyRequest,
    db: AsyncSession = Depends(get_db),
):
    """Verify OTP and create/login subscriber."""
    try:
        subscriber, token, is_new = await auth_service.verify_otp_and_login(
            db, phone=request.phone, code=request.code
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid OTP code"
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=str(e)
        )
    return OtpVerifyResponse(
        session_token=token,
        subscriber=SubscriberProfile.model_validate(subscriber),
        is_new_account=is_new,
    )
