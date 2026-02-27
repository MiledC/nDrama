# nDrama GitHub Roadmap Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create the full nDrama roadmap as GitHub Issues — 7 Epics with ~30 Stories as sub-issues, with proper labels and descriptions.

**Architecture:** Use `gh` CLI to create custom labels, then create Epic issues, then create Story sub-issues linked to their parent Epic. Each issue gets descriptive body text pulled from the design doc.

**Tech Stack:** GitHub CLI (`gh`), GitHub Issues, GitHub Labels, GitHub Sub-issues

**Reference:** `docs/plans/2026-02-27-ndrama-design.md`

---

### Task 1: Create Custom GitHub Labels

**Step 1: Delete default labels that don't fit our workflow**

```bash
gh label delete "good first issue" --repo MiledC/nDrama --yes
gh label delete "help wanted" --repo MiledC/nDrama --yes
gh label delete "invalid" --repo MiledC/nDrama --yes
gh label delete "question" --repo MiledC/nDrama --yes
gh label delete "wontfix" --repo MiledC/nDrama --yes
gh label delete "duplicate" --repo MiledC/nDrama --yes
```

**Step 2: Create project-specific labels**

```bash
# Type labels
gh label create "epic" --description "Top-level feature slice" --color "6F42C1" --repo MiledC/nDrama
gh label create "story" --description "Individual work item within an epic" --color "0E8A16" --repo MiledC/nDrama

# Layer labels
gh label create "backend" --description "FastAPI / Python backend work" --color "1D76DB" --repo MiledC/nDrama
gh label create "frontend" --description "Vue 3 / Vite frontend work" --color "FBCA04" --repo MiledC/nDrama
gh label create "infra" --description "Docker, CI/CD, infrastructure" --color "5319E7" --repo MiledC/nDrama

# Priority labels
gh label create "priority:high" --description "Must be done first" --color "B60205" --repo MiledC/nDrama
gh label create "priority:medium" --description "Important but not blocking" --color "F9D0C4" --repo MiledC/nDrama
gh label create "priority:low" --description "Nice to have" --color "C2E0C6" --repo MiledC/nDrama
```

**Step 3: Verify labels**

Run: `gh label list --repo MiledC/nDrama`
Expected: All custom labels appear alongside remaining defaults (bug, documentation, enhancement).

**Step 4: Commit** — No file changes, skip.

---

### Task 2: Create Epic 1 — Project Bootstrap & Infrastructure

**Step 1: Create the Epic issue**

```bash
gh issue create --repo MiledC/nDrama \
  --title "Epic 1: Project Bootstrap & Infrastructure" \
  --label "epic,infra,priority:high" \
  --body "$(cat <<'BODY'
## Epic 1: Project Bootstrap & Infrastructure

Set up repositories, Docker, CI, database, and project scaffolding for the nDrama management panel.

### Tech Stack
- **Backend:** FastAPI (Python 3.11+) + SQLAlchemy 2.0 + Alembic + PostgreSQL
- **Frontend:** Vue 3 + Vite + Tailwind CSS + Headless UI + Pinia + Vue Router
- **Infra:** Docker Compose (postgres, minio, backend, frontend)
- **CI:** GitHub Actions (lint, test, build)

### Acceptance Criteria
- [ ] FastAPI backend runs with health endpoint
- [ ] Vue 3 + Vite frontend runs with base layout
- [ ] PostgreSQL connected via SQLAlchemy with Alembic migrations
- [ ] Docker Compose spins up all services locally
- [ ] CI pipeline runs lint + test + build on push

### Stories
See sub-issues below.
BODY
)"
```

Note the issue number returned (expected: `#1`). Use it as parent for sub-issues.

**Step 2: Create Story sub-issues for Epic 1**

Create each story and attach as sub-issue to the Epic. Replace `EPIC_NUM` with the actual Epic issue number from Step 1.

```bash
# Story 1.1
gh issue create --repo MiledC/nDrama \
  --title "Initialize FastAPI backend project (structure, config, health endpoint)" \
  --label "story,backend,infra,priority:high" \
  --body "$(cat <<'BODY'
## Story 1.1: Initialize FastAPI Backend

**Parent Epic:** #EPIC_NUM

### Description
Scaffold the FastAPI backend project with proper structure.

### Files to Create
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py           # FastAPI app, health endpoint
│   ├── config.py          # pydantic-settings config
│   └── database.py        # placeholder
├── tests/
│   └── test_health.py
├── requirements.txt
├── Dockerfile
└── .env.example
```

### Acceptance Criteria
- [ ] `GET /health` returns `{"status": "ok"}`
- [ ] Config loads from environment variables via pydantic-settings
- [ ] `pytest` runs and passes
- [ ] Dockerfile builds successfully
BODY
)"

# Story 1.2
gh issue create --repo MiledC/nDrama \
  --title "Initialize Vue 3 + Vite frontend project (structure, layout, config)" \
  --label "story,frontend,infra,priority:high" \
  --body "$(cat <<'BODY'
## Story 1.2: Initialize Vue 3 + Vite Frontend

**Parent Epic:** #EPIC_NUM

### Description
Scaffold the Vue 3 + Vite frontend with Tailwind CSS, Headless UI, Pinia, and Vue Router.

### Files to Create
```
frontend/
├── src/
│   ├── App.vue
│   ├── main.ts
│   ├── router/index.ts
│   ├── stores/
│   ├── pages/Login.vue (placeholder)
│   ├── pages/Dashboard.vue (placeholder)
│   ├── components/AppLayout.vue (sidebar + main content)
│   └── assets/
├── tailwind.config.js    # Saudi green dark theme tokens
├── vite.config.ts
├── Dockerfile
├── package.json
└── .env.example
```

### Tailwind Theme Tokens
| Token | Value |
|---|---|
| bg-primary | #0A0A0A |
| bg-secondary | #171717 |
| bg-tertiary | #262626 |
| border | #333333 |
| text-primary | #FAFAFA |
| text-secondary | #A3A3A3 |
| accent | #006C35 |
| accent-hover | #008542 |
| destructive | #DC2626 |
| warning | #F59E0B |

