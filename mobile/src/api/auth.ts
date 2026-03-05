import apiClient from './client';
import type {
  AuthResponse,
  DeviceAuthRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from './types';

/** Register a device and obtain an anonymous session token. */
export async function deviceAuth(body: DeviceAuthRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/device', body);
  return data;
}

/** Upgrade an anonymous subscriber to a registered account. */
export async function register(body: RegisterRequest): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>('/auth/register', body);
  return data;
}

/** Log in with email + password. */
export async function login(body: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', body);
  return data;
}

/** Invalidate the current session token. */
export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}
