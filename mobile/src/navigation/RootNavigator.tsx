import React, { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./types";
import { useAuthStore } from "../stores/authStore";
import { TabNavigator } from "./TabNavigator";
import { AuthStack } from "./AuthStack";

const SplashScreen = React.lazy(() => import("../screens/SplashScreen"));
const PlayerScreen = React.lazy(() => import("../screens/PlayerScreen"));

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuthStore();

  if (isLoading) {
    return (
      <React.Suspense fallback={null}>
        <SplashScreen />
      </React.Suspense>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen
            name="Auth"
            component={AuthStack}
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="Player"
            component={PlayerScreen}
            options={{
              animation: "slide_from_bottom",
              gestureEnabled: false,
              contentStyle: { backgroundColor: "#000000" },
            }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen
            name="Auth"
            component={AuthStack}
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="Player"
            component={PlayerScreen}
            options={{
              animation: "slide_from_bottom",
              gestureEnabled: false,
              contentStyle: { backgroundColor: "#000000" },
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
