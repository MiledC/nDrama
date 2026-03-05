import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenHeader } from "../components/common/ScreenHeader";
import { SeriesCard } from "../components/series/SeriesCard";
import { useSeriesList } from "../api/queries";
import type { HomeScreenProps } from "../navigation/types";

const CARD_WIDTH = (Dimensions.get("window").width - 16 * 2 - 12) / 2;

export default function CategoryListScreen() {
  const navigation = useNavigation();
  const route = useRoute<HomeScreenProps<"CategoryList">["route"]>();
  const { categoryId, categoryName } = route.params;
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch } = useSeriesList({ category_id: categoryId });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title={categoryName} onBack={() => navigation.goBack()} />
      <FlatList
        data={data?.items || []}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isLoading}
        renderItem={({ item }) => (
          <SeriesCard
            id={item.id}
            title={item.title}
            thumbnailUrl={item.poster_url}
            episodeCount={item.episode_count}
            onPress={(id) =>
              navigation.navigate("SeriesDetail" as any, { seriesId: id })
            }
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  row: { gap: 12, marginBottom: 16 },
});
