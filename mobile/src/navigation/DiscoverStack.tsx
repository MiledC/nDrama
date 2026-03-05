import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { DiscoverStackParamList } from "./types";

const DiscoverScreen = React.lazy(() => import("../screens/DiscoverScreen"));
const SeriesDetailScreen = React.lazy(() => import("../screens/SeriesDetailScreen"));

const Stack = createNativeStackNavigator<DiscoverStackParamList>();

export function DiscoverStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0D0D0D" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="Discover" component={DiscoverScreen} />
      <Stack.Screen name="SeriesDetail" component={SeriesDetailScreen} />
    </Stack.Navigator>
  );
}
