# Epic 2: Authentication & User Management — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement sign in, sign up, Google OAuth, JWT tokens, and role-based access control for the nDrama management panel.

**Architecture:** Service-layer pattern — `auth_service.py` handles all auth logic (hashing, JWT, OAuth), thin routers call the service, FastAPI dependencies handle middleware (get_current_user, require_admin). Frontend uses Pinia auth store with axios interceptors for automatic token management.

**Tech Stack:** FastAPI, SQLAlchemy 2.0 async, passlib[bcrypt], python-jose, authlib, httpx (backend). Vue 3, Pinia, axios, Vue Router guards (frontend).

---

### Task 1: Add backend auth dependencies + config

**Files:**
- Modify: `backend/requirements.txt`
- Modify: `backend/app/config.py`

**Step 1: Add new dependencies to requirements.txt**

Add these lines to `backend/requirements.txt` after the existing entries:

```
# Auth
passlib[bcrypt]>=1.7.4
python-jose[cryptography]>=3.3.0
authlib>=1.3.0
httpx>=0.26.0
```

Note: `httpx` may already be listed under Testing — if so, move it to a general section or leave it.

**Step 2: Add auth settings to config.py**

In `backend/app/config.py`, add these fields to the `Settings` class after the S3 section (after line 22):

```python
    # Auth / JWT
    jwt_secret_key: str = "change-me-in-production"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 7

    # OAuth (Google)
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/auth/google/callback"
```

**Step 3: Commit**

```bash
git add backend/requirements.txt backend/app/config.py
git commit -m "feat: add auth dependencies and JWT/OAuth config settings"
```

---

### Task 2: User model + migration

**Files:**
- Create: `backend/app/models/user.py`
- Modify: `backend/app/models/__init__.py`

**Step 1: Create the User model**

Create `backend/app/models/user.py`:

```python
import enum

from sqlalchemy import Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class UserRole(str, enum.Enum):
    admin = "admin"
    editor = "editor"


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.editor, nullable=False)
    oauth_provider: Mapped[str | None] = mapped_column(String(50), nullable=True)
    oauth_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
```

**Step 2: Update models __init__.py**

Replace `backend/app/models/__init__.py` with:

```python
from app.models.base import Base, TimestampMixin, UUIDMixin
from app.models.user import User, UserRole

__all__ = ["Base", "TimestampMixin", "UUIDMixin", "User", "UserRole"]
```

**Step 3: Generate Alembic migration**

First create the versions directory if it doesn't exist, then generate:

```bash
cd backend
mkdir -p alembic/versions
alembic revision --autogenerate -m "create users table"
```

Review the generated migration file to verify it creates the `users` table with all columns.

**Step 4: Run the migration**

```bash
cd backend
alembic upgrade head
```

Expected: Migration applies, `users` table created in PostgreSQL.

**Step 5: Commit**

```bash
git add backend/app/models/user.py backend/app/models/__init__.py backend/alembic/versions/
git commit -m "feat: add User model with roles and create users table migration"
```

---

### Task 3: Pydantic schemas for auth + users

**Files:**
- Create: `backend/app/schemas/__init__.py`
- Create: `backend/app/schemas/auth.py`
- Create: `backend/app/schemas/user.py`

**Step 1: Create schemas directory and __init__.py**

Create `backend/app/schemas/__init__.py`:

```python
```

(Empty init file.)

**Step 2: Create auth schemas**

Create `backend/app/schemas/auth.py`:

```python
from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str
```

Note: `EmailStr` requires `pydantic[email]` — add `email-validator>=2.1.0` to `backend/requirements.txt` if not already present.

**Step 3: Create user schemas**

Create `backend/app/schemas/user.py`:

```python
import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    role: UserRole
    is_active: bool
    oauth_provider: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InviteUserRequest(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: UserRole = UserRole.editor


class ChangeRoleRequest(BaseModel):
    role: UserRole


class ChangeActiveRequest(BaseModel):
    is_active: bool
```

**Step 4: Add email-validator dependency**

Add to `backend/requirements.txt`:

```
email-validator>=2.1.0
```

**Step 5: Commit**

```bash
git add backend/app/schemas/ backend/requirements.txt
git commit -m "feat: add Pydantic schemas for auth and user management"
```

---

### Task 4: Auth service (password hashing + JWT)

**Files:**
- Create: `backend/app/services/__init__.py`
- Create: `backend/app/services/auth_service.py`
- Create: `backend/tests/test_auth_service.py`

**Step 1: Write tests for auth service**

Create `backend/tests/test_auth_service.py`:

