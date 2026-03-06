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
