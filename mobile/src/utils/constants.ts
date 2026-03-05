/**
 * App-wide constants for the Draama mobile app.
 */

/** Base URL for the subscriber API. Override via EAS env or .env. */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8001/api';

/** Key used to store the session token in expo-secure-store. */
export const SESSION_TOKEN_KEY = 'ndrama_session_token';

/** Key used to store the device ID in expo-secure-store. */
export const DEVICE_ID_KEY = 'ndrama_device_id';

/** Default page size for paginated requests. */
export const DEFAULT_PAGE_SIZE = 20;

/** React Query stale times (ms). */
export const STALE_TIMES = {
  /** Categories rarely change. */
  categories: 10 * 60 * 1000,
  /** Series lists cache for 5 minutes. */
  seriesList: 5 * 60 * 1000,
  /** Series detail cache for 5 minutes. */
  seriesDetail: 5 * 60 * 1000,
  /** Coin balance should be fairly fresh. */
  coinBalance: 30 * 1000,
  /** Coin packages rarely change. */
  coinPackages: 10 * 60 * 1000,
  /** Profile data. */
  profile: 5 * 60 * 1000,
} as const;
