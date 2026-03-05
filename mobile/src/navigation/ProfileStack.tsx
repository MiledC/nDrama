import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { ProfileStackParamList } from "./types";

const ProfileScreen = React.lazy(() => import("../screens/ProfileScreen"));
const SettingsScreen = React.lazy(() => import("../screens/SettingsScreen"));
const WatchHistoryScreen = React.lazy(() => import("../screens/WatchHistoryScreen"));
const NotificationsScreen = React.lazy(() => import("../screens/NotificationsScreen"));
const CoinStoreScreen = React.lazy(() => import("../screens/CoinStoreScreen"));
const SubscriptionsScreen = React.lazy(() => import("../screens/SubscriptionsScreen"));
const ReferralScreen = React.lazy(() => import("../screens/ReferralScreen"));

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0D0D0D" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="WatchHistory" component={WatchHistoryScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="CoinStore" component={CoinStoreScreen} />
      <Stack.Screen name="Subscriptions" component={SubscriptionsScreen} />
      <Stack.Screen name="Referral" component={ReferralScreen} />
    </Stack.Navigator>
  );
}