### Acceptance Criteria
- [ ] `npm run dev` starts the app
- [ ] Dark theme with Saudi green accent applied
- [ ] Sidebar layout renders
- [ ] Vue Router navigates between placeholder pages
- [ ] Dockerfile builds successfully
BODY
)"

# Story 1.3
gh issue create --repo MiledC/nDrama \
  --title "Set up PostgreSQL + SQLAlchemy + Alembic migrations" \
  --label "story,backend,infra,priority:high" \
  --body "$(cat <<'BODY'
## Story 1.3: Database Setup

**Parent Epic:** #EPIC_NUM

### Description
Configure SQLAlchemy 2.0 async engine, session management, and Alembic for migrations.

### Files to Create/Modify
- Modify: `backend/app/database.py` — async engine, session factory, Base model
- Create: `backend/alembic.ini`
- Create: `backend/app/migrations/env.py`
- Create: `backend/app/migrations/versions/` (empty)

### Acceptance Criteria
- [ ] SQLAlchemy async engine connects to PostgreSQL
- [ ] `alembic revision --autogenerate` works
- [ ] `alembic upgrade head` runs without errors
- [ ] Base model has `id` (UUID), `created_at`, `updated_at` as mixins
BODY
)"

# Story 1.4
gh issue create --repo MiledC/nDrama \
  --title "Docker Compose for local dev (postgres, minio, backend, frontend)" \
  --label "story,infra,priority:high" \
  --body "$(cat <<'BODY'
## Story 1.4: Docker Compose

**Parent Epic:** #EPIC_NUM

### Description
Create Docker Compose configuration for local development.

### Files to Create
- `docker-compose.yml`
- `backend/.env.example` (update with DB + MinIO vars)
- `frontend/.env.example` (update with API URL)

### Services
| Service | Image | Port |
|---|---|---|
| postgres | postgres:16 | 5432 |
| minio | minio/minio | 9000 (API), 9001 (console) |
| backend | ./backend (Dockerfile) | 8000 |
| frontend | ./frontend (Dockerfile) | 3000 |

### Acceptance Criteria
- [ ] `docker compose up` starts all 4 services
- [ ] Backend connects to PostgreSQL
- [ ] MinIO console accessible at localhost:9001
- [ ] Frontend proxies API calls to backend
BODY
)"

# Story 1.5
gh issue create --repo MiledC/nDrama \
  --title "CI pipeline (lint, test, build) via GitHub Actions" \
  --label "story,infra,priority:medium" \
  --body "$(cat <<'BODY'
## Story 1.5: CI Pipeline

**Parent Epic:** #EPIC_NUM

### Description
Set up GitHub Actions workflow for continuous integration.

### Files to Create
- `.github/workflows/ci.yml`

### Pipeline Steps
1. **Backend:** Install deps → lint (ruff) → test (pytest) → build Docker image
2. **Frontend:** Install deps → lint (eslint) → type-check → build → build Docker image

### Acceptance Criteria
- [ ] CI runs on push to main and on PRs
- [ ] Backend lint + test passes
- [ ] Frontend lint + build passes
- [ ] Status checks reported on PRs
BODY
)"
```

**Step 3: Link sub-issues to Epic**

```bash
# Replace EPIC_NUM with actual epic issue number, and STORY_NUMS with story numbers
gh issue develop STORY_NUM --repo MiledC/nDrama  # not needed, use sub-issue API instead

# Use gh api to add sub-issues
for STORY in STORY_1_1 STORY_1_2 STORY_1_3 STORY_1_4 STORY_1_5; do
  gh api graphql -f query='
    mutation {
      addSubIssue(input: {issueId: "EPIC_NODE_ID", subIssueId: "STORY_NODE_ID"}) {
        issue { id }
      }
    }
  '
done
```

To get node IDs:
```bash
gh issue view ISSUE_NUM --repo MiledC/nDrama --json id -q '.id'
```

**Step 4: Verify**

Run: `gh issue list --repo MiledC/nDrama --label epic`
Expected: Epic 1 shows with linked sub-issues.

---

### Task 3: Create Epic 2 — Authentication & User Management

**Step 1: Create the Epic issue**

```bash
gh issue create --repo MiledC/nDrama \
  --title "Epic 2: Authentication & User Management" \
  --label "epic,priority:high" \
  --body "$(cat <<'BODY'
## Epic 2: Authentication & User Management

Implement sign in, sign up, OAuth, JWT tokens, and role-based access control.

### Key Decisions
- **Auth:** JWT access token (short-lived) + refresh token (long-lived)
- **OAuth:** Google via authlib
- **Roles:** Admin (full access) + Editor (content only)
- **Password hashing:** bcrypt via passlib

### Data Model: User
| Field | Type |
|---|---|
| id | UUID (PK) |
| email | string (unique) |
| password_hash | string (nullable) |
| name | string |
| role | enum: admin, editor |
| oauth_provider | string (nullable) |
| oauth_id | string (nullable) |
| created_at, updated_at | timestamp |

### Acceptance Criteria
- [ ] Users can register with email/password
- [ ] Users can login and receive JWT tokens
- [ ] Users can login via Google OAuth
- [ ] Protected endpoints require valid JWT
- [ ] Admin-only endpoints reject editors
- [ ] Frontend login page works with both auth methods
- [ ] Admin can manage users (list, invite, change roles)
BODY
)"
```

**Step 2: Create Story sub-issues for Epic 2**

```bash
# Story 2.1
gh issue create --repo MiledC/nDrama \
  --title "User model + migration" \
  --label "story,backend,priority:high" \
  --body "$(cat <<'BODY'
## Story 2.1: User Model

**Parent Epic:** #EPIC_NUM

### Description
Create the User SQLAlchemy model and Alembic migration.

### Files to Create
- `backend/app/models/user.py`
- Migration via `alembic revision --autogenerate -m "create_users_table"`

