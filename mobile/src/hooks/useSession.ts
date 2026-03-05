import { useCallback, useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { getDeviceId } from "../utils/storage";

export function useSession() {
  const {
    sessionToken,
    subscriber,
    isAuthenticated,
    isRegistered,
    isLoading,
    setSession,
    clearSession,
  } = useAuthStore();

  const initAnonymousSession = useCallback(async () => {
    if (sessionToken) return;
    try {
      const deviceId = await getDeviceId();
      // API call will be handled by the auth API module
      // This hook provides the orchestration logic
      return deviceId;
    } catch {
      // Silent failure — app can still work without session for browsing
    }
  }, [sessionToken]);

  return {
    sessionToken,
    subscriber,
    isAuthenticated,
    isRegistered,
    isAnonymous: isAuthenticated && !isRegistered,
    isLoading,
    initAnonymousSession,
    setSession,
    clearSession,
  };
}
