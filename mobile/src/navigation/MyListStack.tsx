import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { MyListStackParamList } from "./types";

const MyListScreen = React.lazy(() => import("../screens/MyListScreen"));
const SeriesDetailScreen = React.lazy(() => import("../screens/SeriesDetailScreen"));

const Stack = createNativeStackNavigator<MyListStackParamList>();

export function MyListStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0D0D0D" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="MyList" component={MyListScreen} />
      <Stack.Screen name="SeriesDetail" component={SeriesDetailScreen} />
    </Stack.Navigator>
  );
}
