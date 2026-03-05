import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "@/stores/authStore";

const resetStore = () => useAuthStore.setState(useAuthStore.getInitialState());

beforeEach(() => {
  resetStore();
  jest.clearAllMocks();
});

const mockSubscriber = {
  id: "sub-1",
  email: "user@example.com",
  name: "Test User",
  avatar_url: null,
  status: "active" as const,
  coin_balance: 50,
  subscription_tier: null,
  created_at: "2026-01-01T00:00:00Z",
};

describe("authStore", () => {
  it("starts in loading state with no session", () => {
    const state = useAuthStore.getState();
    expect(state.isLoading).toBe(true);
    expect(state.sessionToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("setSession stores token and marks authenticated", async () => {
    await useAuthStore.getState().setSession("token-123");
    const state = useAuthStore.getState();
    expect(state.sessionToken).toBe("token-123");
    expect(state.isAuthenticated).toBe(true);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "draama_session_token",
      "token-123"
    );
  });

  it("setSession with subscriber marks registered", async () => {
    await useAuthStore.getState().setSession("token-123", mockSubscriber);
    const state = useAuthStore.getState();
    expect(state.subscriber).toEqual(mockSubscriber);
    expect(state.isRegistered).toBe(true);
  });

  it("setSession with anonymous subscriber does not mark registered", async () => {
    const anonSub = { ...mockSubscriber, status: "anonymous" as const };
    await useAuthStore.getState().setSession("token-123", anonSub);
    expect(useAuthStore.getState().isRegistered).toBe(false);
  });

  it("clearSession removes token and resets state", async () => {
    await useAuthStore.getState().setSession("token-123", mockSubscriber);
    await useAuthStore.getState().clearSession();
    const state = useAuthStore.getState();
    expect(state.sessionToken).toBeNull();
    expect(state.subscriber).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isRegistered).toBe(false);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
  });

  it("loadSession restores token from secure store", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("saved-token");
    await useAuthStore.getState().loadSession();
    const state = useAuthStore.getState();
    expect(state.sessionToken).toBe("saved-token");
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it("loadSession handles missing token", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    await useAuthStore.getState().loadSession();
    const state = useAuthStore.getState();
    expect(state.sessionToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it("loadSession handles errors gracefully", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(
      new Error("SecureStore error")
    );
    await useAuthStore.getState().loadSession();
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it("setSubscriber updates subscriber and registration status", () => {
    useAuthStore.getState().setSubscriber(mockSubscriber);
    expect(useAuthStore.getState().subscriber).toEqual(mockSubscriber);
    expect(useAuthStore.getState().isRegistered).toBe(true);
  });
});
