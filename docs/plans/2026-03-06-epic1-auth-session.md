# Epic 1: Auth & Session Foundation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace JWT auth with session tokens, add phone+OTP login (stubbed), and wire SplashScreen → device registration → anonymous browsing → OTP login flow.

**Architecture:** Backend adds two OTP endpoints + phone field. Mobile rewrites api/client.ts for session tokens, authStore for device registration, and LoginScreen/OtpScreen for phone+OTP. React Query added as dependency for future epics but auth stays in Zustand.

**Tech Stack:** FastAPI, Redis, Alembic (backend). React Native, Zustand, AsyncStorage, axios, @tanstack/react-query (mobile).

---

## Part A: Backend — OTP Endpoints (subscriber-api)

### Task 1: Add `phone` column to Subscriber model

**Files:**
- Modify: `subscriber-api/app/models/subscriber.py:20-38`
- Modify: `backend/app/models/subscriber.py:17-39`

**Step 1: Add phone field to subscriber-api model**

In `subscriber-api/app/models/subscriber.py`, add after the `email` field (line 22):

```python
    phone: Mapped[str | None] = mapped_column(
        String(20), unique=True, index=True, nullable=True
    )
```

**Step 2: Add phone field to admin backend model**

In `backend/app/models/subscriber.py`, add the same field after `email`:

```python
    phone: Mapped[str | None] = mapped_column(
        String(20), unique=True, index=True, nullable=True
    )
```

**Step 3: Create Alembic migration**

Run from `backend/`:

```bash
cd backend && source .venv/bin/activate
alembic revision --autogenerate -m "add phone column to subscribers"
```

Expected: New migration file created in `backend/alembic/versions/`.

**Step 4: Run migration**

```bash
alembic upgrade head
```

Expected: Column `phone` added to `subscribers` table.

**Step 5: Commit**

```bash
git add subscriber-api/app/models/subscriber.py backend/app/models/subscriber.py backend/alembic/versions/
git commit -m "feat: add phone column to subscribers table"
```

---

### Task 2: Add OTP Redis helpers

**Files:**
- Modify: `subscriber-api/app/redis.py`

**Step 1: Add OTP constants and functions to redis.py**

Add after the existing `delete_all_sessions` function at the end of `subscriber-api/app/redis.py`:

```python
OTP_PREFIX = "otp:"
OTP_TTL = 300  # 5 minutes

# Stubbed OTP code — accepts this code for any phone number
STUB_OTP_CODE = "1234"


async def store_otp(phone: str, code: str) -> None:
    """Store OTP code in Redis with 5-minute TTL."""
    r = await get_redis()
    await r.setex(f"{OTP_PREFIX}{phone}", OTP_TTL, code)


async def verify_otp(phone: str, code: str) -> bool:
    """Verify OTP code. Accepts stub code or Redis-stored code."""
    if code == STUB_OTP_CODE:
        return True
    r = await get_redis()
    stored = await r.get(f"{OTP_PREFIX}{phone}")
    if stored and stored == code:
        await r.delete(f"{OTP_PREFIX}{phone}")
        return True
    return False
```

**Step 2: Commit**

```bash
git add subscriber-api/app/redis.py
git commit -m "feat: add OTP Redis helpers with stubbed code"
```

---

### Task 3: Add OTP schemas

**Files:**
- Modify: `subscriber-api/app/schemas/auth.py`

**Step 1: Add OTP request/response schemas**

Add to the end of `subscriber-api/app/schemas/auth.py`:

```python
class OtpRequestRequest(BaseModel):
    phone: str = Field(..., pattern=r"^\+9665\d{8}$")


class OtpRequestResponse(BaseModel):
    message: str = "OTP sent"


class OtpVerifyRequest(BaseModel):
    phone: str = Field(..., pattern=r"^\+9665\d{8}$")
    code: str = Field(..., min_length=4, max_length=4)


class OtpVerifyResponse(BaseModel):
    session_token: str
    subscriber: SubscriberProfile
    is_new_account: bool
```