### Model Fields
- id: UUID, primary key, default uuid4
- email: String, unique, not null
- password_hash: String, nullable (OAuth users)
- name: String, not null
- role: Enum(admin, editor), default editor
- oauth_provider: String, nullable
- oauth_id: String, nullable
- created_at: DateTime, default utcnow
- updated_at: DateTime, onupdate utcnow

### Acceptance Criteria
- [ ] Model defined with all fields
- [ ] Migration creates users table
- [ ] `alembic upgrade head` succeeds
BODY
)"

# Story 2.2
gh issue create --repo MiledC/nDrama \
  --title "Email/password registration + login endpoints (JWT)" \
  --label "story,backend,priority:high" \
  --body "$(cat <<'BODY'
## Story 2.2: Auth Endpoints

**Parent Epic:** #EPIC_NUM

### Description
Implement registration and login endpoints with JWT token issuance.

### Endpoints
| Method | Path | Description |
|---|---|---|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login, returns access + refresh tokens |
| POST | /api/auth/refresh | Refresh access token |
| GET | /api/auth/me | Get current user profile |

### Dependencies
- passlib[bcrypt] for password hashing
- python-jose[cryptography] for JWT
- pydantic schemas for request/response validation

### Acceptance Criteria
- [ ] Registration validates email uniqueness
- [ ] Login returns access_token + refresh_token
- [ ] Access token expires in 15 minutes
- [ ] Refresh token expires in 7 days
- [ ] /me endpoint returns user profile with valid token
- [ ] Tests cover happy path and error cases
BODY
)"

# Story 2.3
gh issue create --repo MiledC/nDrama \
  --title "OAuth integration (Google)" \
  --label "story,backend,priority:medium" \
  --body "$(cat <<'BODY'
## Story 2.3: Google OAuth

**Parent Epic:** #EPIC_NUM

### Description
Add Google OAuth login flow using authlib.

### Endpoints
| Method | Path | Description |
|---|---|---|
| GET | /api/auth/oauth/google | Redirect to Google consent |
| GET | /api/auth/oauth/google/callback | Handle callback, create/login user |

### Dependencies
- authlib
- httpx (async HTTP client)

### Acceptance Criteria
- [ ] Redirects to Google OAuth consent screen
- [ ] Callback creates new user or logs in existing
- [ ] Returns JWT tokens on success
- [ ] Links OAuth account to existing email if match found
BODY
)"

# Story 2.4
gh issue create --repo MiledC/nDrama \
  --title "Auth middleware + role-based guards (admin/editor)" \
  --label "story,backend,priority:high" \
  --body "$(cat <<'BODY'
## Story 2.4: Auth Middleware & Role Guards

**Parent Epic:** #EPIC_NUM

### Description
Create FastAPI dependencies for JWT validation and role-based access control.

### Files to Create
- `backend/app/middleware/auth.py`

### Dependencies (FastAPI Depends)
- `get_current_user` — validates JWT, returns User
- `require_admin` — validates JWT + checks role == admin
- `require_editor_or_above` — validates JWT + checks role in (admin, editor)

### Acceptance Criteria
- [ ] Invalid/expired tokens return 401
- [ ] Editor accessing admin-only endpoint returns 403
- [ ] Dependencies are reusable across all routers
- [ ] Tests cover valid token, expired token, wrong role
BODY
)"

# Story 2.5
gh issue create --repo MiledC/nDrama \
  --title "Login page (email/password + OAuth buttons)" \
  --label "story,frontend,priority:high" \
  --body "$(cat <<'BODY'
## Story 2.5: Login Page

**Parent Epic:** #EPIC_NUM

### Description
Build the login page with email/password form and Google OAuth button.

### Page: `/login`

### Components
- Email input field
- Password input field
- "Sign In" button
- "Sign in with Google" button
- Error message display
- Link to registration (if applicable)

### Design
- Centered card on dark background (#0A0A0A)
- Saudi green (#006C35) primary button
- nDrama logo/text at top

### Acceptance Criteria
- [ ] Email/password login calls POST /api/auth/login
- [ ] Google OAuth button redirects to /api/auth/oauth/google
- [ ] Successful login stores tokens and redirects to dashboard
- [ ] Error messages display for invalid credentials
- [ ] Responsive layout
BODY
)"

# Story 2.6
gh issue create --repo MiledC/nDrama \
  --title "Auth store (Pinia) + route middleware (protected pages)" \
  --label "story,frontend,priority:high" \
  --body "$(cat <<'BODY'
## Story 2.6: Auth Store & Route Guards

**Parent Epic:** #EPIC_NUM

### Description
Create Pinia auth store for token management and Vue Router navigation guards.

### Files to Create
- `frontend/src/stores/auth.ts`
- `frontend/src/router/guards.ts`
- `frontend/src/composables/useApi.ts` (axios/fetch wrapper with auth headers)

### Auth Store (Pinia)
- State: accessToken, refreshToken, user
- Actions: login, logout, refreshToken, fetchUser
- Getters: isAuthenticated, isAdmin, isEditor

### Route Guards
- Unauthenticated users → redirect to /login
- Authenticated users on /login → redirect to /dashboard
- Editor on admin-only routes → redirect to /dashboard with error

### Acceptance Criteria
- [ ] Tokens stored in localStorage
- [ ] Auto-refresh on 401 response
- [ ] Protected routes redirect to login
- [ ] Role-based route restrictions work
BODY
)"

# Story 2.7
gh issue create --repo MiledC/nDrama \
  --title "User management page (admin: list, invite, change roles)" \
  --label "story,frontend,backend,priority:medium" \
  --body "$(cat <<'BODY'
## Story 2.7: User Management

**Parent Epic:** #EPIC_NUM

### Description
Admin-only page to list users, invite new users, and change roles.

### Backend Endpoints
| Method | Path | Description |
|---|---|---|
| GET | /api/users | List all users (admin only) |
| POST | /api/users/invite | Invite user by email (admin only) |
| PATCH | /api/users/:id/role | Change user role (admin only) |
| DELETE | /api/users/:id | Deactivate user (admin only) |

