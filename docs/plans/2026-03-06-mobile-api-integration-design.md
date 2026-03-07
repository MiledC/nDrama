# Mobile App → Subscriber API Integration Design

## Overview

Connect the Draama mobile app (React Native) to the subscriber-api. The app is currently a high-fidelity UI prototype with 100% hardcoded data. The subscriber-api is fully built with auth, content, coins, favorites, and history endpoints. This design covers rewriting the mobile data layer, adding missing backend endpoints, and wiring every screen to real data.

## Architecture Decisions

- **Auth model**: Session tokens (`X-Session-Token` header, Redis-backed, 90-day sliding TTL). Replaces the JWT Bearer token setup currently scaffolded in `api/client.ts`.
- **Login method**: Phone number + OTP (Saudi +966). Stubbed with hardcoded code `1234` until a real SMS provider is integrated.
- **Server state**: React Query (TanStack Query) for all API data — caching, loading states, background refetch, deduplication.
- **Client state**: Zustand for auth/session only (not API data).
- **Home screen**: Dynamic sections driven by a `home_sections` admin-configurable table, not hardcoded logic.

## Mobile Data Layer

```
mobile/src/
├── api/
│   ├── client.ts          # Session token (X-Session-Token), no JWT
│   ├── auth.ts            # device, otp/request, otp/verify, logout
│   ├── series.ts          # series list, detail, episodes
│   ├── episodes.ts        # episode detail
│   ├── categories.ts      # category tree, category series
│   ├── coins.ts           # balance, packages, purchase, spend, transactions
│   ├── favorites.ts       # list, add, remove
│   ├── history.ts         # continue watching, report progress
│   ├── home.ts            # home sections
│   ├── profile.ts         # get, update, delete
│   └── index.ts
├── hooks/
│   ├── useSeries.ts       # useSeriesList, useSeriesDetail, useSeriesEpisodes
│   ├── useEpisodes.ts     # useEpisodeDetail
│   ├── useCategories.ts   # useCategoryTree, useCategorySeries
│   ├── useCoins.ts        # useBalance, usePackages, useSpendMutation, etc.
│   ├── useFavorites.ts    # useFavorites, useToggleFavorite
│   ├── useHistory.ts      # useContinueWatching, useReportProgress
│   ├── useHome.ts         # useHomeSections
│   └── useProfile.ts      # useProfile, useUpdateProfile
├── stores/
│   └── authStore.ts       # Zustand: session token, device ID, login state
├── types/
│   └── api.ts             # TypeScript interfaces matching subscriber-api schemas
```

**Pattern**: API modules (raw axios calls) → React Query hooks (caching, mutations) → Screens consume hooks.

## Epic 1: Auth & Session Foundation

### Backend changes (subscriber-api)

