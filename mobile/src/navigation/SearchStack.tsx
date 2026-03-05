import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { SearchStackParamList } from "./types";

const SearchScreen = React.lazy(() => import("../screens/SearchScreen"));
const SeriesDetailScreen = React.lazy(() => import("../screens/SeriesDetailScreen"));

const Stack = createNativeStackNavigator<SearchStackParamList>();

export function SearchStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0D0D0D" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="SeriesDetail" component={SeriesDetailScreen} />
    </Stack.Navigator>
  );
}
