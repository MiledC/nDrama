import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  accessToken: 'draama_access_token',
  refreshToken: 'draama_refresh_token',
} as const;

/**
 * Axios API client for the subscriber-api.
 * Auto-attaches JWT Bearer token and handles 401 refresh.
 * Pattern mirrors frontend/src/lib/api.ts.
 */
const api = axios.create({
  baseURL: __DEV__
    ? 'http://localhost:8001/api/v1'
    : 'https://api.draama.app/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach token
api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.accessToken);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem(
          STORAGE_KEYS.refreshToken,
        );
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const {data} = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {refresh_token: refreshToken},
        );

        await AsyncStorage.setItem(STORAGE_KEYS.accessToken, data.access_token);
        if (data.refresh_token) {
          await AsyncStorage.setItem(
            STORAGE_KEYS.refreshToken,
            data.refresh_token,
          );
        }

        processQueue(null, data.access_token);
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await AsyncStorage.removeItem(STORAGE_KEYS.accessToken);
        await AsyncStorage.removeItem(STORAGE_KEYS.refreshToken);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export {STORAGE_KEYS};
export default api;
