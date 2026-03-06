import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, {STORAGE_KEYS} from '../api/client';

interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  coinBalance: number;
  subscriptionStatus: 'free' | 'premium';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  /** Initialize auth state from stored tokens */
  init: () => Promise<void>;

  /** Login with phone OTP */
  login: (accessToken: string, refreshToken: string) => Promise<void>;

  /** Logout and clear tokens */
  logout: () => Promise<void>;

  /** Refresh user profile from API */
  fetchUser: () => Promise<void>;

  /** Update coin balance locally (after purchase/unlock) */
  updateBalance: (newBalance: number) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  init: async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.accessToken);
      if (token) {
        await get().fetchUser();
      }
    } catch {
      // Token expired or invalid — stay logged out
    } finally {
      set({isLoading: false});
    }
  },

  login: async (accessToken, refreshToken) => {
    await AsyncStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
    await AsyncStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
    await get().fetchUser();
  },

  logout: async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.accessToken);
    await AsyncStorage.removeItem(STORAGE_KEYS.refreshToken);
    set({user: null, isAuthenticated: false});
  },

  fetchUser: async () => {
    const {data} = await api.get<User>('/me');
    set({user: data, isAuthenticated: true});
  },

  updateBalance: newBalance => {
    const {user} = get();
    if (user) {
      set({user: {...user, coinBalance: newBalance}});
    }
  },
}));