**Step 2: Commit**

```bash
git add subscriber-api/app/schemas/auth.py
git commit -m "feat: add OTP request/verify schemas"
```

---

### Task 4: Write failing OTP service tests

**Files:**
- Modify: `subscriber-api/tests/test_auth.py`

**Step 1: Add OTP endpoint tests**

Append to `subscriber-api/tests/test_auth.py`:

```python
@pytest.mark.asyncio
async def test_otp_request(client):
    """OTP request returns success message."""
    response = await client.post(
        "/api/auth/otp/request", json={"phone": "+966512345678"}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "OTP sent"


@pytest.mark.asyncio
async def test_otp_verify_stub_code(client):
    """Stub OTP code 1234 creates new subscriber and returns session."""
    response = await client.post(
        "/api/auth/otp/verify",
        json={"phone": "+966512345678", "code": "1234"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "session_token" in data
    assert data["subscriber"]["status"] == "active"
    assert data["is_new_account"] is True


@pytest.mark.asyncio
async def test_otp_verify_returning_user(client):
    """Existing phone returns same subscriber, is_new_account=False."""
    # First verify creates account
    await client.post(
        "/api/auth/otp/verify",
        json={"phone": "+966598765432", "code": "1234"},
    )
    # Second verify returns existing
    r2 = await client.post(
        "/api/auth/otp/verify",
        json={"phone": "+966598765432", "code": "1234"},
    )
    assert r2.status_code == 200
    assert r2.json()["is_new_account"] is False


@pytest.mark.asyncio
async def test_otp_verify_wrong_code(client):
    """Wrong OTP code returns 401."""
    response = await client.post(
        "/api/auth/otp/verify",
        json={"phone": "+966512345678", "code": "9999"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_otp_verify_invalid_phone(client):
    """Invalid phone format returns 422."""
    response = await client.post(
        "/api/auth/otp/verify",
        json={"phone": "12345", "code": "1234"},
    )
    assert response.status_code == 422
```

**Step 2: Run tests to verify they fail**

```bash
cd subscriber-api && source .venv/bin/activate
pytest tests/test_auth.py::test_otp_request -v
```