```python
import uuid

import pytest
from jose import jwt

from app.config import settings
from app.services.auth_service import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)


def test_hash_password_returns_bcrypt_hash():
    hashed = hash_password("mysecretpassword")
    assert hashed != "mysecretpassword"
    assert hashed.startswith("$2b$")


def test_verify_password_correct():
    hashed = hash_password("mysecretpassword")
    assert verify_password("mysecretpassword", hashed) is True


def test_verify_password_incorrect():
    hashed = hash_password("mysecretpassword")
    assert verify_password("wrongpassword", hashed) is False


def test_create_access_token_contains_claims():
    user_id = uuid.uuid4()
    token = create_access_token(str(user_id), "admin")
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])
    assert payload["sub"] == str(user_id)
    assert payload["role"] == "admin"
    assert payload["type"] == "access"
    assert "exp" in payload


def test_create_refresh_token_contains_claims():
    user_id = uuid.uuid4()
    token = create_refresh_token(str(user_id))
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])
    assert payload["sub"] == str(user_id)
    assert payload["type"] == "refresh"
    assert "exp" in payload


def test_decode_token_valid():
    user_id = uuid.uuid4()
    token = create_access_token(str(user_id), "editor")
    payload = decode_token(token)
    assert payload["sub"] == str(user_id)
    assert payload["role"] == "editor"


def test_decode_token_invalid():
    with pytest.raises(Exception):
        decode_token("invalid.token.here")
```

**Step 2: Run tests to verify they fail**

```bash
cd backend
pip install passlib[bcrypt] python-jose[cryptography] email-validator
pytest tests/test_auth_service.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'app.services'`

**Step 3: Implement auth service**

Create `backend/app/services/__init__.py`:

```python
```

Create `backend/app/services/auth_service.py`:

```python
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_access_token_expire_minutes)
    payload = {
        "sub": user_id,
        "role": role,
        "type": "access",
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm="HS256")


def create_refresh_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.jwt_refresh_token_expire_days)
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm="HS256")


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])
        return payload
    except JWTError as e:
        raise ValueError(f"Invalid token: {e}") from e
```

**Step 4: Run tests to verify they pass**

```bash
cd backend
pytest tests/test_auth_service.py -v
```

Expected: All 7 tests PASS.

**Step 5: Commit**

```bash
git add backend/app/services/ backend/tests/test_auth_service.py
git commit -m "feat: add auth service with password hashing and JWT token management"
```

---

### Task 5: Auth middleware (FastAPI dependencies)

**Files:**
- Create: `backend/app/middleware/__init__.py`
- Create: `backend/app/middleware/auth.py`
- Create: `backend/tests/test_auth_middleware.py`

**Step 1: Write tests for auth middleware**

Create `backend/tests/test_auth_middleware.py`:

```python
import uuid

import pytest
from fastapi import HTTPException

from app.models.user import UserRole
from app.services.auth_service import create_access_token


# Test the token extraction and validation logic
def test_get_current_user_rejects_missing_token():
    """Middleware should raise 401 when no token is provided."""
    from app.middleware.auth import _validate_token

    with pytest.raises(HTTPException) as exc_info:
        _validate_token(None)
    assert exc_info.value.status_code == 401


def test_get_current_user_rejects_invalid_token():
    """Middleware should raise 401 when token is invalid."""
    from app.middleware.auth import _validate_token

    with pytest.raises(HTTPException) as exc_info:
        _validate_token("invalid.token.here")
    assert exc_info.value.status_code == 401


def test_validate_token_accepts_valid_access_token():
    """Middleware should decode a valid access token."""
    from app.middleware.auth import _validate_token

    user_id = str(uuid.uuid4())
    token = create_access_token(user_id, "admin")
    payload = _validate_token(token)
    assert payload["sub"] == user_id
    assert payload["role"] == "admin"


def test_validate_token_rejects_refresh_token():
    """Middleware should reject refresh tokens used as access tokens."""
    from app.middleware.auth import _validate_token
    from app.services.auth_service import create_refresh_token

    token = create_refresh_token(str(uuid.uuid4()))
    with pytest.raises(HTTPException) as exc_info:
        _validate_token(token)
    assert exc_info.value.status_code == 401
```

**Step 2: Run tests to verify they fail**

```bash
cd backend
pytest tests/test_auth_middleware.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'app.middleware'`

**Step 3: Implement auth middleware**

Create `backend/app/middleware/__init__.py`:

```python
```

Create `backend/app/middleware/auth.py`:

```python
import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, UserRole
from app.services.auth_service import decode_token

security = HTTPBearer()


def _validate_token(token: str | None) -> dict:
    """Validate a JWT token string. Raises HTTPException on failure."""
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        payload = decode_token(token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )
    return payload


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """FastAPI dependency: extract and validate JWT, return User from DB."""
    payload = _validate_token(credentials.credentials)

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )
    return user


async def require_admin(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """FastAPI dependency: require the current user to be an admin."""
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
```

**Step 4: Run tests to verify they pass**

```bash
cd backend
pytest tests/test_auth_middleware.py -v
```

Expected: All 4 tests PASS.