### Frontend Page: `/users` (admin only)

### UI Components
- Users table (name, email, role, created date)
- Invite user modal (email + role selector)
- Role change dropdown
- Delete/deactivate confirmation dialog

### Acceptance Criteria
- [ ] Only admins can access this page
- [ ] User list with pagination
- [ ] Invite sends email (or creates account directly)
- [ ] Role changes take effect immediately
- [ ] Cannot demote/delete yourself
BODY
)"
```

**Step 3: Link sub-issues to Epic 2** (same GraphQL approach as Task 2)

---

### Task 4: Create Epic 3 — Series CRUD + Tagging

**Step 1: Create the Epic issue**

```bash
gh issue create --repo MiledC/nDrama \
  --title "Epic 3: Series CRUD + Tagging" \
  --label "epic,priority:high" \
  --body "$(cat <<'BODY'
## Epic 3: Series CRUD + Tagging

Create, read, update, delete series. Implement tag system with categories for content organization.

### Data Models

**Series:** id, title, description, thumbnail_url, status (draft|published|archived), free_episode_count, coin_cost_per_episode, created_by → User

**Tag:** id, name (unique), category (nullable — genre, mood, language)

**SeriesTag:** series_id → Series, tag_id → Tag (many-to-many)

### Acceptance Criteria
- [ ] Full CRUD for series with status management
- [ ] Full CRUD for tags with category grouping
- [ ] Many-to-many series-tag assignment
- [ ] Thumbnail upload to S3/MinIO
- [ ] Series list with filtering by tag, status, and search
- [ ] Frontend forms for series and tag management
BODY
)"
```

**Step 2: Create Story sub-issues for Epic 3**

```bash
# Story 3.1
gh issue create --repo MiledC/nDrama \
  --title "Series + Tag + SeriesTag models + migrations" \
  --label "story,backend,priority:high" \
  --body "$(cat <<'BODY'
## Story 3.1: Content Models

**Parent Epic:** #EPIC_NUM

### Description
Create SQLAlchemy models for Series, Tag, and SeriesTag join table.

### Files to Create
- `backend/app/models/series.py`
- `backend/app/models/tag.py`
- Migration via alembic

### Acceptance Criteria
- [ ] Series model with all fields from design doc
- [ ] Tag model with name + category
- [ ] SeriesTag many-to-many join table
- [ ] Migration runs cleanly
- [ ] Series.tags relationship loads associated tags
BODY
)"

# Story 3.2
gh issue create --repo MiledC/nDrama \
  --title "Tag CRUD endpoints (with category support)" \
  --label "story,backend,priority:high" \
  --body "$(cat <<'BODY'
## Story 3.2: Tag API

**Parent Epic:** #EPIC_NUM

### Endpoints
| Method | Path | Description |
|---|---|---|
| GET | /api/tags | List tags (optional filter by category) |
| POST | /api/tags | Create tag |
| PATCH | /api/tags/:id | Update tag |
| DELETE | /api/tags/:id | Delete tag (fails if in use) |
| GET | /api/tags/categories | List distinct categories |

### Acceptance Criteria
- [ ] CRUD operations work
- [ ] Filter by category query param
- [ ] Cannot delete tag assigned to a series
- [ ] Duplicate name returns 409
BODY
)"

# Story 3.3
gh issue create --repo MiledC/nDrama \
  --title "Series CRUD endpoints (with tag assignment, filtering, pagination)" \
  --label "story,backend,priority:high" \
  --body "$(cat <<'BODY'
## Story 3.3: Series API

**Parent Epic:** #EPIC_NUM

### Endpoints
| Method | Path | Description |
|---|---|---|
| GET | /api/series | List series (paginated, filterable) |
| GET | /api/series/:id | Get series detail with tags and episode count |
| POST | /api/series | Create series (with tag IDs) |
| PATCH | /api/series/:id | Update series (including tag assignment) |
| DELETE | /api/series/:id | Delete series (soft delete / archive) |

### Query Params for GET /api/series
- `page`, `per_page` — pagination
- `status` — filter by draft/published/archived
- `tag` — filter by tag ID
- `search` — search title/description
- `sort` — sort by title, created_at, updated_at

### Acceptance Criteria
- [ ] Pagination with total count in response
- [ ] Filter by status, tag, search
- [ ] Tag assignment on create/update
- [ ] created_by set to current user
- [ ] Tests for all filters and edge cases
BODY
)"

# Story 3.4
gh issue create --repo MiledC/nDrama \
  --title "Thumbnail upload to S3/MinIO" \
  --label "story,backend,priority:medium" \
  --body "$(cat <<'BODY'
## Story 3.4: File Storage Service

**Parent Epic:** #EPIC_NUM

### Description
Abstract file storage service with S3 implementation. Used for series thumbnails now, episode thumbnails and audio/subtitle files later.

### Files to Create
- `backend/app/services/file_storage.py` — FileStorage base + S3Storage implementation

### Endpoints
| Method | Path | Description |
|---|---|---|
| POST | /api/upload/thumbnail | Upload image, returns URL |

### Acceptance Criteria
- [ ] FileStorage abstract base class
- [ ] S3Storage implementation (works with MinIO locally)
- [ ] Upload endpoint accepts image files
- [ ] Returns public URL
- [ ] Validates file type (images only) and size limit
BODY
)"

# Story 3.5
gh issue create --repo MiledC/nDrama \
  --title "Tag management page" \
  --label "story,frontend,priority:medium" \
  --body "$(cat <<'BODY'
## Story 3.5: Tag Management UI

**Parent Epic:** #EPIC_NUM

### Page: `/tags`

### UI Components
- Tag list grouped by category
- Create tag modal (name + category dropdown)
- Edit tag inline
- Delete tag with confirmation
- Category filter tabs

