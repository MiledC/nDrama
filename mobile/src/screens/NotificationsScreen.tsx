import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { ScreenHeader } from "../components/common/ScreenHeader";
import { formatRelativeTime } from "../utils/formatters";

// Placeholder notifications data
const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    title: "New episode available!",
    body: "Episode 45 of 'The Last Kingdom' is now available",
    read: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "2",
    title: "Daily reward ready",
    body: "Claim your daily coins now!",
    read: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const renderItem = ({ item }: { item: typeof MOCK_NOTIFICATIONS[0] }) => (
    <View style={[styles.item, !item.read && styles.itemUnread]}>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemBody}>{item.body}</Text>
        <Text style={styles.itemTime}>{formatRelativeTime(item.created_at)}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={t("profile.notifications")}
        onBack={() => navigation.goBack()}
      />
      <FlatList
        data={MOCK_NOTIFICATIONS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  list: { paddingBottom: 100 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2A2A2A",
  },
  itemUnread: { backgroundColor: "rgba(139, 92, 246, 0.05)" },
  itemContent: { flex: 1 },
  itemTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  itemBody: { color: "#A3A3A3", fontSize: 13, marginTop: 4 },
  itemTime: { color: "#666666", fontSize: 11, marginTop: 6 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#8B5CF6",
    marginStart: 12,
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 64 },
  emptyText: { color: "#A3A3A3", fontSize: 16 },
});
