import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Platform, StyleSheet, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import type { TabParamList } from "./types";
import { HomeStack } from "./HomeStack";
import { DiscoverStack } from "./DiscoverStack";
import { SearchStack } from "./SearchStack";
import { MyListStack } from "./MyListStack";
import { ProfileStack } from "./ProfileStack";

const Tab = createBottomTabNavigator<TabParamList>();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    HomeTab: "H",
    DiscoverTab: "D",
    SearchTab: "S",
    MyListTab: "L",
    ProfileTab: "P",
  };

  return (
    <View style={[styles.iconContainer, focused && styles.iconFocused]}>
      <Text style={[styles.iconText, focused && styles.iconTextFocused]}>
        {icons[name] || "?"}
      </Text>
    </View>
  );
}

export function TabNavigator() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: "#8B5CF6",
        tabBarInactiveTintColor: "#666666",
        tabBarStyle: {
          backgroundColor: "#1F1133",
          borderTopColor: "#2A2A2A",
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{ tabBarLabel: t("tabs.home") }}
      />
      <Tab.Screen
        name="DiscoverTab"
        component={DiscoverStack}
        options={{ tabBarLabel: t("tabs.discover") }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchStack}
        options={{ tabBarLabel: t("tabs.search") }}
      />
      <Tab.Screen
        name="MyListTab"
        component={MyListStack}
        options={{ tabBarLabel: t("tabs.myList") }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{ tabBarLabel: t("tabs.profile") }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconFocused: {
    backgroundColor: "rgba(139, 92, 246, 0.15)",
  },
  iconText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666666",
  },
  iconTextFocused: {
    color: "#8B5CF6",
  },
});