### Acceptance Criteria
- [ ] List all tags grouped by category
- [ ] Create, edit, delete tags
- [ ] Cannot delete tags in use (show count)
- [ ] Responsive layout with dark theme
BODY
)"

# Story 3.6
gh issue create --repo MiledC/nDrama \
  --title "Series list page (filter by tag/status, search, paginate)" \
  --label "story,frontend,priority:high" \
  --body "$(cat <<'BODY'
## Story 3.6: Series List Page

**Parent Epic:** #EPIC_NUM

### Page: `/series`

### UI Components
- Series cards/table with thumbnail, title, status badge, tag chips, episode count
- Search bar
- Status filter dropdown (all, draft, published, archived)
- Tag filter multi-select
- Pagination controls
- "Create Series" button

### Acceptance Criteria
- [ ] Lists series with pagination
- [ ] Search filters by title
- [ ] Status and tag filters work
- [ ] Click navigates to series detail
- [ ] Empty state when no series
BODY
)"

# Story 3.7
gh issue create --repo MiledC/nDrama \
  --title "Series create/edit form (with tag picker, thumbnail upload)" \
  --label "story,frontend,priority:high" \
  --body "$(cat <<'BODY'
## Story 3.7: Series Form

**Parent Epic:** #EPIC_NUM

### Pages: `/series/create` and `/series/:id/edit`

### Form Fields
- Title (text input)
- Description (textarea)
- Thumbnail (image upload with preview)
- Status (dropdown: draft, published, archived)
- Tags (multi-select tag picker with category grouping)

### Acceptance Criteria
- [ ] Create and edit share the same form component
- [ ] Thumbnail upload with preview before save
- [ ] Tag picker shows tags grouped by category
- [ ] Validation (title required, etc.)
- [ ] Success/error toast notifications
BODY
)"
```

**Step 3: Link sub-issues to Epic 3**

---

### Task 5: Create Epic 4 — Episode Management + Video Upload

**Step 1: Create the Epic issue**

```bash
gh issue create --repo MiledC/nDrama \
  --title "Epic 4: Episode Management + Video Upload" \
  --label "epic,priority:high" \
  --body "$(cat <<'BODY'
## Epic 4: Episode Management + Video Upload

Manage episodes within series. Upload videos to Mux via a provider abstraction layer.

### Data Model: Episode
| Field | Type |
|---|---|
| id | UUID (PK) |
| series_id | UUID (FK → Series) |
| title | string |
| description | string |
| episode_number | int |
| thumbnail_url | string |
| status | enum: draft, published |
| video_provider | enum: mux |
| video_provider_asset_id | string |
| video_playback_id | string |
| duration_seconds | int (nullable) |
| created_by | UUID (FK → User) |

### Key Decision
VideoProvider abstraction allows swapping Mux for another provider later without changing the API layer.

### Acceptance Criteria
- [ ] Episode CRUD within a series
- [ ] Video upload to Mux with progress tracking
- [ ] VideoProvider abstraction with MuxProvider
- [ ] Video player preview in frontend
- [ ] Episode ordering (episode_number)
BODY
)"
```

**Step 2: Create Story sub-issues for Epic 4**

```bash
# Story 4.1
gh issue create --repo MiledC/nDrama \
  --title "Episode model + migration" \
  --label "story,backend,priority:high" \
  --body "$(cat <<'BODY'
## Story 4.1: Episode Model

**Parent Epic:** #EPIC_NUM

### Files to Create
- `backend/app/models/episode.py`
- Migration via alembic

### Acceptance Criteria
- [ ] Episode model with all fields from design doc
- [ ] Foreign key to Series (cascade delete)
- [ ] Unique constraint on (series_id, episode_number)
- [ ] Migration runs cleanly
BODY
)"

# Story 4.2
gh issue create --repo MiledC/nDrama \
  --title "VideoProvider abstraction + MuxProvider implementation" \
  --label "story,backend,priority:high" \
  --body "$(cat <<'BODY'
## Story 4.2: Video Provider Service

**Parent Epic:** #EPIC_NUM

### Files to Create
- `backend/app/services/video_provider.py`

### Interface: VideoProvider (ABC)
- `upload(file) → ProviderAsset(asset_id, playback_id)`
- `get_status(asset_id) → AssetStatus`
- `delete(asset_id) → None`
- `get_playback_url(playback_id) → str`

### Implementation: MuxProvider
- Uses Mux Python SDK
- Direct upload flow (backend sends to Mux)
- Webhook-ready for async status updates (future)

### Acceptance Criteria
- [ ] Abstract base class defined
- [ ] MuxProvider implements all methods
- [ ] Provider selected via config (VIDEO_PROVIDER env var)
- [ ] Tests with mocked Mux API
BODY
)"

# Story 4.3
gh issue create --repo MiledC/nDrama \
  --title "Episode CRUD endpoints (with video upload to Mux)" \
  --label "story,backend,priority:high" \
  --body "$(cat <<'BODY'
## Story 4.3: Episode API

**Parent Epic:** #EPIC_NUM

### Endpoints
| Method | Path | Description |
|---|---|---|
| GET | /api/series/:id/episodes | List episodes for a series |
| GET | /api/episodes/:id | Get episode detail |
| POST | /api/series/:id/episodes | Create episode (with video upload) |
| PATCH | /api/episodes/:id | Update episode metadata |
| DELETE | /api/episodes/:id | Delete episode (+ delete video from provider) |
| POST | /api/episodes/:id/video | Upload/replace video |

### Acceptance Criteria
- [ ] Episodes scoped to series
- [ ] Video upload triggers Mux upload
- [ ] Episode ordering maintained
- [ ] Deleting episode also deletes video from Mux
- [ ] Pagination on episode list
BODY
)"

# Story 4.4
gh issue create --repo MiledC/nDrama \
  --title "Episode list within series detail page" \
  --label "story,frontend,priority:high" \
  --body "$(cat <<'BODY'
## Story 4.4: Episode List UI

**Parent Epic:** #EPIC_NUM

### Page: `/series/:id` (series detail, episodes tab)

