import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

import { API_BASE_URL, DEVICE_ID_KEY, SESSION_TOKEN_KEY } from '@/utils/constants';

/**
 * Configured Axios instance for the Draama subscriber API.
 *
 * - Attaches `X-Session-Token` from secure store on every request.
 * - On 401, attempts device re-auth once, then retries the original request.
 * - On 403, the error propagates so callers/UI can handle banned/suspended state.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Request interceptor — attach session token
// ---------------------------------------------------------------------------

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
  if (token) {
    config.headers.set('X-Session-Token', token);
  }
  return config;
});

// ---------------------------------------------------------------------------
// Response interceptor — handle 401 (re-auth) and 403 (banned)
// ---------------------------------------------------------------------------

/** Guard to prevent infinite retry loops. */
let isRefreshing = false;

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 401 — session expired or invalid. Try device re-auth once.
    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshing) {
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
        if (!deviceId) {
          // No device ID — cannot re-auth. Propagate 401.
          return Promise.reject(error);
        }

        const { data } = await axios.post(`${API_BASE_URL}/auth/device`, {
          device_id: deviceId,
        });

        const newToken: string = data.session_token;
        await SecureStore.setItemAsync(SESSION_TOKEN_KEY, newToken);

        // Retry the original request with the fresh token.
        originalRequest.headers.set('X-Session-Token', newToken);
        return apiClient(originalRequest);
      } catch {
        // Re-auth failed — clear stored token so the app can restart the flow.
        await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    // 403 — subscriber is suspended or banned. Let the error propagate;
    // callers or a global error handler can navigate to a "banned" screen.

    return Promise.reject(error);
  },
);

export default apiClient;