Expected: FAIL — 404 (endpoint doesn't exist yet).

**Step 3: Commit**

```bash
git add subscriber-api/tests/test_auth.py
git commit -m "test: add failing OTP endpoint tests"
```

---

### Task 5: Implement OTP service functions

**Files:**
- Modify: `subscriber-api/app/services/auth_service.py`

**Step 1: Add OTP service functions**

Add to the end of `subscriber-api/app/services/auth_service.py`:

```python
from app.redis import store_otp, verify_otp, STUB_OTP_CODE  # add to existing imports


async def request_otp(phone: str) -> None:
    """Generate and store OTP for phone number. Currently stubbed — logs to console."""
    import secrets

    code = f"{secrets.randbelow(10000):04d}"
    await store_otp(phone, code)
    # TODO: Send via SMS provider (Twilio/Unifonic)
    print(f"[OTP STUB] Phone: {phone}, Code: {code} (use 1234 to bypass)")


async def verify_otp_and_login(
    db: AsyncSession, *, phone: str, code: str
) -> tuple[Subscriber, str, bool]:
    """Verify OTP and create/find subscriber by phone. Returns (subscriber, token, is_new)."""
    if not await verify_otp(phone, code):
        raise ValueError("Invalid OTP code")

    result = await db.execute(
        select(Subscriber).where(Subscriber.phone == phone)
    )
    subscriber = result.scalar_one_or_none()
    is_new = subscriber is None

    if is_new:
        subscriber = Subscriber(
            device_id=f"phone-{phone}",
            phone=phone,
            status=SubscriberStatus.active,
            coin_balance=0,
            registered_at=datetime.now(UTC),
        )
        db.add(subscriber)
        await db.commit()
        await db.refresh(subscriber)
    else:
        if subscriber.status in (SubscriberStatus.suspended, SubscriberStatus.banned):
            raise PermissionError(f"Account is {subscriber.status.value}")

    token = await create_session(str(subscriber.id))
    return subscriber, token, is_new
```

**Step 2: Commit**

```bash
git add subscriber-api/app/services/auth_service.py
git commit -m "feat: implement OTP request and verify service functions"
```

---

### Task 6: Add OTP router endpoints

**Files:**
- Modify: `subscriber-api/app/routers/auth.py`

**Step 1: Add OTP endpoints to auth router**

Add the new schema imports to the existing import block at top of `subscriber-api/app/routers/auth.py`:

```python
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
```

Add these endpoints after the existing `/logout` endpoint:

```python
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
```

**Step 2: Run OTP tests to verify they pass**

```bash
cd subscriber-api && pytest tests/test_auth.py -k otp -v
```

Expected: All 5 OTP tests pass.

**Step 3: Run full auth test suite**

```bash
pytest tests/test_auth.py -v
```

Expected: All tests pass (existing + new).

**Step 4: Commit**

```bash
git add subscriber-api/app/routers/auth.py
git commit -m "feat: add OTP request/verify endpoints"
```

---

### Task 7: Update subscriber-api factory for phone field

**Files:**
- Modify: `subscriber-api/tests/factories.py:41-49`

**Step 1: Add phone to make_subscriber factory**

Update the `make_subscriber` function to support phone:

```python
def make_subscriber(**overrides: Any) -> Subscriber:
    defaults: dict[str, Any] = {
        "id": uuid.uuid4(),
        "device_id": f"device-{uuid.uuid4().hex[:12]}",
        "status": SubscriberStatus.anonymous,
        "coin_balance": 0,
        "phone": None,
    }
    defaults.update(overrides)
    return Subscriber(**defaults)
```

**Step 2: Commit**

```bash
git add subscriber-api/tests/factories.py
git commit -m "feat: add phone field to test factory"
```

---

## Part B: Mobile — Session Token Client

### Task 8: Install React Query

**Files:**
- Modify: `mobile/package.json`

**Step 1: Install @tanstack/react-query**

```bash
cd mobile && npm install @tanstack/react-query
```

**Step 2: Commit**

```bash
git add mobile/package.json mobile/package-lock.json
git commit -m "feat: add @tanstack/react-query dependency"
```

---

### Task 9: Rewrite api/client.ts for session tokens

**Files:**
- Modify: `mobile/src/api/client.ts`

**Step 1: Replace the entire client.ts with session token version**

Replace the full content of `mobile/src/api/client.ts`:

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  sessionToken: 'draama_session_token',
  deviceId: 'draama_device_id',
} as const;

/**
 * Axios API client for the subscriber-api.
 * Uses X-Session-Token header (Redis-backed, 90-day sliding TTL).
 */
const api = axios.create({
  baseURL: __DEV__
    ? 'http://localhost:8001/api'
    : 'https://api.draama.app/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach session token
api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.sessionToken);
  if (token) {
    config.headers['X-Session-Token'] = token;
  }
  return config;
});

export {STORAGE_KEYS};
export default api;
```

**Step 2: Commit**

```bash
git add mobile/src/api/client.ts
git commit -m "refactor: rewrite api client for session tokens"
```

---

### Task 10: Create API modules for auth

**Files:**
- Create: `mobile/src/api/auth.ts`

**Step 1: Create auth API module**

Create `mobile/src/api/auth.ts`:

```typescript
import api, {STORAGE_KEYS} from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Generate a UUID v4 device ID
function generateDeviceId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface SubscriberProfile {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  country: string | null;
  language: string | null;
  avatar_url: string | null;
  status: 'anonymous' | 'active' | 'suspended' | 'banned';
  coin_balance: number;
  registered_at: string | null;
  last_active_at: string | null;
}

interface DeviceRegisterResponse {
  session_token: string;
  subscriber_id: string;
}

interface OtpVerifyResponse {
  session_token: string;
  subscriber: SubscriberProfile;
  is_new_account: boolean;
}

