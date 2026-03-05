import React, { Suspense, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useFonts } from "expo-font";
import {
  NotoSansArabic_400Regular,
  NotoSansArabic_500Medium,
  NotoSansArabic_600SemiBold,
  NotoSansArabic_700Bold,
  NotoSansArabic_800ExtraBold,
} from "@expo-google-fonts/noto-sans-arabic";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";

import { RootNavigator } from "./src/navigation/RootNavigator";
import { useAuthStore } from "./src/stores/authStore";

// Import i18n configuration (side effect)
import "./src/i18n";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

function AppContent() {
  const loadSession = useAuthStore((s) => s.loadSession);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  return (
    <Suspense fallback={<View style={styles.fallback} />}>
      <RootNavigator />
    </Suspense>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    "NotoSansArabic-Regular": NotoSansArabic_400Regular,
    "NotoSansArabic-Medium": NotoSansArabic_500Medium,
    "NotoSansArabic-SemiBold": NotoSansArabic_600SemiBold,
    "NotoSansArabic-Bold": NotoSansArabic_700Bold,
    "NotoSansArabic-ExtraBold": NotoSansArabic_800ExtraBold,
    "Inter-Regular": Inter_400Regular,
    "Inter-Medium": Inter_500Medium,
    "Inter-SemiBold": Inter_600SemiBold,
    "Inter-Bold": Inter_700Bold,
    "Inter-ExtraBold": Inter_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer
            theme={{
              dark: true,
              colors: {
                primary: "#8B5CF6",
                background: "#0D0D0D",
                card: "#1F1133",
                text: "#FFFFFF",
                border: "#2A2A2A",
                notification: "#00B856",
              },
              fonts: {
                regular: { fontFamily: "NotoSansArabic-Regular", fontWeight: "400" },
                medium: { fontFamily: "NotoSansArabic-Medium", fontWeight: "500" },
                bold: { fontFamily: "NotoSansArabic-Bold", fontWeight: "700" },
                heavy: { fontFamily: "NotoSansArabic-ExtraBold", fontWeight: "800" },
              },
            }}
          >
            <StatusBar style="light" />
            <AppContent />
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  fallback: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  loading: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    alignItems: "center",
    justifyContent: "center",
  },
});
