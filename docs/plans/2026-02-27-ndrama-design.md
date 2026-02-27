# nDrama — Management Panel Design

## Overview

nDrama is a single-tenant, multi-user management panel for a short series streaming platform backed by Saudi Arabia. It allows admin and editor users to manage a catalog of short series, their episodes, video assets, audio tracks, subtitles, and monetization configuration.

End-user consumer app and payment processing are out of scope for this phase.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python 3.11+) |
| ORM | SQLAlchemy 2.0 (async) + Alembic |
| Database | PostgreSQL |
| Frontend | Vue 3 + Vite |
| UI | Tailwind CSS + Headless UI |
| State | Pinia |
| Routing | Vue Router |
| Video | Mux (via provider abstraction) |
| File Storage | S3-compatible (MinIO for local dev) |
| Auth | JWT (access + refresh) + OAuth (Google) |
| Infra | Docker Compose (local dev), containerized for any cloud |

## Data Model

### User
- `id` (UUID, PK)
- `email` (unique)
- `password_hash` (nullable — OAuth users may not have one)
- `name`
- `role` (admin | editor)
- `oauth_provider` (nullable)
- `oauth_id` (nullable)
- `created_at`, `updated_at`

### Series
- `id` (UUID, PK)
- `title`
- `description`
- `thumbnail_url`
- `status` (draft | published | archived)
- `free_episode_count` (int, default 3)
- `coin_cost_per_episode` (int)
- `created_by` → User (FK)
- `created_at`, `updated_at`

### Tag
- `id` (UUID, PK)
- `name` (unique)
- `category` (nullable — e.g., "genre", "mood", "language")
- `created_at`, `updated_at`

### SeriesTag (join table)
- `series_id` → Series (FK)
- `tag_id` → Tag (FK)

### Episode
- `id` (UUID, PK)
- `series_id` → Series (FK)
- `title`
- `description`
- `episode_number` (int)
- `thumbnail_url`
- `status` (draft | published)
- `video_provider` (enum: mux | future_providers)
- `video_provider_asset_id` (string)
- `video_playback_id` (string)
- `duration_seconds` (int, nullable)
- `created_by` → User (FK)
- `created_at`, `updated_at`

### AudioTrack
- `id` (UUID, PK)
- `episode_id` → Episode (FK)
- `language_code` (e.g., "en", "ar", "fr")
- `label` (e.g., "English", "Arabic")
- `file_url`
- `is_default` (bool)
- `created_at`, `updated_at`

### Subtitle
- `id` (UUID, PK)
- `episode_id` → Episode (FK)
- `language_code`
- `label`
- `file_url` (SRT/VTT)
- `is_default` (bool)
- `created_at`, `updated_at`

## Architecture

```
┌─────────────────┐         ┌─────────────────┐        ┌──────────┐
│  Vue 3 + Vite   │  HTTP   │   FastAPI API    │  SQL   │ Postgres │
│  (Frontend)     │────────>│   (Backend)      │------->│          │
│  Port 3000      │  JWT    │   Port 8000      │        │          │
└─────────────────┘         └────────┬──────────┘        └──────────┘
                                     │
                              ┌──────┴──────┐
                              │  Mux API    │
                              │  (Videos)   │
                              └─────────────┘
                              ┌──────────────┐
                              │  S3/MinIO    │
                              │  (Files)     │
                              └──────────────┘
```

### Backend Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI app entry
│   ├── config.py                # Settings via pydantic-settings
│   ├── database.py              # SQLAlchemy async engine + session
│   ├── models/                  # SQLAlchemy models
│   ├── schemas/                 # Pydantic request/response schemas
│   ├── routers/                 # API route modules
│   ├── services/                # Business logic
│   │   ├── auth_service.py
│   │   ├── video_provider.py   # Abstract base + Mux implementation
│   │   └── file_storage.py     # Abstract base + S3/local impl
│   ├── middleware/              # Auth middleware, CORS
│   └── migrations/             # Alembic migrations
├── tests/
├── Dockerfile
└── requirements.txt
```

### Frontend Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Login.vue
│   │   ├── Dashboard.vue
│   │   ├── series/
│   │   ├── episodes/
│   │   ├── tags/
│   │   └── users/
│   ├── components/
│   ├── composables/            # useAuth, useApi, etc.
│   ├── stores/                 # Pinia stores
│   ├── router/                 # Vue Router config
│   └── assets/
├── Dockerfile
└── vite.config.ts
```

### Key Backend Decisions

- **Auth:** JWT tokens (access + refresh). OAuth via authlib.
- **Video provider abstraction:** `VideoProvider` base class with `MuxProvider` implementation. New providers = new class.
- **File storage:** Audio tracks, subtitles, and thumbnails uploaded to S3-compatible storage (MinIO for local dev).

