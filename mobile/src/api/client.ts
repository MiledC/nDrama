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