New OTP endpoints:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/otp/request` | none | Send OTP to phone number |
| POST | `/auth/otp/verify` | none | Verify OTP, create/find subscriber, return session |

New fields on `subscribers` table:
- `phone` — VARCHAR(20), nullable, unique

OTP behavior (stubbed):
- `POST /auth/otp/request` with `{ phone }` — stores OTP in Redis (`otp:{phone}` → code, TTL: 5 min), logs to console
- `POST /auth/otp/verify` with `{ phone, code }` — accepts hardcoded `1234` OR Redis-stored code
- If phone exists → login (return existing subscriber + new session)
- If phone is new → create subscriber (status: `active`) + new session
- Future: integrate real SMS provider (Twilio, Unifonic)

### Mobile changes

**`api/client.ts`** — rewrite:
- Remove JWT Bearer token + refresh token logic
- Attach `X-Session-Token` from AsyncStorage on every request
- On 401 → clear token → re-register device (fall back to anonymous)

**`stores/authStore.ts`** — rewrite for session model:
- `init()`: Check for stored session token → `GET /me` → if valid, set user. If no token, call `registerDevice()`
- `registerDevice()`: Generate UUID device_id, call `POST /auth/device`, store session token
- `requestOtp(phone)`: Call `POST /auth/otp/request`
- `verifyOtp(phone, code)`: Call `POST /auth/otp/verify`, store new session token
- `logout()`: Call `POST /auth/logout`, clear token, re-register device (back to anonymous)

**Screen changes:**
- **SplashScreen**: Call `authStore.init()` → navigate to MainTabs (always, even anonymous)
- **LoginScreen**: Phone number input (+966) → `requestOtp()` → navigate to OTP screen
- **OtpScreen**: 4-digit input → `verifyOtp()` → navigate to MainTabs

**Navigation guards:**
- Anonymous can access: Home, Discover, Search, SeriesDetail, VideoPlayer (free episodes)
- Active required for: MyList, CoinStore (purchase), Profile edit, Favorites, unlocking episodes

## Epic 2: Content Browsing

### Backend changes

#### New: `home_sections` table

| Field | Type | Notes |
|-------|------|-------|
| id | UUID (PK) | |
| type | ENUM | `featured`, `trending`, `new_releases`, `category` |
| title | VARCHAR(255) | Display title, e.g. "Featured" / "جديد" |
| config | JSON | Type-specific params (see below) |
| sort_order | INTEGER | Display order on home screen |
| is_active | BOOLEAN | Toggle visibility |
| created_at | DATETIME(tz) | |
| updated_at | DATETIME(tz) | |

Config by type:
- `featured`: `{ series_ids: [uuid, uuid, ...] }`
- `new_releases`: `{ days: 14, limit: 10 }`
- `trending`: `{ days: 7, limit: 10 }`
- `category`: `{ category_id: uuid, limit: 10 }`

#### Admin backend — new endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/home-sections` | List all sections (admin) |
| POST | `/home-sections` | Create section |
| PATCH | `/home-sections/{id}` | Update section config/order/active |
| DELETE | `/home-sections/{id}` | Delete section |

Admin panel: "Home Layout" page — manage sections, reorder, configure each type.

