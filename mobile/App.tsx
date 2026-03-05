import React, { Suspense, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { View, StyleSheet } from "react-native";

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
                regular: { fontFamily: "System", fontWeight: "400" },
                medium: { fontFamily: "System", fontWeight: "500" },
                bold: { fontFamily: "System", fontWeight: "700" },
                heavy: { fontFamily: "System", fontWeight: "800" },
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
});