/** Register device — creates anonymous subscriber or returns existing. */
export async function registerDevice(): Promise<DeviceRegisterResponse> {
  let deviceId = await AsyncStorage.getItem(STORAGE_KEYS.deviceId);
  if (!deviceId) {
    deviceId = generateDeviceId();
    await AsyncStorage.setItem(STORAGE_KEYS.deviceId, deviceId);
  }
  const {data} = await api.post<DeviceRegisterResponse>('/auth/device', {
    device_id: deviceId,
  });
  await AsyncStorage.setItem(STORAGE_KEYS.sessionToken, data.session_token);
  return data;
}

/** Request OTP for phone number. */
export async function requestOtp(phone: string): Promise<void> {
  await api.post('/auth/otp/request', {phone});
}

/** Verify OTP — creates or logs in subscriber. */
export async function verifyOtp(
  phone: string,
  code: string,
): Promise<OtpVerifyResponse> {
  const {data} = await api.post<OtpVerifyResponse>('/auth/otp/verify', {
    phone,
    code,
  });
  await AsyncStorage.setItem(STORAGE_KEYS.sessionToken, data.session_token);
  return data;
}

/** Get current subscriber profile. */
export async function getMe(): Promise<SubscriberProfile> {
  const {data} = await api.get<SubscriberProfile>('/me');
  return data;
}

/** Logout — invalidate session and re-register device. */
export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    // Ignore — token might already be invalid
  }
  await AsyncStorage.removeItem(STORAGE_KEYS.sessionToken);
  await registerDevice();
}
```

**Step 2: Update api/index.ts**

Replace `mobile/src/api/index.ts`:

```typescript
export {default as api, STORAGE_KEYS} from './client';
export * from './auth';
```

**Step 3: Commit**

```bash
git add mobile/src/api/auth.ts mobile/src/api/index.ts
git commit -m "feat: add auth API module (device registration, OTP, logout)"
```

---

### Task 11: Rewrite authStore for session model

**Files:**
- Modify: `mobile/src/stores/authStore.ts`

**Step 1: Replace the entire authStore.ts**

```typescript
import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {STORAGE_KEYS} from '../api/client';
import {
  registerDevice,
  requestOtp,
  verifyOtp,
  getMe,
  logout as apiLogout,
  SubscriberProfile,
} from '../api/auth';

interface AuthState {
  subscriber: SubscriberProfile | null;
  isAnonymous: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;

  /** Initialize: check for existing session or register device */
  init: () => Promise<void>;

  /** Request OTP for phone number */
  requestOtp: (phone: string) => Promise<void>;

  /** Verify OTP — creates or logs in subscriber */
  verifyOtp: (phone: string, code: string) => Promise<boolean>;

  /** Logout and fall back to anonymous session */
  logout: () => Promise<void>;

  /** Refresh subscriber profile from API */
  refreshProfile: () => Promise<void>;

  /** Update coin balance locally */
  updateBalance: (newBalance: number) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  subscriber: null,
  isAnonymous: true,
  isAuthenticated: false,
  isLoading: true,