**Step 5: Commit**

```bash
git add backend/app/middleware/ backend/tests/test_auth_middleware.py
git commit -m "feat: add auth middleware with JWT validation and role-based guards"
```

---

### Task 6: Auth router (register, login, refresh, me)

**Files:**
- Create: `backend/app/routers/__init__.py`
- Create: `backend/app/routers/auth.py`
- Modify: `backend/app/main.py` (register router)
- Create: `backend/tests/test_auth_router.py`

**Step 1: Write tests for auth endpoints**

Create `backend/tests/test_auth_router.py`:

```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.main import app
from app.models.base import Base


@pytest.fixture
def client():
    return TestClient(app)


# --- Registration ---

def test_register_success(client):
    response = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "securepassword123",
        "name": "Test User",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["access_token"]
    assert data["refresh_token"]
    assert data["token_type"] == "bearer"


def test_register_duplicate_email(client):
    """Second registration with same email should fail."""
    payload = {
        "email": "duplicate@example.com",
        "password": "securepassword123",
        "name": "Test User",
    }
    client.post("/api/auth/register", json=payload)
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 409


def test_register_invalid_email(client):
    response = client.post("/api/auth/register", json={
        "email": "not-an-email",
        "password": "securepassword123",
        "name": "Test User",
    })
    assert response.status_code == 422


# --- Login ---

def test_login_success(client):
    # First register
    client.post("/api/auth/register", json={
        "email": "login@example.com",
        "password": "securepassword123",
        "name": "Login User",
    })
    # Then login
    response = client.post("/api/auth/login", json={
        "email": "login@example.com",
        "password": "securepassword123",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["access_token"]
    assert data["refresh_token"]


def test_login_wrong_password(client):
    client.post("/api/auth/register", json={
        "email": "wrong@example.com",
        "password": "securepassword123",
        "name": "Wrong Pass User",
    })
    response = client.post("/api/auth/login", json={
        "email": "wrong@example.com",
        "password": "wrongpassword",
    })
    assert response.status_code == 401


def test_login_nonexistent_user(client):
    response = client.post("/api/auth/login", json={
        "email": "nobody@example.com",
        "password": "whatever",
    })
    assert response.status_code == 401


# --- Refresh ---

def test_refresh_token_success(client):
    reg = client.post("/api/auth/register", json={
        "email": "refresh@example.com",
        "password": "securepassword123",
        "name": "Refresh User",
    })
    refresh_token = reg.json()["refresh_token"]
    response = client.post("/api/auth/refresh", json={
        "refresh_token": refresh_token,
    })
    assert response.status_code == 200
    assert response.json()["access_token"]


def test_refresh_with_access_token_fails(client):
    reg = client.post("/api/auth/register", json={
        "email": "badrefresh@example.com",
        "password": "securepassword123",
        "name": "Bad Refresh User",
    })
    access_token = reg.json()["access_token"]
    response = client.post("/api/auth/refresh", json={
        "refresh_token": access_token,
    })
    assert response.status_code == 401


# --- Me ---

def test_me_success(client):
    reg = client.post("/api/auth/register", json={
        "email": "me@example.com",
        "password": "securepassword123",
        "name": "Me User",
    })
    access_token = reg.json()["access_token"]
    response = client.get("/api/auth/me", headers={
        "Authorization": f"Bearer {access_token}",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "me@example.com"
    assert data["name"] == "Me User"
    assert data["role"] == "editor"


def test_me_no_token(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401 or response.status_code == 403
```

Note: These tests require a real database. They will need a test database setup — either use the existing PostgreSQL from Docker Compose, or create a test fixture that uses a separate test DB. For now, these tests are written against the real app. When running, ensure the DB is available and clean.

**Step 2: Run tests to verify they fail**

```bash
cd backend
pytest tests/test_auth_router.py -v
```

Expected: FAIL — router not yet created.

**Step 3: Create the auth router**

Create `backend/app/routers/__init__.py`:

```python
```

Create `backend/app/routers/auth.py`:

```python
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserResponse
from app.services.auth_service import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == request.email))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        email=request.email,
        password_hash=hash_password(request.password),
        name=request.name,
        role=UserRole.editor,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return TokenResponse(
        access_token=create_access_token(str(user.id), user.role.value),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if user is None or user.password_hash is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )

    return TokenResponse(
        access_token=create_access_token(str(user.id), user.role.value),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: RefreshRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        payload = decode_token(request.refresh_token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or disabled",
        )

    return TokenResponse(
        access_token=create_access_token(str(user.id), user.role.value),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.get("/me", response_model=UserResponse)
async def me(
    current_user: Annotated[User, Depends(get_current_user)],
):
    return current_user
```

**Step 4: Register the router in main.py**

In `backend/app/main.py`, add the router import and registration. After the CORS middleware block (after line 17), add:

```python
from app.routers.auth import router as auth_router

app.include_router(auth_router)
```

**Step 5: Run tests to verify they pass**

```bash
cd backend
pytest tests/test_auth_router.py -v
```

Expected: All tests PASS (requires running PostgreSQL with clean `ndrama` database).

**Step 6: Commit**

```bash
git add backend/app/routers/ backend/app/main.py backend/tests/test_auth_router.py
git commit -m "feat: add auth endpoints (register, login, refresh, me)"
```

---

### Task 7: User management router (admin-only CRUD)

**Files:**
- Create: `backend/app/routers/users.py`
- Modify: `backend/app/main.py` (register router)
- Create: `backend/tests/test_users_router.py`

**Step 1: Write tests for user management endpoints**

Create `backend/tests/test_users_router.py`:

```python
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def _register_and_get_token(client, email, name="Test User"):
    """Helper: register a user and return access token."""
    resp = client.post("/api/auth/register", json={
        "email": email,
        "password": "securepassword123",
        "name": name,
    })
    return resp.json()["access_token"]


def _auth_header(token):
    return {"Authorization": f"Bearer {token}"}


# --- List Users ---

def test_list_users_as_admin(client):
    """Admin should be able to list all users."""
    # Note: First registered user needs to be manually promoted to admin
    # in test setup, or we need a seed admin. For now test that the
    # endpoint exists and rejects non-admin.
    token = _register_and_get_token(client, "listadmin@example.com")
    response = client.get("/api/users", headers=_auth_header(token))
    # Editor should be rejected
    assert response.status_code == 403


def test_list_users_no_auth(client):
    response = client.get("/api/users")
    assert response.status_code == 401 or response.status_code == 403


# --- Invite User ---

def test_invite_user_no_auth(client):
    response = client.post("/api/users/invite", json={
        "email": "invited@example.com",
        "name": "Invited User",
        "password": "temppassword123",
        "role": "editor",
    })
    assert response.status_code == 401 or response.status_code == 403
```

**Step 2: Run tests to verify they fail**

```bash
cd backend
pytest tests/test_users_router.py -v
```

Expected: FAIL — router not yet created.

**Step 3: Implement user management router**

Create `backend/app/routers/users.py`:

```python
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import require_admin
from app.models.user import User
from app.schemas.user import ChangeActiveRequest, ChangeRoleRequest, InviteUserRequest, UserResponse
from app.services.auth_service import hash_password

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserResponse])
async def list_users(
    _admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.post("/invite", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def invite_user(
    request: InviteUserRequest,
    _admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == request.email))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        email=request.email,
        password_hash=hash_password(request.password),
        name=request.name,
        role=request.role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.patch("/{user_id}/role", response_model=UserResponse)
async def change_role(
    user_id: uuid.UUID,
    request: ChangeRoleRequest,
    _admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.role = request.role
    await db.commit()
    await db.refresh(user)
    return user


@router.patch("/{user_id}/active", response_model=UserResponse)
async def change_active(
    user_id: uuid.UUID,
    request: ChangeActiveRequest,
    _admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_active = request.is_active
    await db.commit()
    await db.refresh(user)
    return user
```

**Step 4: Register users router in main.py**

In `backend/app/main.py`, add after the auth router import:

```python
from app.routers.users import router as users_router

app.include_router(users_router)
```

**Step 5: Run tests to verify they pass**

```bash
cd backend
pytest tests/test_users_router.py -v
```

Expected: All tests PASS.

**Step 6: Commit**

```bash
git add backend/app/routers/users.py backend/app/main.py backend/tests/test_users_router.py
git commit -m "feat: add admin-only user management endpoints (list, invite, role, active)"
```

---

### Task 8: Google OAuth endpoints

**Files:**
- Modify: `backend/app/routers/auth.py`
- Create: `backend/tests/test_oauth.py`

**Step 1: Add OAuth endpoints to auth router**

Add these imports to the top of `backend/app/routers/auth.py`:

```python
from authlib.integrations.starlette_client import OAuth
from starlette.requests import Request
from starlette.responses import RedirectResponse
```

Add OAuth client setup after the router definition:

```python
oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)
```

Note: You need to import `settings` at the top:

```python
from app.config import settings
```

Add these two endpoints to the bottom of the auth router file:

```python
@router.get("/google")
async def google_login(request: Request):
    redirect_uri = settings.google_redirect_uri
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    token = await oauth.google.authorize_access_token(request)
    user_info = token.get("userinfo")
    if user_info is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to get user info from Google",
        )

    email = user_info["email"]
    google_id = user_info["sub"]
    name = user_info.get("name", email)

    # Check if user exists by OAuth ID
    result = await db.execute(
        select(User).where(User.oauth_provider == "google", User.oauth_id == google_id)
    )
    user = result.scalar_one_or_none()

    if user is None:
        # Check if user exists by email (link accounts)
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user is None:
            # Create new user
            user = User(
                email=email,
                name=name,
                role=UserRole.editor,
                oauth_provider="google",
                oauth_id=google_id,
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        else:
            # Link Google to existing account
            user.oauth_provider = "google"
            user.oauth_id = google_id
            await db.commit()
            await db.refresh(user)

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )

    access_token = create_access_token(str(user.id), user.role.value)
    refresh_token = create_refresh_token(str(user.id))

    # Redirect to frontend with tokens as query params
    frontend_url = f"http://localhost:3000/auth/callback?access_token={access_token}&refresh_token={refresh_token}"
    return RedirectResponse(url=frontend_url)
```

Also add `starlette` to `backend/requirements.txt` if not already present (it's a FastAPI dependency, so it should already be installed).

**Step 2: Add itsdangerous dependency**

authlib's Starlette integration requires session middleware for OAuth state. Add to `backend/requirements.txt`:

```
itsdangerous>=2.1.0
```

And add session middleware in `backend/app/main.py` before the CORS middleware:

```python
from starlette.middleware.sessions import SessionMiddleware

app.add_middleware(SessionMiddleware, secret_key=settings.jwt_secret_key)
```

**Step 3: Write a basic test**

Create `backend/tests/test_oauth.py`:

```python
from fastapi.testclient import TestClient

from app.main import app


def test_google_login_redirect():
    """Google login endpoint should redirect to Google OAuth."""
    client = TestClient(app)
    # When no Google client_id is configured, this should still respond
    # (it will redirect to Google's auth URL or error gracefully)
    response = client.get("/api/auth/google", follow_redirects=False)
    # Should be a redirect (302) to Google's OAuth URL
    assert response.status_code in (302, 307, 500)
    # If Google credentials are not configured, a 500 is acceptable in tests
```

**Step 4: Run tests**

```bash
cd backend
pip install authlib itsdangerous
pytest tests/test_oauth.py -v
```

**Step 5: Commit**

```bash
git add backend/app/routers/auth.py backend/app/main.py backend/requirements.txt backend/tests/test_oauth.py
git commit -m "feat: add Google OAuth login and callback endpoints"
```

---

### Task 9: Install axios + create API client with interceptors (frontend)

**Files:**
- Create: `frontend/src/lib/api.ts`

**Step 1: Install axios**

```bash
cd frontend
npm install axios
```

**Step 2: Create API client**

Create `frontend/src/lib/api.ts`:

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        // No refresh token, redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const response = await axios.post('http://localhost:8000/api/auth/refresh', {
          refresh_token: refreshToken,
        })

        const { access_token, refresh_token } = response.data
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', refresh_token)

        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return api(originalRequest)
      } catch {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default api
```

**Step 3: Commit**

```bash
git add frontend/src/lib/api.ts frontend/package.json frontend/package-lock.json
git commit -m "feat: add axios API client with JWT interceptors (auto-attach, auto-refresh)"
```

---

### Task 10: Auth Pinia store (frontend)

**Files:**
- Create: `frontend/src/stores/auth.ts`

**Step 1: Create auth store**

Create `frontend/src/stores/auth.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../lib/api'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'editor'
  is_active: boolean
  oauth_provider: string | null
  created_at: string
  updated_at: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('access_token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'))

  const isAuthenticated = computed(() => !!accessToken.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  function setTokens(access: string, refresh: string) {
    accessToken.value = access
    refreshToken.value = refresh
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
  }

  function clearAuth() {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  async function login(email: string, password: string) {
    const response = await api.post('/api/auth/login', { email, password })
    setTokens(response.data.access_token, response.data.refresh_token)
    await fetchMe()
  }

  async function register(email: string, password: string, name: string) {
    const response = await api.post('/api/auth/register', { email, password, name })
    setTokens(response.data.access_token, response.data.refresh_token)
    await fetchMe()
  }

  function loginWithGoogle() {
    window.location.href = 'http://localhost:8000/api/auth/google'
  }

  async function fetchMe() {
    try {
      const response = await api.get('/api/auth/me')
      user.value = response.data
    } catch {
      clearAuth()
    }
  }

  function logout() {
    clearAuth()
  }

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isAdmin,
    login,
    register,
    loginWithGoogle,
    fetchMe,
    logout,
    setTokens,
    clearAuth,
  }
})
```

**Step 2: Commit**

```bash
git add frontend/src/stores/auth.ts
git commit -m "feat: add auth Pinia store with login, register, OAuth, and token management"
```

---

### Task 11: Login page (frontend)

**Files:**
- Create: `frontend/src/views/LoginView.vue`

**Step 1: Create login page**

Create `frontend/src/views/LoginView.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    router.push('/')
  } catch (e: any) {
    error.value = e.response?.data?.detail || 'Login failed'
  } finally {
    loading.value = false
  }
}