### UI Components
- Episode list/table (number, title, status, duration, thumbnail)
- Drag-to-reorder episodes
- "Add Episode" button
- Episode status badges

### Acceptance Criteria
- [ ] Lists episodes ordered by episode_number
- [ ] Click navigates to episode detail
- [ ] Reorder updates episode_number
- [ ] Empty state for new series
BODY
)"

# Story 4.5
gh issue create --repo MiledC/nDrama \
  --title "Episode create/edit form (video upload with progress)" \
  --label "story,frontend,priority:high" \
  --body "$(cat <<'BODY'
## Story 4.5: Episode Form + Video Upload

**Parent Epic:** #EPIC_NUM

### Pages: `/series/:id/episodes/create` and `/episodes/:id/edit`

### Form Fields
- Title, description, episode number
- Thumbnail upload
- Video file upload with progress bar
- Status dropdown

### Acceptance Criteria
- [ ] Video upload shows progress percentage
- [ ] Large file upload works (up to 2GB)
- [ ] Can replace video on existing episode
- [ ] Validation (title required, video required for publish)
BODY
)"

# Story 4.6
gh issue create --repo MiledC/nDrama \
  --title "Video player preview (Mux player embed)" \
  --label "story,frontend,priority:medium" \
  --body "$(cat <<'BODY'
## Story 4.6: Video Player Preview

**Parent Epic:** #EPIC_NUM

### Description
Embed Mux Player in the episode detail page for preview playback.

### Dependencies
- @mux/mux-player (web component)

### UI
- Player embedded in episode detail/edit page
- Shows "Processing..." state while Mux processes the video
- Playback controls

### Acceptance Criteria
- [ ] Mux Player renders with playback ID
- [ ] Shows processing state for new uploads
- [ ] Responsive player sizing
BODY
)"
```

**Step 3: Link sub-issues to Epic 4**

---

### Task 6: Create Epic 5 — Audio Tracks & Subtitles

**Step 1: Create the Epic issue**

```bash
gh issue create --repo MiledC/nDrama \
  --title "Epic 5: Audio Tracks & Subtitles" \
  --label "epic,priority:medium" \
  --body "$(cat <<'BODY'
## Epic 5: Audio Tracks & Subtitles

Multi-audio and subtitle file management per episode.

### Data Models

**AudioTrack:** id, episode_id, language_code, label, file_url, is_default

**Subtitle:** id, episode_id, language_code, label, file_url, is_default

### Acceptance Criteria
- [ ] Upload multiple audio tracks per episode
- [ ] Upload multiple subtitle files (SRT/VTT) per episode
- [ ] Set default audio/subtitle track
- [ ] Player integration for track switching
BODY
)"
```

**Step 2: Create Story sub-issues for Epic 5**

```bash
# Story 5.1
gh issue create --repo MiledC/nDrama \
  --title "AudioTrack + Subtitle models + migrations" \
  --label "story,backend,priority:medium" \
  --body "$(cat <<'BODY'
## Story 5.1: Audio & Subtitle Models

**Parent Epic:** #EPIC_NUM

### Files to Create
- `backend/app/models/audio_track.py`
- `backend/app/models/subtitle.py`
- Migration via alembic

### Acceptance Criteria
- [ ] AudioTrack model with all fields
- [ ] Subtitle model with all fields
- [ ] Foreign keys to Episode (cascade delete)
- [ ] Only one default per language per episode
BODY
)"

# Story 5.2
gh issue create --repo MiledC/nDrama \
  --title "Audio track upload/CRUD endpoints" \
  --label "story,backend,priority:medium" \
  --body "$(cat <<'BODY'
## Story 5.2: Audio Track API

**Parent Epic:** #EPIC_NUM

### Endpoints
| Method | Path | Description |
|---|---|---|
| GET | /api/episodes/:id/audio-tracks | List audio tracks |
| POST | /api/episodes/:id/audio-tracks | Upload audio track |
| PATCH | /api/audio-tracks/:id | Update metadata (label, default) |
| DELETE | /api/audio-tracks/:id | Delete audio track |

### Acceptance Criteria
- [ ] Upload audio file to S3/MinIO
- [ ] Set language_code and label
- [ ] Toggle is_default (only one default per episode)
- [ ] Delete removes file from storage
BODY
)"

# Story 5.3
gh issue create --repo MiledC/nDrama \
  --title "Subtitle upload/CRUD endpoints (SRT/VTT)" \
  --label "story,backend,priority:medium" \
  --body "$(cat <<'BODY'
## Story 5.3: Subtitle API

**Parent Epic:** #EPIC_NUM

### Endpoints
| Method | Path | Description |
|---|---|---|
| GET | /api/episodes/:id/subtitles | List subtitles |
| POST | /api/episodes/:id/subtitles | Upload subtitle file |
| PATCH | /api/subtitles/:id | Update metadata |
| DELETE | /api/subtitles/:id | Delete subtitle |

### Acceptance Criteria
- [ ] Upload SRT or VTT files to S3/MinIO
- [ ] Validate file format (SRT/VTT only)
- [ ] Toggle is_default
- [ ] Delete removes file from storage
BODY
)"

# Story 5.4
gh issue create --repo MiledC/nDrama \
  --title "Audio track management UI on episode detail" \
  --label "story,frontend,priority:medium" \
  --body "$(cat <<'BODY'
## Story 5.4: Audio Track UI

**Parent Epic:** #EPIC_NUM

### Location: Episode detail page, "Audio Tracks" section

### UI Components
- List of audio tracks (language, label, default badge)
- Upload audio file button
- Language code + label input fields
- Set as default toggle
- Delete with confirmation

### Acceptance Criteria
- [ ] Upload audio files with language metadata
- [ ] Display list of tracks
- [ ] Toggle default track
- [ ] Delete tracks
BODY
)"

# Story 5.5
gh issue create --repo MiledC/nDrama \
  --title "Subtitle management UI on episode detail" \
  --label "story,frontend,priority:medium" \
  --body "$(cat <<'BODY'