  init: async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.sessionToken);
      if (token) {
        // Existing session — validate it
        const profile = await getMe();
        set({
          subscriber: profile,
          isAnonymous: profile.status === 'anonymous',
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }
    } catch {
      // Token invalid or expired — fall through to device registration
    }

    // No valid session — register device for anonymous access
    try {
      await registerDevice();
      const profile = await getMe();
      set({
        subscriber: profile,
        isAnonymous: true,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      // Offline or server down — still finish loading
      set({isLoading: false});
    }
  },

  requestOtp: async (phone: string) => {
    await requestOtp(phone);
  },

  verifyOtp: async (phone: string, code: string) => {
    const result = await verifyOtp(phone, code);
    set({
      subscriber: result.subscriber,
      isAnonymous: false,
      isAuthenticated: true,
    });
    return result.is_new_account;
  },

  logout: async () => {
    await apiLogout();
    // apiLogout re-registers device, so fetch the new anonymous profile
    try {
      const profile = await getMe();
      set({subscriber: profile, isAnonymous: true});
    } catch {
      set({subscriber: null, isAnonymous: true, isAuthenticated: false});
    }
  },

  refreshProfile: async () => {
    const profile = await getMe();
    set({
      subscriber: profile,
      isAnonymous: profile.status === 'anonymous',
    });
  },

  updateBalance: (newBalance: number) => {
    const {subscriber} = get();
    if (subscriber) {
      set({subscriber: {...subscriber, coin_balance: newBalance}});
    }
  },
}));
```

**Step 2: Commit**

```bash
git add mobile/src/stores/authStore.ts
git commit -m "refactor: rewrite authStore for session tokens and device registration"
```

---

### Task 12: Wire SplashScreen to authStore.init()

**Files:**
- Modify: `mobile/src/screens/SplashScreen.tsx`

**Step 1: Import and call authStore.init() in SplashScreen**

Replace the auto-navigate `useEffect` (lines 53-66) with:

```typescript
import {useAuthStore} from '../stores/authStore';

// ... inside the component, replace the auto-navigate useEffect:

  const init = useAuthStore(s => s.init);

  // Initialize auth, then navigate
  useEffect(() => {
    const doInit = async () => {
      await init();
      // Fade the whole screen out, then navigate
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        navigation.reset({index: 0, routes: [{name: 'MainTabs'}]});
      });
    };

    // Show splash for at least 1.5s for branding, then init
    const timer = setTimeout(doInit, 1500);
    return () => clearTimeout(timer);
  }, [init, navigation, screenOpacity]);
```

Remove the `AUTO_NAV_DELAY` constant (line 12) — no longer needed.

**Step 2: Commit**

```bash
git add mobile/src/screens/SplashScreen.tsx
git commit -m "feat: wire SplashScreen to authStore.init() for device registration"
```

---

### Task 13: Rewrite LoginScreen for phone+OTP

**Files:**
- Modify: `mobile/src/screens/LoginScreen.tsx`

The existing LoginScreen already has phone input UI with Saudi +966 validation. The main changes are:

**Step 1: Replace the handleContinue function**

Find the `handleContinue` function and replace with:

```typescript
import {useAuthStore} from '../stores/authStore';

// Inside the component:
const authRequestOtp = useAuthStore(s => s.requestOtp);

const handleContinue = async () => {
  if (!isValid) return;
  setIsLoading(true);
  try {
    const fullPhone = `+966${phone}`;
    await authRequestOtp(fullPhone);
    navigation.navigate('Otp', {phoneNumber: fullPhone});
  } catch {
    // TODO: show error toast
  } finally {
    setIsLoading(false);
  }
};
```

This keeps the existing UI but wires the "Continue" button to the real API.

**Step 2: Commit**

```bash
git add mobile/src/screens/LoginScreen.tsx
git commit -m "feat: wire LoginScreen to OTP request API"
```

---

### Task 14: Rewrite OtpScreen for real verification

**Files:**
- Modify: `mobile/src/screens/OtpScreen.tsx`

**Step 1: Replace the verification logic**

Find the submit/verify handler and replace with:

```typescript
import {useAuthStore} from '../stores/authStore';

// Inside the component:
const authVerifyOtp = useAuthStore(s => s.verifyOtp);

const handleVerify = async () => {
  const code = digits.join('');
  if (code.length !== 4) return;
  setIsLoading(true);
  try {
    await authVerifyOtp(phoneNumber, code);
    navigation.reset({index: 0, routes: [{name: 'MainTabs'}]});
  } catch {
    // TODO: show error — wrong code
    setDigits(['', '', '', '']);
    inputRefs.current[0]?.focus();
  } finally {
    setIsLoading(false);
  }
};
```

**Step 2: Commit**

```bash
git add mobile/src/screens/OtpScreen.tsx
git commit -m "feat: wire OtpScreen to OTP verify API"
```

---

### Task 15: Add Splash as initial route

**Files:**
- Modify: `mobile/src/navigation/AppNavigator.tsx`
- Modify: `mobile/src/navigation/types.ts`

**Step 1: Add Splash to navigation types**

In `mobile/src/navigation/types.ts`, add `Splash` to `RootStackParamList`:

```typescript
export type RootStackParamList = {
  Splash: undefined;
  MainTabs: undefined;
  // ... rest unchanged
};
```

**Step 2: Add Splash as initial route in AppNavigator**

Import SplashScreen and add it as the first screen in the Stack.Navigator:

```typescript
import SplashScreen from '../screens/SplashScreen';