## Visual Design

**Theme:** Dark

**Color Scheme — Saudi Green + Black:**

| Token | Value | Usage |
|---|---|---|
| bg-primary | #0A0A0A | Main background |
| bg-secondary | #171717 | Cards, panels, sidebars |
| bg-tertiary | #262626 | Hover states, inputs |
| border | #333333 | Borders, dividers |
| text-primary | #FAFAFA | Primary text |
| text-secondary | #A3A3A3 | Secondary/muted text |
| accent | #006C35 | Saudi green — buttons, links, active states |
| accent-hover | #008542 | Lighter green for hover |
| accent-muted | #006C35 at 15% | Green at 15% opacity — subtle highlights |
| destructive | #DC2626 | Delete actions, errors |
| warning | #F59E0B | Warnings |

**Layout:** Sidebar navigation (dark) + main content area.

**UI Library:** Tailwind CSS + Headless UI (unstyled primitives, full design control).

## Authentication & Authorization

- Email/password registration + login
- OAuth (Google) via authlib
- JWT access token (short-lived) + refresh token (long-lived)
- Two roles: **Admin** (full access including user management) and **Editor** (content management only)

## Monetization Model

- Each series has `free_episode_count` (default 3) — first N episodes are free
- Each series has `coin_cost_per_episode` — cost in virtual coins to unlock paid episodes
- Management panel configures these values per series
- Actual coin purchase/wallet system is deferred to the consumer app phase

## Roadmap — Epics & Stories

### Epic 1: Project Bootstrap & Infrastructure

| Story | Tags |
|-------|------|
| Initialize FastAPI backend project (structure, config, health endpoint) | backend, infra |
| Initialize Vue 3 + Vite frontend project (structure, layout, config) | frontend, infra |
| Set up PostgreSQL + SQLAlchemy + Alembic migrations | backend, infra |
| Docker Compose for local dev (postgres, minio, backend, frontend) | infra |
| CI pipeline (lint, test, build) via GitHub Actions | infra |

### Epic 2: Authentication & User Management

| Story | Tags |
|-------|------|
| User model + migration | backend |
| Email/password registration + login endpoints (JWT) | backend |
| OAuth integration (Google) | backend |
| Auth middleware + role-based guards (admin/editor) | backend |
| Login page (email/password + OAuth buttons) | frontend |
| Auth store (Pinia) + route middleware (protected pages) | frontend |
| User management page (admin: list, invite, change roles) | frontend, backend |

### Epic 3: Series CRUD + Tagging

| Story | Tags |
|-------|------|
| Series + Tag + SeriesTag models + migrations | backend |
| Tag CRUD endpoints (with category support) | backend |
| Series CRUD endpoints (with tag assignment, filtering, pagination) | backend |
| Thumbnail upload to S3/MinIO | backend |
| Tag management page | frontend |
| Series list page (filter by tag/status, search, paginate) | frontend |
| Series create/edit form (with tag picker, thumbnail upload) | frontend |

### Epic 4: Episode Management + Video Upload

| Story | Tags |
|-------|------|
| Episode model + migration | backend |
| VideoProvider abstraction + MuxProvider implementation | backend |
| Episode CRUD endpoints (with video upload to Mux) | backend |
| Episode list within series detail page | frontend |
| Episode create/edit form (video upload with progress) | frontend |
| Video player preview (Mux player embed) | frontend |

### Epic 5: Audio Tracks & Subtitles

| Story | Tags |
|-------|------|
| AudioTrack + Subtitle models + migrations | backend |
| Audio track upload/CRUD endpoints | backend |
| Subtitle upload/CRUD endpoints (SRT/VTT) | backend |
| Audio track management UI on episode detail | frontend |
| Subtitle management UI on episode detail | frontend |
| Player integration (audio/subtitle track switching) | frontend |

### Epic 6: Monetization Configuration

| Story | Tags |
|-------|------|
| Add free_episode_count and coin_cost_per_episode fields to Series | backend |
| Series pricing configuration endpoints | backend |
| Pricing configuration UI in series edit form | frontend |
| Episode list visual indicator (free vs locked) | frontend |

### Epic 7: Dashboard & Polish

| Story | Tags |
|-------|------|
| Dashboard API (series count, episode count, recent activity) | backend |
| Dashboard page (stats cards, recent series, quick actions) | frontend |
| Global search across series and episodes | backend, frontend |
| UI polish pass (loading states, error handling, empty states) | frontend |

## Out of Scope

- End-user consumer application
- Coin purchase / wallet / payment processing
- Content delivery / CDN configuration
- Analytics beyond basic dashboard counts
- Mobile app