## Story 5.5: Subtitle UI

**Parent Epic:** #EPIC_NUM

### Location: Episode detail page, "Subtitles" section

### UI Components
- List of subtitles (language, label, format badge, default badge)
- Upload SRT/VTT button
- Language code + label input fields
- Set as default toggle
- Delete with confirmation

### Acceptance Criteria
- [ ] Upload SRT/VTT files with language metadata
- [ ] Display list of subtitles
- [ ] Toggle default subtitle
- [ ] Delete subtitles
BODY
)"

# Story 5.6
gh issue create --repo MiledC/nDrama \
  --title "Player integration (audio/subtitle track switching)" \
  --label "story,frontend,priority:low" \
  --body "$(cat <<'BODY'
## Story 5.6: Player Track Switching

**Parent Epic:** #EPIC_NUM

### Description
Integrate audio tracks and subtitles with the Mux video player for preview.

### UI
- Audio track selector in player controls
- Subtitle track selector in player controls
- Tracks load from episode API response

### Acceptance Criteria
- [ ] Player shows available audio tracks
- [ ] Player shows available subtitle tracks
- [ ] Switching tracks works during playback
- [ ] Default tracks auto-selected
BODY
)"
```

**Step 3: Link sub-issues to Epic 5**

---

### Task 7: Create Epic 6 — Monetization Configuration

**Step 1: Create the Epic issue**

```bash
gh issue create --repo MiledC/nDrama \
  --title "Epic 6: Monetization Configuration" \
  --label "epic,priority:medium" \
  --body "$(cat <<'BODY'
## Epic 6: Monetization Configuration

Configure free episode counts and coin costs per series. No consumer-facing purchase flow — management panel config only.

### Model
- `free_episode_count` on Series (default 3) — first N episodes are free
- `coin_cost_per_episode` on Series — cost in virtual coins to unlock paid episodes

### Note
These fields are part of the Series model (Epic 3). This Epic adds the dedicated configuration UI and visual indicators.

### Acceptance Criteria
- [ ] Configure pricing per series
- [ ] Visual indicator of free vs locked episodes
- [ ] Validation (cost >= 0, free count >= 0)
BODY
)"
```

**Step 2: Create Story sub-issues for Epic 6**

```bash
# Story 6.1
gh issue create --repo MiledC/nDrama \
  --title "Add free_episode_count and coin_cost_per_episode fields to Series" \
  --label "story,backend,priority:medium" \
  --body "$(cat <<'BODY'
## Story 6.1: Monetization Fields

**Parent Epic:** #EPIC_NUM

### Description
Ensure Series model includes monetization fields and they are exposed in the API.

### Note
These fields should already exist from Epic 3 (Story 3.1). This story ensures:
- Fields have proper defaults and validation
- Series API includes these fields in responses
- Dedicated update endpoint or included in PATCH /api/series/:id

### Acceptance Criteria
- [ ] free_episode_count defaults to 3, min 0
- [ ] coin_cost_per_episode defaults to 0, min 0
- [ ] Fields included in series list and detail responses
- [ ] Can update via PATCH /api/series/:id
BODY
)"

# Story 6.2
gh issue create --repo MiledC/nDrama \
  --title "Series pricing configuration endpoints" \
  --label "story,backend,priority:medium" \
  --body "$(cat <<'BODY'
## Story 6.2: Pricing API

**Parent Epic:** #EPIC_NUM

### Endpoints
| Method | Path | Description |
|---|---|---|
| GET | /api/series/:id/pricing | Get pricing config |
| PATCH | /api/series/:id/pricing | Update pricing config |

### Request Body (PATCH)
```json
{
  "free_episode_count": 3,
  "coin_cost_per_episode": 10
}
```

### Acceptance Criteria
- [ ] Get and update pricing separately from main series CRUD
- [ ] Validation: non-negative integers
- [ ] Returns updated series with pricing info
BODY
)"

# Story 6.3
gh issue create --repo MiledC/nDrama \
  --title "Pricing configuration UI in series edit form" \
  --label "story,frontend,priority:medium" \
  --body "$(cat <<'BODY'
## Story 6.3: Pricing Configuration UI

**Parent Epic:** #EPIC_NUM

### Location: Series edit form, "Monetization" section

### UI Components
- "Free Episodes" number input (min 0)
- "Coin Cost per Episode" number input (min 0)
- Preview: "First {N} episodes free, then {cost} coins each"

### Acceptance Criteria
- [ ] Pricing fields in series create/edit form
- [ ] Input validation (non-negative integers)
- [ ] Preview text updates as values change
BODY
)"

# Story 6.4
gh issue create --repo MiledC/nDrama \
  --title "Episode list visual indicator (free vs locked)" \
  --label "story,frontend,priority:low" \
  --body "$(cat <<'BODY'
## Story 6.4: Free vs Locked Indicators

**Parent Epic:** #EPIC_NUM

### Description
Show visual indicators on episode lists to distinguish free vs locked episodes.

### UI
- Free episodes: green "FREE" badge or unlock icon
- Locked episodes: coin icon + cost display
- Based on episode_number vs series.free_episode_count

### Acceptance Criteria
- [ ] Episodes with number <= free_episode_count show "FREE"
- [ ] Episodes with number > free_episode_count show coin cost
- [ ] Indicators visible in episode list on series detail page
BODY
)"
```

**Step 3: Link sub-issues to Epic 6**

---

### Task 8: Create Epic 7 — Dashboard & Polish

**Step 1: Create the Epic issue**

```bash
gh issue create --repo MiledC/nDrama \
  --title "Epic 7: Dashboard & Polish" \
  --label "epic,priority:low" \
  --body "$(cat <<'BODY'
## Epic 7: Dashboard & Polish

Overview dashboard, search, and UX polish to complete the management panel.