// In the Stack.Navigator, add initialRouteName and the Splash screen:
<Stack.Navigator
  initialRouteName="Splash"
  screenOptions={{
    headerShown: false,
    contentStyle: {backgroundColor: colors.bg},
    animation: 'slide_from_right',
  }}>
  <Stack.Screen
    name="Splash"
    component={SplashScreen}
    options={{animation: 'none'}}
  />
  {/* ... rest unchanged */}
</Stack.Navigator>
```

**Step 3: Commit**

```bash
git add mobile/src/navigation/AppNavigator.tsx mobile/src/navigation/types.ts
git commit -m "feat: add Splash as initial route with auth initialization"
```

---

### Task 16: Add QueryClientProvider to App.tsx

**Files:**
- Modify: `mobile/App.tsx`

**Step 1: Wrap app in QueryClientProvider**

```typescript
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

// Wrap the existing app content:
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* existing GestureHandlerRootView + SafeAreaProvider + AppNavigator */}
    </QueryClientProvider>
  );
}
```

**Step 2: Commit**

```bash
git add mobile/App.tsx
git commit -m "feat: add React Query provider to App"
```

---

### Task 17: Add React Query mock to jest.setup.js

**Files:**
- Modify: `mobile/jest.setup.js`

**Step 1: Add @tanstack/react-query mock**

Add to `mobile/jest.setup.js`:

```javascript
jest.mock('@tanstack/react-query', () => ({
  QueryClient: jest.fn(() => ({
    defaultOptions: {},
  })),
  QueryClientProvider: ({children}) => children,
  useQuery: jest.fn(() => ({data: undefined, isLoading: false, error: null})),
  useMutation: jest.fn(() => ({mutate: jest.fn(), isLoading: false})),
  useQueryClient: jest.fn(() => ({invalidateQueries: jest.fn()})),
}));
```

**Step 2: Run tests**

```bash
cd mobile && npm test -- --ci
```

Expected: All existing tests pass.

**Step 3: Commit**

```bash
git add mobile/jest.setup.js
git commit -m "test: add React Query mock to jest setup"
```

---

### Task 18: Run full test suites

**Step 1: Run subscriber-api tests**

```bash
cd subscriber-api && source .venv/bin/activate && pytest -v
```

Expected: All tests pass including new OTP tests.

**Step 2: Run mobile tests**

```bash
cd mobile && npm test -- --ci
```

Expected: All tests pass.

**Step 3: Run mobile lint + type-check**

```bash
cd mobile && npm run lint && npm run type-check
```

Expected: No errors.

---

## Verification Checklist

After completing all tasks:

1. **subscriber-api**: `POST /auth/otp/request` accepts Saudi phone → logs OTP to console
2. **subscriber-api**: `POST /auth/otp/verify` with code `1234` → creates subscriber, returns session token
3. **subscriber-api**: `POST /auth/otp/verify` for existing phone → returns same subscriber
4. **subscriber-api**: `POST /auth/device` still works for anonymous registration
5. **Mobile**: App launches → SplashScreen → `authStore.init()` → device registration → anonymous session → MainTabs
6. **Mobile**: Login → phone input → OTP request → OTP screen → verify `1234` → session → MainTabs
7. **Mobile**: API calls use `X-Session-Token` header (not `Authorization: Bearer`)
8. **Mobile**: Logout → clears session → re-registers device → anonymous again
