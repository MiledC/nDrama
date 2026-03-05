import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import { useSeriesList } from "@/api/queries";
import type { DiscoverStackParamList } from "@/navigation/types";
import type { Series } from "@/api/types";
import { colors, radii } from "@/theme/tokens";
import { Button } from "@/components/ui/Button";

type NavigationProp = NativeStackNavigationProp<DiscoverStackParamList, "Discover">;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function DiscoverScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { data, isLoading, isError, refetch } = useSeriesList();
  const seriesList = data?.items ?? [];

  const cardHeight = SCREEN_HEIGHT - insets.bottom - 80; // account for tab bar

  const handleSeriesPress = useCallback(
    (seriesId: string) => {
      navigation.navigate("SeriesDetail", { seriesId });
    },
    [navigation],
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const renderCard = useCallback(
    ({ item }: { item: Series }) => (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => handleSeriesPress(item.id)}
        style={[styles.card, { height: cardHeight }]}
      >
        <Image
          source={item.poster_url ? { uri: item.poster_url } : undefined}
          style={styles.cardImage}
          contentFit="cover"
          transition={300}
        />
        {/* Gradient overlay simulated with layered Views */}
        <View style={styles.gradientTop} />
        <View style={styles.gradientBottom} />
        <View style={[styles.cardContent, { paddingBottom: 32 }]}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.cardMeta}>
            {item.episode_count} {t("series.episodes").toLowerCase()}
          </Text>
          <Button
            title={t("series.watchNow")}
            onPress={() => handleSeriesPress(item.id)}
            variant="primary"
            size="md"
            style={styles.watchButton}
          />
        </View>
      </TouchableOpacity>
    ),
    [cardHeight, handleSeriesPress, t],
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{t("common.error")}</Text>
        <Button
          title={t("common.retry")}
          onPress={() => refetch()}
          variant="outline"
          size="sm"
          style={styles.retryButton}
        />
      </View>
    );
  }

  if (seriesList.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>{t("common.noResults")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={seriesList}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        pagingEnabled
        snapToInterval={cardHeight}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: cardHeight,
          offset: cardHeight * index,
          index,
        })}
      />

      {/* Page indicator dots */}
      {seriesList.length > 1 && (
        <View style={[styles.dotsContainer, { bottom: insets.bottom + 12 }]}>
          {seriesList.slice(0, 8).map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.dot,
                index === activeIndex && styles.dotActive,
              ]}
            />
          ))}
          {seriesList.length > 8 && (
            <Text style={styles.dotMore}>+{seriesList.length - 8}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: SCREEN_WIDTH,
    position: "relative",
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  gradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "40%",
    backgroundColor: "transparent",
  },
  gradientBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "55%",
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  cardContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 6,
  },
  cardMeta: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 18,
  },
  watchButton: {
    alignSelf: "flex-start",
    minWidth: 160,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginBottom: 12,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  retryButton: {
    marginTop: 8,
  },
  dotsContainer: {
    position: "absolute",
    right: 16,
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotMore: {
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: "600",
  },
});