### Acceptance Criteria
- [ ] Dashboard with key metrics
- [ ] Global search across series and episodes
- [ ] Loading states, error handling, empty states throughout
BODY
)"
```

**Step 2: Create Story sub-issues for Epic 7**

```bash
# Story 7.1
gh issue create --repo MiledC/nDrama \
  --title "Dashboard API (series count, episode count, recent activity)" \
  --label "story,backend,priority:low" \
  --body "$(cat <<'BODY'
## Story 7.1: Dashboard API

**Parent Epic:** #EPIC_NUM

### Endpoints
| Method | Path | Description |
|---|---|---|
| GET | /api/dashboard/stats | Aggregate stats |
| GET | /api/dashboard/recent | Recent activity |

### Stats Response
```json
{
  "total_series": 42,
  "published_series": 30,
  "total_episodes": 156,
  "draft_episodes": 12
}
```

### Acceptance Criteria
- [ ] Returns aggregate counts
- [ ] Returns recent series/episodes (last 10)
- [ ] Performant queries (single query, not N+1)
BODY
)"

# Story 7.2
gh issue create --repo MiledC/nDrama \
  --title "Dashboard page (stats cards, recent series, quick actions)" \
  --label "story,frontend,priority:low" \
  --body "$(cat <<'BODY'
## Story 7.2: Dashboard Page

**Parent Epic:** #EPIC_NUM

### Page: `/` (dashboard, default after login)

### UI Components
- Stats cards (total series, published, total episodes, drafts)
- Recent series list (last 5-10)
- Quick action buttons (Create Series, Manage Tags)

### Acceptance Criteria
- [ ] Stats cards with counts
- [ ] Recent series with links
- [ ] Quick action buttons navigate correctly
- [ ] Loading skeleton while data fetches
BODY
)"

# Story 7.3
gh issue create --repo MiledC/nDrama \
  --title "Global search across series and episodes" \
  --label "story,backend,frontend,priority:low" \
  --body "$(cat <<'BODY'
## Story 7.3: Global Search

**Parent Epic:** #EPIC_NUM

### Backend Endpoint
| Method | Path | Description |
|---|---|---|
| GET | /api/search?q=term | Search series and episodes |

### Response
```json
{
  "series": [...],
  "episodes": [...]
}
```

### Frontend
- Search input in top navigation bar
- Dropdown results grouped by type (series, episodes)
- Click navigates to detail page

### Acceptance Criteria
- [ ] Searches title and description
- [ ] Results grouped by type
- [ ] Debounced input (300ms)
- [ ] Keyboard navigation in results
BODY
)"

# Story 7.4
gh issue create --repo MiledC/nDrama \
  --title "UI polish pass (loading states, error handling, empty states)" \
  --label "story,frontend,priority:low" \
  --body "$(cat <<'BODY'
## Story 7.4: UI Polish

**Parent Epic:** #EPIC_NUM

### Description
Final polish pass across all pages.

### Checklist
- [ ] Loading skeletons on all data-fetching pages
- [ ] Error boundaries with retry buttons
- [ ] Empty states with illustrations/text and CTAs
- [ ] Toast notifications for success/error on all mutations
- [ ] Confirm dialogs before destructive actions (delete)
- [ ] Responsive layout for tablet and desktop
- [ ] Keyboard shortcuts (Ctrl+K for search)
BODY
)"
```

**Step 3: Link sub-issues to Epic 7**

---

### Task 9: Helper Script for Sub-Issue Linking

Since linking sub-issues requires GraphQL API calls with node IDs, create a helper script to automate this.

**Step 1: Create the linking script**

**File to create:** `scripts/link-subissues.sh`

```bash
#!/usr/bin/env bash
# Usage: ./scripts/link-subissues.sh EPIC_NUMBER STORY_NUMBER [STORY_NUMBER...]
# Example: ./scripts/link-subissues.sh 1 2 3 4 5 6

set -euo pipefail

REPO="MiledC/nDrama"
EPIC_NUM=$1
shift
STORY_NUMS=("$@")

# Get Epic node ID
EPIC_ID=$(gh issue view "$EPIC_NUM" --repo "$REPO" --json id -q '.id')
echo "Epic #$EPIC_NUM node ID: $EPIC_ID"

for STORY_NUM in "${STORY_NUMS[@]}"; do
  STORY_ID=$(gh issue view "$STORY_NUM" --repo "$REPO" --json id -q '.id')
  echo "Linking Story #$STORY_NUM ($STORY_ID) to Epic #$EPIC_NUM..."

  gh api graphql -f query="
    mutation {
      addSubIssue(input: {issueId: \"$EPIC_ID\", subIssueId: \"$STORY_ID\"}) {
        issue { id title }
        subIssue { id title }
      }
    }
  "
  echo "  ✓ Linked #$STORY_NUM"
done

echo "Done! All stories linked to Epic #$EPIC_NUM"
```

**Step 2: Make executable**

```bash
chmod +x scripts/link-subissues.sh
```

**Step 3: Commit**

```bash
git add scripts/link-subissues.sh
git commit -m "feat: add helper script for linking GitHub sub-issues"
```

---

### Task 10: Execute — Create All Issues and Link Them

This is the execution task. Run Tasks 1-8 sequentially, capturing issue numbers, then use the helper script from Task 9 to link sub-issues.

**Step 1:** Run Task 1 (create labels)
**Step 2:** Run Task 2 (Epic 1 + stories), note issue numbers
**Step 3:** Link Epic 1 stories: `./scripts/link-subissues.sh 1 2 3 4 5 6`
**Step 4:** Run Task 3 (Epic 2 + stories), note issue numbers
**Step 5:** Link Epic 2 stories: `./scripts/link-subissues.sh 7 8 9 10 11 12 13 14`
**Step 6:** Repeat for Epics 3-7
**Step 7:** Verify with `gh issue list --repo MiledC/nDrama --label epic`

**Expected final state:** 7 Epic issues + ~30 Story issues, all labeled and linked as sub-issues.

**Step 8: Commit plan doc**

```bash
git add docs/plans/2026-02-27-ndrama-github-roadmap.md
git commit -m "docs: add GitHub roadmap implementation plan"
```