#### Subscriber-api — new endpoint

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/home/sections` | session | Returns all active sections with resolved series data |

Server reads `home_sections`, executes each config:
- `featured` → fetch series by IDs
- `new_releases` → query series published within `days`, limit by `limit`
- `trending` → query series by watch count in last `days`, limit by `limit`
- `category` → query published series in category, limit by `limit`

Returns ordered array of sections, each with type, title, and items.

### Mobile changes

| Screen | Before | After |
|--------|--------|-------|
| HomeScreen | 5 hardcoded arrays | `GET /home/sections` → render dynamic sections + `GET /history` for continue watching |
| SearchScreen | Local filter on mock array | `GET /series?search=query` with 300ms debounce |
| DiscoverScreen | Hardcoded feed array | `GET /series` (paginated) |
| SeriesDetailScreen | MOCK_SERIES object | `GET /series/{id}` with episodes + unlock status |
| Categories | Hardcoded 8 categories | `GET /categories/tree` |

## Epic 3: Video Playback

### Mobile changes

- **VideoPlayerScreen**: Call `GET /episodes/{id}` → get `playback_url` (Mux HLS), `audio_tracks`, `subtitles`
- If episode is locked: show unlock prompt with `coin_cost`
- If unlocked/free: load HLS stream in react-native-video player
- **Progress reporting**: `POST /history/{episode_id}` with `{ progress_seconds }` every 10-15 seconds during playback
- Auto-completion: backend marks completed at 90% progress
- **Episode navigation**: next/prev calls `GET /episodes/{id}` for adjacent episode

No backend changes needed — all endpoints exist.

## Epic 4: Coins & Unlocks

### Mobile changes

| Screen | API |
|--------|-----|
| CoinStoreScreen header | `GET /coins/balance` |
| CoinStoreScreen packages | `GET /coins/packages` |
| CoinStoreScreen purchase | `POST /coins/purchase` (stubbed, no real IAP) |
| LockedEpisodeScreen unlock | `POST /coins/spend` with episode_id |
| Transaction history | `GET /coins/transactions` |

Error handling:
- Insufficient balance (402) → show "Not enough coins" → navigate to CoinStore
- Already unlocked → show "Already unlocked" → navigate to player
- Episode is free → show error (shouldn't happen in UI)

No backend changes needed — all endpoints exist.

### Future: Real IAP

Not in scope. `POST /coins/purchase` is stubbed (credits coins without payment). Real Apple Pay / Google Pay integration is a future epic requiring:
- Apple StoreKit 2 / Google Billing Library integration
- Server-side receipt validation
- Webhook handlers for subscription events

## Epic 5: User Library

### Mobile changes

| Screen | API |
|--------|-----|
| MyListScreen | `GET /favorites` for list, `POST /favorites/{series_id}` to add, `DELETE /favorites/{series_id}` to remove |
| WatchHistoryScreen | `GET /history` |
| ContinueWatchingRow (HomeScreen) | `GET /history` (incomplete episodes only) |
| SeriesDetailScreen "My List" toggle | `POST/DELETE /favorites/{series_id}` |

React Query mutations for favorites with optimistic updates (toggle immediately, rollback on error).

No backend changes needed — all endpoints exist.

## Epic 6: Profile & Settings

### Mobile changes

| Screen | API |
|--------|-----|
| ProfileScreen display | `GET /me` (already partially wired) |
| ProfileScreen edit | `PATCH /me` (name, avatar_url, language) |
| ProfileScreen delete account | `DELETE /me` with confirmation dialog |
| SettingsScreen language | `PATCH /me` with language field |
| ProfileScreen coin balance | `GET /coins/balance` |
| ProfileScreen watch stats | `GET /history` (derive counts client-side) |

No backend changes needed — all endpoints exist.

## New Backend Work Summary

| What | Where | Epic |
|------|-------|------|
| `POST /auth/otp/request` | subscriber-api | 1 |
| `POST /auth/otp/verify` | subscriber-api | 1 |
| `phone` field on subscribers | Alembic migration (admin backend) | 1 |
| `home_sections` table | Alembic migration (admin backend) | 2 |
| Home sections CRUD | admin backend routers | 2 |
| `GET /home/sections` | subscriber-api | 2 |
| Home Layout admin page | frontend (Vue) | 2 |

## Future Epics (No Backend Yet)

| Feature | What's Needed |
|---------|--------------|
| Real IAP (Apple Pay, Google Pay) | StoreKit 2 / Google Billing, server receipt validation |
| Push notifications | FCM/APNs integration, notification preferences, backend service |
| Social auth (Apple Sign-In, Google) | OAuth flows in subscriber-api, mobile SDK integration |
| Comments | New table + CRUD in subscriber-api, moderation in admin |
| Referrals | Referral codes, reward logic, tracking |
| Daily Rewards | Streak tracking, reward distribution |
| Achievements | Achievement definitions, progress tracking, badges |
| Subscriptions (monthly/annual) | Subscription tiers, entitlements, payment integration |
| Real video streaming | Mux player SDK integration, adaptive bitrate |
| CDN / streaming optimization | CloudFront or similar, geo-distributed delivery |

## Epic Dependency Order

```
Epic 1 (Auth) ← foundation, must be first
  ↓
Epic 2 (Content Browsing) ← needs auth for API calls
  ↓
Epic 3 (Video Playback) ← needs content to know what to play
  ↓
Epic 4 (Coins & Unlocks) ← needs playback to unlock episodes
  ↓
Epic 5 (User Library) ← needs content + auth for favorites/history
  ↓
Epic 6 (Profile & Settings) ← lowest priority, mostly wiring
```

Epics 4, 5, 6 can run in parallel after Epic 2 is done.
