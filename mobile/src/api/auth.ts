import api, {STORAGE_KEYS} from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';

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
  const deviceId = await DeviceInfo.getUniqueId();
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