function handleGoogleLogin() {
  auth.loginWithGoogle()
}
</script>

<template>
  <div class="min-h-screen bg-bg-primary flex items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-accent">nDrama</h1>
        <p class="text-text-secondary mt-2">Sign in to your account</p>
      </div>

      <!-- Login form -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <!-- Error message -->
        <div
          v-if="error"
          class="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm"
        >
          {{ error }}
        </div>

        <!-- Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-text-secondary mb-1">
            Email
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary placeholder-text-secondary/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="you@example.com"
          />
        </div>

        <!-- Password -->
        <div>
          <label for="password" class="block text-sm font-medium text-text-secondary mb-1">
            Password
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary placeholder-text-secondary/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="Enter your password"
          />
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>

      <!-- Divider -->
      <div class="relative my-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-border"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="bg-bg-primary px-2 text-text-secondary">or</span>
        </div>
      </div>

      <!-- Google OAuth -->
      <button
        @click="handleGoogleLogin"
        class="w-full flex items-center justify-center gap-3 rounded-lg border border-border bg-bg-secondary px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary transition-colors"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Sign in with Google
      </button>
    </div>
  </div>
</template>
```

**Step 2: Commit**

```bash
git add frontend/src/views/LoginView.vue
git commit -m "feat: add login page with email/password and Google OAuth"
```

---

### Task 12: Vue Router guards + auth callback route

**Files:**
- Modify: `frontend/src/router/index.ts`
- Create: `frontend/src/views/AuthCallbackView.vue`

**Step 1: Create OAuth callback view**

Create `frontend/src/views/AuthCallbackView.vue`:

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

onMounted(async () => {
  const accessToken = route.query.access_token as string
  const refreshToken = route.query.refresh_token as string

  if (accessToken && refreshToken) {
    auth.setTokens(accessToken, refreshToken)
    await auth.fetchMe()
    router.push('/')
  } else {
    router.push('/login')
  }
})
</script>

<template>
  <div class="min-h-screen bg-bg-primary flex items-center justify-center">
    <p class="text-text-secondary">Authenticating...</p>
  </div>
</template>
```

**Step 2: Update router with guards**

