import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { useFavorites } from "../api/queries";
import { useFavoritesStore } from "../stores/favoritesStore";
import { ScreenHeader } from "../components/common/ScreenHeader";

const CARD_WIDTH = (Dimensions.get("window").width - 16 * 2 - 12) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

export default function MyListScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch } = useFavorites();
  const favorites = data?.items || [];

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() =>
        (navigation as any).navigate("HomeTab", {
          screen: "SeriesDetail",
          params: { seriesId: item.series_id },
        })
      }
    >
      <Image
        source={item.thumbnail_url ? { uri: item.thumbnail_url } : undefined}
        style={styles.thumbnail}
        contentFit="cover"
      />
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title={t("tabs.myList")} />
      {favorites.length === 0 && !isLoading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{t("common.noResults")}</Text>
          <Text style={styles.emptySubtext}>
            Browse series and tap the heart to add to your list
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          onRefresh={refetch}
          refreshing={isLoading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  row: { gap: 12, marginBottom: 16 },
  card: { width: CARD_WIDTH },
  thumbnail: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 8,
    backgroundColor: "#1F1133",
  },
  title: { color: "#FFFFFF", fontSize: 14, fontWeight: "600", marginTop: 8 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "700", marginBottom: 8 },
  emptySubtext: { color: "#A3A3A3", fontSize: 14, textAlign: "center" },
});
