# Epic 4: Episode Management + Video Upload — Implementation Plan

## Overview

Implement episode CRUD within series, VideoProvider abstraction with MuxProvider, video upload with progress tracking, and frontend episode management UI.

## Sub-Issues (Execution Order)

### Batch 1: Backend Foundation (#28, #29)

#### Task 1: Episode Model + Migration (#28)

**Files to create/modify:**
- `backend/app/models/episode.py` — New Episode model
- `backend/app/models/__init__.py` — Export Episode
- `backend/app/schemas/episode.py` — Pydantic request/response schemas
- `backend/alembic/versions/xxx_create_episodes_table.py` — Migration

**Steps:**
1. Create `EpisodeStatus` enum (draft, processing, ready, published)
2. Create `VideoProvider` enum (mux)
3. Create Episode model inheriting Base, UUIDMixin, TimestampMixin
4. Fields: series_id (FK→Series, cascade delete), title, description, episode_number, thumbnail_url, status, video_provider, video_provider_asset_id, video_playback_id, duration_seconds (nullable), created_by (FK→User)
5. UniqueConstraint on (series_id, episode_number)
6. Relationship to Series (back_populates)
7. Create Pydantic schemas: EpisodeCreate, EpisodeUpdate, EpisodeResponse, EpisodeListResponse
8. Generate and run Alembic migration
9. Add Episode to models/__init__.py
10. Add factory function `make_episode()` to tests/factories.py

**Verification:** `alembic upgrade head` succeeds, model imports cleanly

#### Task 2: VideoProvider Abstraction + MuxProvider (#29)

**Files to create/modify:**
- `backend/app/services/video_provider.py` — ABC + MuxProvider + factory
- `backend/app/config.py` — Add Mux config vars

**Steps:**
1. Define `ProviderAsset` dataclass (asset_id, playback_id, upload_url)
2. Define `AssetStatus` enum (waiting, processing, ready, errored)
3. Define `VideoProvider` ABC with methods: create_upload(filename) → ProviderAsset, get_status(asset_id) → AssetStatus, delete(asset_id) → None, get_playback_url(playback_id) → str
4. Implement `MuxProvider` using mux_python SDK (or HTTP API via httpx)
5. Create provider factory: `get_video_provider(provider_name) → VideoProvider`
6. Add config: MUX_TOKEN_ID, MUX_TOKEN_SECRET, VIDEO_PROVIDER to Settings

**Verification:** Import works, ABC contract enforced

### Batch 2: Backend API + Tests (#30, #55)

#### Task 3: Episode CRUD Endpoints (#30)

**Files to create/modify:**
- `backend/app/routers/episodes.py` — Episode router
- `backend/app/main.py` — Register episode router

**Endpoints:**
- GET `/api/series/{series_id}/episodes` — List episodes (paginated, ordered by episode_number)
- GET `/api/episodes/{id}` — Episode detail
- POST `/api/series/{series_id}/episodes` — Create episode (with optional video upload)
- PATCH `/api/episodes/{id}` — Update metadata
- DELETE `/api/episodes/{id}` — Delete episode (+ cleanup Mux asset)
- POST `/api/episodes/{id}/video` — Upload/replace video

**Steps:**
1. Create episodes router with proper prefix/tags
2. Implement list endpoint with pagination + ordering
3. Implement detail endpoint
4. Implement create endpoint — validates series exists, auto-assigns episode_number if not provided, optionally triggers video upload via VideoProvider
5. Implement update endpoint — partial update with exclude_unset
6. Implement delete endpoint — deletes from DB + calls VideoProvider.delete()
7. Implement video upload endpoint — creates Mux direct upload URL, returns URL to client
8. Register router in main.py

**Verification:** `ruff check .` passes

#### Task 4: Backend Tests (#55)

**Files to create/modify:**
- `backend/tests/test_episodes.py`
- `backend/tests/test_video_provider.py`

**Steps:**
1. Write episode CRUD tests (create, list, get, update, delete, reorder, duplicate number conflict, nonexistent series)
2. Write video provider tests (ABC contract, MuxProvider mock, factory)
3. All tests use existing fixture patterns (admin_client, db_session, etc.)

**Verification:** `pytest -v` — all tests pass

### Batch 3: Frontend Views (#31, #32)

#### Task 5: Episode List within Series Detail (#31)

**Files to create/modify:**
- `frontend/src/views/SeriesDetailView.vue` — New series detail page with episodes tab
- `frontend/src/router/index.ts` — Add route for /series/:id
- `frontend/src/components/layout/Sidebar.vue` — Update if needed

**Steps:**
1. Create SeriesDetailView showing series info + episode list
2. Episode list table ordered by episode_number
3. Status badges (draft, processing, ready, published)
4. Create/Edit/Delete actions
5. Empty state for new series
6. Add route `/series/:id` to router

**Verification:** `npm run type-check && npm run lint` pass

#### Task 6: Episode Create/Edit Form (#32)

**Files to create/modify:**
- `frontend/src/components/episodes/EpisodeForm.vue` — Reusable form
- `frontend/src/views/EpisodeCreateView.vue` — Create wrapper
- `frontend/src/views/EpisodeEditView.vue` — Edit wrapper
- `frontend/src/router/index.ts` — Add routes

**Steps:**
1. Create EpisodeForm component (title, description, episode_number, thumbnail, video upload, status)
2. Video upload with progress bar (direct upload to Mux URL)
3. Form validation (title required, video required for publish)
4. Create/Edit wrapper views
5. Add routes: `/series/:seriesId/episodes/create`, `/series/:seriesId/episodes/:id/edit`

**Verification:** `npm run type-check && npm run lint` pass

### Batch 4: Frontend Polish + Tests (#33, #56)

#### Task 7: Video Player Preview (#33)

**Files to create/modify:**
- `frontend/src/components/episodes/VideoPlayer.vue`
- `frontend/package.json` — Add @mux/mux-player dependency

**Steps:**
1. Install @mux/mux-player
2. Create VideoPlayer component wrapping Mux player
3. Accept playback-id prop, show processing state, responsive sizing
4. Integrate into EpisodeForm and SeriesDetailView

**Verification:** `npm run type-check && npm run lint` pass

#### Task 8: Frontend Tests (#56)

**Files to create/modify:**
- `frontend/src/__tests__/views/EpisodeList.spec.ts`
- `frontend/src/__tests__/views/EpisodeForm.spec.ts`
- `frontend/src/__tests__/components/VideoPlayer.spec.ts`

**Steps:**
1. EpisodeList tests: renders list, correct order, status badges, create/edit/delete actions, empty state
2. EpisodeForm tests: create mode, edit mode, video upload, progress, validation
3. VideoPlayer tests: renders with playback ID, placeholder, controls

**Verification:** `npm run test:ci` — all tests pass