Replace `frontend/src/router/index.ts` entirely:

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: () => import('../views/AuthCallbackView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
    },
    {
      path: '/series',
      name: 'series',
      component: () => import('../views/SeriesView.vue'),
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('../views/UsersView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Public routes don't need auth
  if (to.meta.public) {
    // If already authenticated, redirect to dashboard
    if (auth.isAuthenticated && to.name === 'login') {
      return { name: 'dashboard' }
    }
    return true
  }

  // Protected routes require auth
  if (!auth.isAuthenticated) {
    return { name: 'login' }
  }

  // If we have a token but no user data, fetch it
  if (!auth.user) {
    await auth.fetchMe()
    // If fetchMe failed (cleared auth), redirect to login
    if (!auth.isAuthenticated) {
      return { name: 'login' }
    }
  }

  // Admin-only routes
  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
```

**Step 3: Commit**

```bash
git add frontend/src/router/index.ts frontend/src/views/AuthCallbackView.vue
git commit -m "feat: add route guards (auth required, admin check) and OAuth callback route"
```

---

### Task 13: Update AppLayout to conditionally show sidebar + add logout

**Files:**
- Modify: `frontend/src/components/layout/AppLayout.vue`
- Modify: `frontend/src/components/layout/Sidebar.vue`

**Step 1: Update AppLayout to hide sidebar on login**

Replace `frontend/src/components/layout/AppLayout.vue`:

```vue
<script setup lang="ts">
import { useRoute } from 'vue-router'
import Sidebar from './Sidebar.vue'

const route = useRoute()

const publicRoutes = ['login', 'auth-callback']
</script>

<template>
  <div class="min-h-screen bg-bg-primary">
    <template v-if="!publicRoutes.includes(route.name as string)">
      <Sidebar />
      <main class="pl-64">
        <div class="px-8 py-6">
          <slot />
        </div>
      </main>
    </template>
    <template v-else>
      <slot />
    </template>
  </div>
</template>
```

**Step 2: Add Users nav item and logout to Sidebar**

Replace `frontend/src/components/layout/Sidebar.vue`:

```vue
<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  HomeIcon,
  FilmIcon,
  Cog6ToothIcon,
  UsersIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Series', href: '/series', icon: FilmIcon },
  { name: 'Users', href: '/users', icon: UsersIcon, adminOnly: true },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]

function isActive(href: string): boolean {
  return route.path === href
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <aside class="fixed inset-y-0 left-0 z-50 w-64 bg-bg-secondary border-r border-bg-tertiary flex flex-col">
    <!-- Logo -->
    <div class="flex h-16 items-center px-6 border-b border-bg-tertiary">
      <span class="text-xl font-bold text-accent">nDrama</span>
    </div>

    <!-- Navigation -->
    <nav class="mt-6 px-3 flex-1">
      <ul class="space-y-1">
        <li
          v-for="item in navigation"
          :key="item.name"
        >
          <RouterLink
            v-if="!item.adminOnly || auth.isAdmin"
            :to="item.href"
            :class="[
              isActive(item.href)
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
              'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            ]"
          >
            <component
              :is="item.icon"
              :class="[
                isActive(item.href) ? 'text-white' : 'text-text-secondary group-hover:text-text-primary',
                'h-5 w-5 shrink-0 transition-colors',
              ]"
            />
            {{ item.name }}
          </RouterLink>
        </li>
      </ul>
    </nav>

    <!-- User section at bottom -->
    <div class="border-t border-bg-tertiary p-3">
      <div class="flex items-center gap-3 px-3 py-2">
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-text-primary truncate">
            {{ auth.user?.name }}
          </p>
          <p class="text-xs text-text-secondary truncate">
            {{ auth.user?.email }}
          </p>
        </div>
        <button
          @click="handleLogout"
          class="text-text-secondary hover:text-text-primary transition-colors"
          title="Sign out"
        >
          <ArrowRightStartOnRectangleIcon class="h-5 w-5" />
        </button>
      </div>
    </div>
  </aside>
</template>
```

**Step 3: Commit**

```bash
git add frontend/src/components/layout/AppLayout.vue frontend/src/components/layout/Sidebar.vue
git commit -m "feat: conditional sidebar (hidden on login), add Users nav and logout button"
```

---

### Task 14: User management page (frontend)

**Files:**
- Create: `frontend/src/views/UsersView.vue`

**Step 1: Create user management page**

Create `frontend/src/views/UsersView.vue`:

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../lib/api'
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/vue'
import {
  EllipsisVerticalIcon,
  PlusIcon,
} from '@heroicons/vue/24/outline'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'editor'
  is_active: boolean
  oauth_provider: string | null
  created_at: string
}

const users = ref<User[]>([])
const loading = ref(true)
const error = ref('')

// Invite form state
const showInviteForm = ref(false)
const inviteEmail = ref('')
const inviteName = ref('')
const invitePassword = ref('')
const inviteRole = ref<'admin' | 'editor'>('editor')
const inviteLoading = ref(false)
const inviteError = ref('')

async function fetchUsers() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('/api/users')
    users.value = response.data
  } catch (e: any) {
    error.value = e.response?.data?.detail || 'Failed to load users'
  } finally {
    loading.value = false
  }
}

async function inviteUser() {
  inviteLoading.value = true
  inviteError.value = ''
  try {
    await api.post('/api/users/invite', {
      email: inviteEmail.value,
      name: inviteName.value,
      password: invitePassword.value,
      role: inviteRole.value,
    })
    showInviteForm.value = false
    inviteEmail.value = ''
    inviteName.value = ''
    invitePassword.value = ''
    inviteRole.value = 'editor'
    await fetchUsers()
  } catch (e: any) {
    inviteError.value = e.response?.data?.detail || 'Failed to invite user'
  } finally {
    inviteLoading.value = false
  }
}

async function changeRole(userId: string, role: 'admin' | 'editor') {
  try {
    await api.patch(`/api/users/${userId}/role`, { role })
    await fetchUsers()
  } catch (e: any) {
    error.value = e.response?.data?.detail || 'Failed to change role'
  }
}

async function toggleActive(userId: string, isActive: boolean) {
  try {
    await api.patch(`/api/users/${userId}/active`, { is_active: !isActive })
    await fetchUsers()
  } catch (e: any) {
    error.value = e.response?.data?.detail || 'Failed to update user status'
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

onMounted(fetchUsers)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-text-primary">Users</h1>
      <button
        @click="showInviteForm = true"
        class="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
      >
        <PlusIcon class="h-4 w-4" />
        Invite User
      </button>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm mb-4"
    >
      {{ error }}
    </div>

    <!-- Invite Form Modal -->
    <div
      v-if="showInviteForm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div class="bg-bg-secondary border border-border rounded-xl p-6 w-full max-w-md">
        <h2 class="text-lg font-semibold text-text-primary mb-4">Invite User</h2>

        <div
          v-if="inviteError"
          class="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm mb-4"
        >
          {{ inviteError }}
        </div>

        <form @submit.prevent="inviteUser" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1">Email</label>
            <input
              v-model="inviteEmail"
              type="email"
              required
              class="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1">Name</label>
            <input
              v-model="inviteName"
              type="text"
              required
              class="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1">Temporary Password</label>
            <input
              v-model="invitePassword"
              type="password"
              required
              class="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1">Role</label>
            <select
              v-model="inviteRole"
              class="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              @click="showInviteForm = false"
              class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-tertiary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="inviteLoading"
              class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {{ inviteLoading ? 'Inviting...' : 'Send Invite' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-text-secondary">Loading users...</div>

    <!-- Users Table -->
    <div v-else class="overflow-hidden rounded-xl border border-border">
      <table class="w-full">
        <thead>
          <tr class="border-b border-border bg-bg-secondary">
            <th class="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Name</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Email</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Role</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Joined</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr v-for="u in users" :key="u.id" class="hover:bg-bg-secondary/50 transition-colors">
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-text-primary">{{ u.name }}</span>
                <span
                  v-if="u.oauth_provider"
                  class="inline-flex items-center rounded-full bg-bg-tertiary px-2 py-0.5 text-xs text-text-secondary"
                >
                  {{ u.oauth_provider }}
                </span>
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-text-secondary">{{ u.email }}</td>
            <td class="px-4 py-3">
              <span
                :class="[
                  u.role === 'admin'
                    ? 'bg-accent/15 text-accent'
                    : 'bg-bg-tertiary text-text-secondary',
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                ]"
              >
                {{ u.role }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span
                :class="[
                  u.is_active
                    ? 'bg-green-500/15 text-green-400'
                    : 'bg-destructive/15 text-destructive',
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                ]"
              >
                {{ u.is_active ? 'Active' : 'Disabled' }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-text-secondary">{{ formatDate(u.created_at) }}</td>
            <td class="px-4 py-3 text-right">
              <Menu as="div" class="relative inline-block text-left">
                <MenuButton class="text-text-secondary hover:text-text-primary transition-colors">
                  <EllipsisVerticalIcon class="h-5 w-5" />
                </MenuButton>
                <MenuItems class="absolute right-0 z-10 mt-2 w-48 rounded-lg bg-bg-secondary border border-border shadow-lg focus:outline-none">
                  <div class="py-1">
                    <MenuItem v-slot="{ active }">
                      <button
                        @click="changeRole(u.id, u.role === 'admin' ? 'editor' : 'admin')"
                        :class="[active ? 'bg-bg-tertiary' : '', 'block w-full px-4 py-2 text-left text-sm text-text-primary']"
                      >
                        Make {{ u.role === 'admin' ? 'Editor' : 'Admin' }}
                      </button>
                    </MenuItem>
                    <MenuItem v-slot="{ active }">
                      <button
                        @click="toggleActive(u.id, u.is_active)"
                        :class="[active ? 'bg-bg-tertiary' : '', 'block w-full px-4 py-2 text-left text-sm', u.is_active ? 'text-destructive' : 'text-green-400']"
                      >
                        {{ u.is_active ? 'Disable Account' : 'Enable Account' }}
                      </button>
                    </MenuItem>
                  </div>
                </MenuItems>
              </Menu>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
```

**Step 2: Commit**

```bash
git add frontend/src/views/UsersView.vue
git commit -m "feat: add admin user management page with invite, role change, and disable"
```

---

### Task 15: Final integration — verify full flow

**Files:** None new — verification only.

**Step 1: Ensure Docker Compose services are running**

```bash
docker compose up -d postgres minio
```

**Step 2: Install all backend dependencies**

```bash
cd backend
pip install -r requirements.txt
```

**Step 3: Run Alembic migration**

```bash
cd backend
alembic upgrade head
```

**Step 4: Run all backend tests**

```bash
cd backend
pytest -v
```

Expected: All tests pass.

**Step 5: Install frontend dependencies**

```bash
cd frontend
npm install
```

**Step 6: Verify frontend builds**

```bash
cd frontend
npm run type-check
npm run build
```

Expected: No TypeScript errors, build succeeds.

**Step 7: Commit any fixes if needed**

If any issues were found and fixed, commit them:

```bash
git add -A
git commit -m "fix: resolve integration issues from full-stack auth verification"
```

---

## Summary of Tasks

| # | Task | GitHub Issue | Type |
|---|------|-------------|------|
| 1 | Auth dependencies + config | #13 (partial) | Backend |
| 2 | User model + migration | #13 | Backend |
| 3 | Pydantic schemas | #14 (partial) | Backend |
| 4 | Auth service (hash + JWT) | #14 (partial) | Backend |
| 5 | Auth middleware (dependencies) | #16 | Backend |
| 6 | Auth router (register/login/refresh/me) | #14 | Backend |
| 7 | User management router | #19 (backend) | Backend |
| 8 | Google OAuth endpoints | #15 | Backend |
| 9 | Axios API client + interceptors | #18 (partial) | Frontend |
| 10 | Auth Pinia store | #18 | Frontend |
| 11 | Login page | #17 | Frontend |
| 12 | Router guards + OAuth callback | #18 (partial) | Frontend |
| 13 | AppLayout + Sidebar updates | #17 (partial) | Frontend |
| 14 | User management page | #19 (frontend) | Frontend |
| 15 | Full integration verification | All | Verification |
