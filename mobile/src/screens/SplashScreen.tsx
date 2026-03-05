import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import { useAuthStore } from "../stores/authStore";
import { deviceAuth } from "../api/auth";
import { getDeviceId } from "../utils/storage";
import type { RootStackParamList } from "../navigation/types";

type SplashNav = NativeStackNavigationProp<RootStackParamList, "Splash">;

export default function SplashScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<SplashNav>();
  const { loadSession, setSession, sessionToken } = useAuthStore();

  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const initialize = useCallback(async () => {
    setError(null);
    setIsInitializing(true);

    try {
      // 1. Try to load an existing session from secure storage
      await loadSession();

      // Re-read the token after loadSession updates the store
      const token = useAuthStore.getState().sessionToken;

      if (token) {
        // Existing session found - proceed to main
        navigation.reset({ index: 0, routes: [{ name: "Main" }] });
        return;
      }

      // 2. No existing session - register this device anonymously
      const deviceId = await getDeviceId();
      const response = await deviceAuth({ device_id: deviceId });

      // 3. Persist the new session
      await setSession(response.session_token);

      // 4. Navigate to main
      navigation.reset({ index: 0, routes: [{ name: "Main" }] });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("splash.errorMessage")
      );
    } finally {
      setIsInitializing(false);
    }
  }, [loadSession, setSession, navigation, t]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <View style={styles.container}>
      {/* Branding */}
      <View style={styles.brandContainer}>
        <Text style={styles.logo}>DRAAMA</Text>
        <Text style={styles.tagline}>{t("splash.tagline")}</Text>
      </View>

      {/* Status area */}
      <View style={styles.statusContainer}>
        {isInitializing && !error && (
          <>
            <ActivityIndicator size="small" color="#8B5CF6" />
            <Text style={styles.connectingText}>{t("splash.connecting")}</Text>
          </>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>{t("splash.errorTitle")}</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={initialize}>
              <Text style={styles.retryText}>{t("common.retry")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  brandContainer: {
    alignItems: "center",
  },
  logo: {
    color: "#8B5CF6",
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: 6,
    marginBottom: 8,
  },
  tagline: {
    color: "#A3A3A3",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 1,
  },
  statusContainer: {
    position: "absolute",
    bottom: 100,
    alignItems: "center",
  },
  connectingText: {
    color: "#A3A3A3",
    fontSize: 13,
    marginTop: 12,
  },
  errorContainer: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  errorTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  errorMessage: {
    color: "#A3A3A3",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
