# Epic 8: Subscribers & Coin Economy — Design

## Overview

Introduce subscriber management to the nDrama admin panel. Subscribers are end-users of the mobile app (built separately). This epic builds the data models, admin API endpoints, and admin frontend pages for viewing/moderating subscribers and managing coin packages. Subscriber-facing auth and APIs live in a separate backend (future).

## Decisions

- **Architecture:** Shared PostgreSQL database between admin backend and future subscriber API
- **Subscriber model:** Separate from `users` table (admin/editor users). Subscribers are a distinct entity.
- **Anonymous support:** Device ID + server-issued session token. Subscriber row created on first app open.
- **Coin system:** Wallet with packages — balance on subscriber, transaction log for audit, admin-managed purchasable packages.
- **Admin role:** View + moderate. Editors can view subscribers/transactions. Admins can suspend/ban, adjust coins, manage packages.
- **Profile scope:** Minimal (name, email, country). Language, favorites, recommendations in a future epic.

## Out of Scope

- Subscriber authentication/login (separate API backend)
- Payment integration (Stripe, Apple Pay, Google Pay)
- Watch history, favorites, content recommendations
- Mobile app
- Subscriber-facing API endpoints
- Push notifications
- Analytics/reporting beyond basic dashboard stats

## Data Models

### `subscribers`

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | UUIDMixin |
| email | VARCHAR(255), unique, nullable | Null for anonymous subscribers |
| name | VARCHAR(255), nullable | Null for anonymous subscribers |
| country | VARCHAR(2), nullable | ISO 3166-1 alpha-2 (e.g. "SA") |
| avatar_url | VARCHAR(500), nullable | Profile picture URL |
| device_id | VARCHAR(255), not null, indexed | Mobile device UUID, always present |
| status | ENUM: anonymous, active, suspended, banned | Default "anonymous" |
| coin_balance | INTEGER, default 0 | Denormalized for fast reads |
| registered_at | DATETIME(tz), nullable | Set when anonymous → registered |
| last_active_at | DATETIME(tz), nullable | Updated by subscriber API |
| admin_notes | TEXT, nullable | Moderator notes |
| created_at, updated_at | DATETIME(tz) | TimestampMixin |

### `coin_transactions`

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | UUIDMixin |
| subscriber_id | UUID FK → subscribers.id | CASCADE delete |
| type | ENUM: purchase, spend, refund, promo, adjustment | Transaction type |
| amount | INTEGER, not null | Signed: positive = credit, negative = debit |
| balance_after | INTEGER, not null | Balance snapshot at time of transaction |
| reference_type | VARCHAR(50), nullable | e.g. "episode", "package", "admin" |
| reference_id | UUID, nullable | e.g. episode_id, package_id |
| description | VARCHAR(500), nullable | Human-readable reason |
| created_by | UUID FK → users.id, nullable | Set when admin adjusts balance |
| created_at | DATETIME(tz) | TimestampMixin (created_at only) |

### `coin_packages`

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | UUIDMixin |
| name | VARCHAR(100), not null | e.g. "Starter Pack" |
| description | VARCHAR(500), nullable | Package description |
| coin_amount | INTEGER, not null | Number of coins in package |
| price_sar | DECIMAL(10,2), not null | Price in Saudi Riyals |
| is_active | BOOLEAN, default true | Soft-disable toggle |
| sort_order | INTEGER, default 0 | Display ordering |
| created_by | UUID FK → users.id | Admin who created it |
| created_at, updated_at | DATETIME(tz) | TimestampMixin |

## Backend Structure

```
backend/app/
├── models/subscriber.py           # Subscriber model + SubscriberStatus enum
├── models/coin_transaction.py     # CoinTransaction model + TransactionType enum
├── models/coin_package.py         # CoinPackage model
├── schemas/subscriber.py          # Subscriber request/response schemas
├── schemas/coin_package.py        # CoinPackage request/response schemas
├── services/subscriber_service.py # Subscriber business logic
├── services/coin_service.py       # Coin transaction + package logic
├── routers/subscribers.py         # Subscriber admin endpoints
├── routers/coin_packages.py       # Coin package CRUD endpoints
```

## API Endpoints

### Subscriber Management (`/api/subscribers`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/subscribers` | admin/editor | List with pagination, search, filter by status/country |
| GET | `/api/subscribers/{id}` | admin/editor | Detail with recent transactions |
| PATCH | `/api/subscribers/{id}` | admin | Update status, admin_notes |
| GET | `/api/subscribers/{id}/transactions` | admin/editor | Paginated transaction history |
| POST | `/api/subscribers/{id}/adjust-coins` | admin | Credit/debit coins with reason |

### Coin Package Management (`/api/coin-packages`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/coin-packages` | admin/editor | List all packages |
| POST | `/api/coin-packages` | admin | Create package |
| PATCH | `/api/coin-packages/{id}` | admin | Update package |
| DELETE | `/api/coin-packages/{id}` | admin | Soft-delete (set is_active=false) |

### Dashboard Additions

- Subscriber stats: total, active, anonymous, suspended counts
- Coin economy: total coins in circulation, transaction count today

## Frontend Pages

### Subscribers Page (`/subscribers`)

- **List view:** Table with name/email (or "Anonymous"), status badge, country, coin balance, registered date, last active. Search bar, status filter, pagination.
- **Detail view** (`/subscribers/:id`): Profile card, coin balance, admin notes (editable), action buttons (suspend/ban/reactivate). Transaction history table below.
- **Coin adjustment modal:** Amount (+/-), reason (required), preview of new balance.

### Coin Packages Page (`/coin-packages`)

- **List view:** Table/cards with name, coin amount, price (SAR), active status, sort order. Create/edit/disable actions.
- **Create/Edit form:** Name, description, coin amount, price SAR, sort order, active toggle.

### Dashboard Additions

- Stats cards: Total Subscribers, Active Subscribers, Anonymous count
- Coin economy card: coins in circulation, transactions today

### Navigation

- "Subscribers" in sidebar nav
- "Coin Packages" under a "Monetization" group
