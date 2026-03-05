import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
} from "react-native";
import { SeriesCard } from "./SeriesCard";

interface Series {
  id: string;
  title: string;
  thumbnail_url: string | null;
  episode_count: number;
}

interface CategoryRowProps {
  title: string;
  series: Series[];
  onSeriesPress: (id: string) => void;
  onSeeAll?: () => void;
}

export function CategoryRow({
  title,
  series,
  onSeriesPress,
  onSeeAll,
}: CategoryRowProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={series}
        keyExtractor={(item) => item.id}
        horizontal
        inverted={I18nManager.isRTL}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <SeriesCard
            id={item.id}
            title={item.title}
            thumbnailUrl={item.thumbnail_url}
            episodeCount={item.episode_count}
            onPress={onSeriesPress}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  seeAll: {
    color: "#8B5CF6",
    fontSize: 14,
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: 16,
  },
  separator: {
    width: 12,
  },
});
