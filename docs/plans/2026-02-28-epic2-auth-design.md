# Epic 2: Authentication & User Management — Design

## Overview

Implement sign in, sign up, Google OAuth, JWT tokens, and role-based access control for the nDrama management panel.

## Decisions

- **Auth:** JWT access token (15min) + refresh token (7 days), HS256
- **OAuth:** Google via authlib
- **Password hashing:** bcrypt via passlib
- **Roles:** Admin (full access) + Editor (content only)
- **Architecture:** Service-layer pattern (auth_service + thin routers + middleware dependencies)
- **Token storage (frontend):** localStorage
- **HTTP client (frontend):** axios with interceptor for auto-attach/refresh

## Data Model: User

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | UUIDMixin |
| email | string | unique, indexed |
| password_hash | string (nullable) | nullable for OAuth-only users |
| name | string | |
| role | enum: admin, editor | default "editor" |
| oauth_provider | string (nullable) | e.g., "google" |
| oauth_id | string (nullable) | provider's user ID |
| is_active | bool | default True, soft-disable |
| created_at, updated_at | timestamp | TimestampMixin |

## Backend Structure

```
backend/app/
├── models/user.py              # User model + UserRole enum
├── schemas/auth.py             # Pydantic request/response schemas
├── schemas/user.py             # User CRUD schemas
├── services/auth_service.py    # All auth logic (hash, JWT, OAuth)
├── routers/auth.py             # Auth endpoints
├── routers/users.py            # User management endpoints (admin)
├── middleware/auth.py           # FastAPI dependencies (get_current_user, require_admin)
```

## Auth Service Functions

- `hash_password(plain) -> str` — bcrypt via passlib
- `verify_password(plain, hashed) -> bool`
- `create_access_token(user_id, role) -> str` — 15min, HS256
- `create_refresh_token(user_id) -> str` — 7 days
- `decode_token(token) -> payload`
- `register_user(email, password, name) -> User`
- `authenticate_user(email, password) -> User | None`
- `authenticate_oauth(provider, oauth_token) -> User`

Token payload: `{ sub: user_id, role: "admin"|"editor", exp: timestamp, type: "access"|"refresh" }`

## API Endpoints

### Auth (`/api/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | None | Register with email/password |
| POST | `/api/auth/login` | None | Login, returns access+refresh tokens |
| POST | `/api/auth/refresh` | Refresh token | Get new access token |
| GET | `/api/auth/me` | Access token | Get current user profile |
| GET | `/api/auth/google` | None | Redirect to Google OAuth |
| GET | `/api/auth/google/callback` | None | OAuth callback, returns tokens |

### User Management (`/api/users`) — Admin only

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users` | Admin | List all users |
| POST | `/api/users/invite` | Admin | Create user with invite |
| PATCH | `/api/users/{id}/role` | Admin | Change user role |
| PATCH | `/api/users/{id}/active` | Admin | Enable/disable user |

## Middleware Dependencies

- `get_current_user(token)` — decodes JWT, fetches user, raises 401
- `require_admin(user)` — raises 403 if not admin
- `require_active(user)` — raises 403 if disabled

## Config Additions

```python
jwt_secret_key: str = "change-me-in-production"
jwt_access_token_expire_minutes: int = 15
jwt_refresh_token_expire_days: int = 7
google_client_id: str = ""
google_client_secret: str = ""
google_redirect_uri: str = "http://localhost:8000/api/auth/google/callback"
```

## Frontend Structure

```
frontend/src/
├── stores/auth.ts              # Auth Pinia store
├── lib/api.ts                  # Axios instance with interceptors
├── views/LoginView.vue         # Login page
├── views/UsersView.vue         # User management (admin)
```

### Auth Store (Pinia)

- State: `user`, `accessToken`, `refreshToken`, `isAuthenticated`
- Actions: `login()`, `loginWithGoogle()`, `register()`, `logout()`, `refreshAccessToken()`, `fetchMe()`
- Tokens in localStorage

### Route Guard

- `beforeEach` guard in router
- Public routes: `/login`
- Protected routes: everything else (require valid token)
- Admin-only routes: `/users` (check role)

### Login Page

- Email/password form + "Sign in with Google" button
- Dark theme matching existing design system
- Error display, redirect to dashboard on success

### User Management Page

- Table: name, email, role, status, created date
- Invite user button (email, name, role, temp password)
- Inline role change dropdown
- Active/inactive toggle
- Admin-only access

## New Dependencies

**Backend:** `passlib[bcrypt]`, `python-jose[cryptography]`, `authlib`, `httpx`

**Frontend:** `axios`
