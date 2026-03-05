import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { ScreenHeader } from "../components/common/ScreenHeader";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useWatchHistory } from "../api/queries";
import { formatDate, progressPercentage } from "../utils/formatters";

export default function WatchHistoryScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch } = useWatchHistory();
  const items = data?.items || [];

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.item} activeOpacity={0.8}>
      <Image
        source={item.thumbnail_url ? { uri: item.thumbnail_url } : undefined}
        style={styles.thumbnail}
        contentFit="cover"
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {item.series_title}
        </Text>
        <Text style={styles.episode}>EP {item.episode_number}</Text>
        <ProgressBar
          progress={progressPercentage(item.progress_seconds, item.duration_seconds)}
          style={styles.progress}
        />
        <Text style={styles.date}>{formatDate(item.last_watched_at)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={t("profile.watchHistory")}
        onBack={() => navigation.goBack()}
      />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isLoading}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t("common.noResults")}</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  item: { flexDirection: "row", paddingVertical: 12 },
  thumbnail: {
    width: 100,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#1F1133",
  },
  info: { flex: 1, marginStart: 12, justifyContent: "center" },
  title: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  episode: { color: "#A3A3A3", fontSize: 12, marginTop: 2 },
  progress: { marginTop: 6 },
  date: { color: "#666666", fontSize: 11, marginTop: 4 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 64 },
  emptyText: { color: "#A3A3A3", fontSize: 16 },
});
