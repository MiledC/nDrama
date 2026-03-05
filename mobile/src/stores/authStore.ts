import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

export type SubscriberStatus = "anonymous" | "active" | "suspended" | "banned";

export interface SubscriberProfile {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  status: SubscriberStatus;
  coin_balance: number;
  subscription_tier: string | null;
  created_at: string;
}

interface AuthState {
  sessionToken: string | null;
  subscriber: SubscriberProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isRegistered: boolean;

  setSession: (token: string, subscriber?: SubscriberProfile | null) => Promise<void>;
  setSubscriber: (subscriber: SubscriberProfile) => void;
  clearSession: () => Promise<void>;
  loadSession: () => Promise<void>;
}

const SESSION_TOKEN_KEY = "draama_session_token";

export const useAuthStore = create<AuthState>((set, get) => ({
  sessionToken: null,
  subscriber: null,
  isLoading: true,
  isAuthenticated: false,
  isRegistered: false,

  setSession: async (token, subscriber = null) => {
    await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
    set({
      sessionToken: token,
      subscriber,
      isAuthenticated: true,
      isRegistered: subscriber?.status === "active",
    });
  },

  setSubscriber: (subscriber) => {
    set({
      subscriber,
      isRegistered: subscriber.status === "active",
    });
  },

  clearSession: async () => {
    await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
    set({
      sessionToken: null,
      subscriber: null,
      isAuthenticated: false,
      isRegistered: false,
    });
  },

  loadSession: async () => {
    try {
      const token = await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
      set({
        sessionToken: token,
        isAuthenticated: !!token,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },
}));
