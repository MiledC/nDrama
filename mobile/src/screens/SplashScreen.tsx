import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import { useAuthStore } from "../stores/authStore";
import { deviceAuth } from "../api/auth";
import { getDeviceId } from "../utils/storage";
import type { RootStackParamList } from "../navigation/types";

type SplashNav = NativeStackNavigationProp<RootStackParamList, "Splash">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const LETTERS = ["D", "R", "A", "A", "M", "A"];

export default function SplashScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<SplashNav>();
  const { loadSession, setSession } = useAuthStore();

  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Starting up...");

  // Letter reveal animations — one per letter
  const letterAnims = useRef(LETTERS.map(() => new Animated.Value(0))).current;
  // Glow pulse behind logo
  const glowAnim = useRef(new Animated.Value(0)).current;
  // Tagline fade
  const taglineAnim = useRef(new Animated.Value(0)).current;
  // Loading bar progress
  const loadBarAnim = useRef(new Animated.Value(0)).current;
  // Error container fade
  const errorAnim = useRef(new Animated.Value(0)).current;

  // Staggered letter reveal on mount
  useEffect(() => {
    const letterSequence = letterAnims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 280,
        delay: i * 90,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      })
    );

    Animated.sequence([
      Animated.stagger(90, letterSequence),
      Animated.timing(taglineAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Breathing glow loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [letterAnims, glowAnim, taglineAnim]);

  // Animate loading bar
  useEffect(() => {
    if (isInitializing && !error) {
      loadBarAnim.setValue(0);
      Animated.timing(loadBarAnim, {
        toValue: 0.85,
        duration: 8000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    }
  }, [isInitializing, error, loadBarAnim]);

  // Animate error in
  useEffect(() => {
    if (error) {
      errorAnim.setValue(0);
      Animated.timing(errorAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [error, errorAnim]);

  const completeLoadBar = useCallback(() => {
    Animated.timing(loadBarAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start(() => {
      navigation.reset({ index: 0, routes: [{ name: "Main" }] });
    });
  }, [loadBarAnim, navigation]);

  const initialize = useCallback(async () => {
    setError(null);
    setIsInitializing(true);

    try {
      console.log("[Splash] Loading saved session...");
      setStatusMessage("Loading session...");
      await loadSession();
      const token = useAuthStore.getState().sessionToken;

      if (token) {
        console.log("[Splash] Found existing session, proceeding to main");
        setStatusMessage("Welcome back!");
        completeLoadBar();
        return;
      }

      console.log("[Splash] No session found, registering device...");
      setStatusMessage("Connecting to server...");
      try {
        const deviceId = await getDeviceId();
        console.log("[Splash] Device ID:", deviceId.substring(0, 8) + "...");
        setStatusMessage("Registering device...");
        const response = await deviceAuth({ device_id: deviceId });
        console.log("[Splash] Got session token, saving...");
        setStatusMessage("Setting up your account...");
        await setSession(response.session_token);
        console.log("[Splash] Session saved successfully");
      } catch (apiErr) {
        console.warn("[Splash] API error (continuing offline):", apiErr instanceof Error ? apiErr.message : apiErr);
        setStatusMessage("Offline mode");
      }

      setStatusMessage("Loading content...");
      completeLoadBar();
    } catch (err) {
      console.error("[Splash] Critical error:", err);
      setIsInitializing(false);
      setError(
        err instanceof Error ? err.message : t("splash.errorMessage")
      );
    }
  }, [loadSession, setSession, completeLoadBar, t]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.4],
  });
  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.15],
  });

  const loadBarWidth = loadBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_WIDTH * 0.55],
  });

  return (
    <View style={styles.container}>
      {/* Ambient background circles */}
      <Animated.View
        style={[
          styles.ambientCircle,
          styles.ambientTop,
          { opacity: glowOpacity, transform: [{ scale: glowScale }] },
        ]}
      />
      <Animated.View
        style={[
          styles.ambientCircle,
          styles.ambientBottom,
          {
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.08, 0.2],
            }),
          },
        ]}
      />

      {/* Logo area */}
      <View style={styles.logoArea}>
        {/* Glow behind text */}
        <Animated.View
          style={[
            styles.logoGlow,
            { opacity: glowOpacity, transform: [{ scale: glowScale }] },
          ]}
        />

        {/* Letter-by-letter DRAAMA */}
        <View style={styles.letterRow}>
          {LETTERS.map((letter, i) => {
            const translateY = letterAnims[i].interpolate({
              inputRange: [0, 1],
              outputRange: [24, 0],
            });
            return (
              <Animated.Text
                key={`${letter}-${i}`}
                style={[
                  styles.letter,
                  i === 0 && styles.letterAccent,
                  {
                    opacity: letterAnims[i],
                    transform: [{ translateY }],
                  },
                ]}
              >
                {letter}
              </Animated.Text>
            );
          })}
        </View>

        {/* Tagline */}
        <Animated.Text
          style={[
            styles.tagline,
            {
              opacity: taglineAnim,
              transform: [
                {
                  translateY: taglineAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {t("splash.tagline")}
        </Animated.Text>
      </View>

      {/* Bottom status area */}
      <View style={styles.bottomArea}>
        {isInitializing && !error && (
          <View style={styles.loadingContainer}>
            {/* Slim loading bar */}
            <View style={styles.loadBarTrack}>
              <Animated.View
                style={[styles.loadBarFill, { width: loadBarWidth }]}
              />
            </View>
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
        )}

        {error && (
          <Animated.View
            style={[
              styles.errorContainer,
              {
                opacity: errorAnim,
                transform: [
                  {
                    translateY: errorAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.errorTitle}>{t("splash.errorTitle")}</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={initialize}
              activeOpacity={0.8}
            >
              <Text style={styles.retryText}>{t("common.retry")}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050507",
    alignItems: "center",
    justifyContent: "center",
  },

  // Ambient background
  ambientCircle: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: "#8B5CF6",
  },
  ambientTop: {
    top: -80,
    right: -100,
  },
  ambientBottom: {
    bottom: -120,
    left: -80,
    backgroundColor: "#6D28D9",
  },

  // Logo
  logoArea: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoGlow: {
    position: "absolute",
    width: 200,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#8B5CF6",
  },
  letterRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  letter: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: 8,
  },
  letterAccent: {
    color: "#8B5CF6",
  },
  tagline: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginTop: 14,
  },

  // Bottom area
  bottomArea: {
    position: "absolute",
    bottom: 100,
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 40,
  },
  loadingContainer: {
    alignItems: "center",
    width: "100%",
  },
  loadBarTrack: {
    width: SCREEN_WIDTH * 0.55,
    height: 2,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    borderRadius: 1,
    overflow: "hidden",
  },
  loadBarFill: {
    height: "100%",
    backgroundColor: "#8B5CF6",
    borderRadius: 1,
  },
  statusText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    fontWeight: "400",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 16,
  },

  // Error
  errorContainer: {
    alignItems: "center",
    paddingHorizontal: 8,
  },
  errorTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  errorMessage: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 36,
    paddingVertical: 13,
    borderRadius: 24,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
