import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HeroCarousel } from "../components/series/HeroCarousel";
import { CategoryRow } from "../components/series/CategoryRow";
import { DailyRewardModal } from "../components/rewards/DailyRewardModal";
import { useSeriesList, useCategories, useWatchHistory } from "../api/queries";
import { useRewardsStore } from "../stores/rewardsStore";
import type { HomeStackParamList } from "../navigation/types";
import type { Series, WatchHistory } from "../api/types";

type HomeNav = NativeStackNavigationProp<HomeStackParamList, "Home">;

export default function HomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<HomeNav>();
  const insets = useSafeAreaInsets();
  const { hasClaimedToday, claimReward } = useRewardsStore();

  const [rewardBannerDismissed, setRewardBannerDismissed] = useState(false);
  const [rewardModalVisible, setRewardModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // --- Data queries ---
  const featuredQuery = useSeriesList({ per_page: 5 });
  const categoriesQuery = useCategories();
  const watchHistoryQuery = useWatchHistory();

  // Category-specific queries — we load series for first 3 categories
  const categories = categoriesQuery.data ?? [];
  const cat0Query = useSeriesList(
    categories[0] ? { category_id: categories[0].id, per_page: 10 } : undefined
  );
  const cat1Query = useSeriesList(
    categories[1] ? { category_id: categories[1].id, per_page: 10 } : undefined
  );
  const cat2Query = useSeriesList(
    categories[2] ? { category_id: categories[2].id, per_page: 10 } : undefined
  );
  const categoryQueries = [cat0Query, cat1Query, cat2Query];

  // --- Derived data ---
  const showRewardBanner = !hasClaimedToday && !rewardBannerDismissed;

  const heroItems = useMemo(() => {
    const items = featuredQuery.data?.items ?? [];
    return items.map((s: Series) => ({
      id: s.id,
      title: s.title,
      description: s.description ?? "",
      thumbnailUrl: s.poster_url,
      episodeCount: s.episode_count,
    }));
  }, [featuredQuery.data]);

  const continueWatchingItems = useMemo(() => {
    const items = watchHistoryQuery.data?.items ?? [];
    return items
      .filter((h: WatchHistory) => !h.completed)
      .map((h: WatchHistory) => ({
        id: h.episode.series_id,
        title: h.episode.series_title,
        thumbnail_url: h.episode.series_poster_url,
        episode_count: 0,
        progress:
          h.duration_seconds && h.duration_seconds > 0
            ? Math.round((h.progress_seconds / h.duration_seconds) * 100)
            : 0,
      }));
  }, [watchHistoryQuery.data]);

  // --- Handlers ---
  const handleSeriesPress = useCallback(
    (seriesId: string) => {
      navigation.navigate("SeriesDetail", { seriesId });
    },
    [navigation]
  );

  const handleSeeAll = useCallback(
    (categoryId: string, categoryName: string) => {
      navigation.navigate("CategoryList", { categoryId, categoryName });
    },
    [navigation]
  );

  const handleClaimReward = useCallback(() => {
    claimReward();
    setRewardModalVisible(false);
  }, [claimReward]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      featuredQuery.refetch(),
      categoriesQuery.refetch(),
      watchHistoryQuery.refetch(),
      ...categoryQueries.map((q) => q.refetch()),
    ]);
    setRefreshing(false);
  }, [featuredQuery, categoriesQuery, watchHistoryQuery, categoryQueries]);

  // --- Loading state ---
  const isLoading =
    featuredQuery.isLoading && !featuredQuery.data;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8B5CF6"
            colors={["#8B5CF6"]}
            progressBackgroundColor="#1A1A1A"
          />
        }
      >
        {/* Daily Reward Banner */}
        {showRewardBanner && (
          <TouchableOpacity
            style={styles.rewardBanner}
            activeOpacity={0.8}
            onPress={() => setRewardModalVisible(true)}
          >
            <View style={styles.rewardBannerLeft}>
              <Text style={styles.rewardFlame}>{"🔥"}</Text>
              <Text style={styles.rewardBannerText}>
                {t("home.claimDailyReward")}
              </Text>
              <Text style={styles.rewardCoin}>{"🪙"}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setRewardBannerDismissed(true)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.rewardDismiss}>X</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* Hero Carousel */}
        {heroItems.length > 0 && (
          <HeroCarousel items={heroItems} onPress={handleSeriesPress} />
        )}

        {/* Continue Watching */}
        {continueWatchingItems.length > 0 && (
          <View style={styles.sectionSpacing}>
            <CategoryRow
              title={t("home.continueWatching")}
              series={continueWatchingItems.map((item) => ({
                id: item.id,
                title: item.title,
                thumbnail_url: item.thumbnail_url,
                episode_count: item.episode_count,
              }))}
              onSeriesPress={handleSeriesPress}
            />
          </View>
        )}

        {/* Dynamic Category Rows */}
        {categories.slice(0, 3).map((category, index) => {
          const query = categoryQueries[index];
          const seriesItems = query?.data?.items ?? [];
          if (seriesItems.length === 0) return null;

          return (
            <View key={category.id} style={styles.sectionSpacing}>
              <CategoryRow
                title={category.name}
                series={seriesItems.map((s: Series) => ({
                  id: s.id,
                  title: s.title,
                  thumbnail_url: s.poster_url,
                  episode_count: s.episode_count,
                }))}
                onSeriesPress={handleSeriesPress}
                onSeeAll={() => handleSeeAll(category.id, category.name)}
              />
            </View>
          );
        })}
      </ScrollView>

      {/* Daily Reward Modal */}
      <DailyRewardModal
        visible={rewardModalVisible}
        onClose={() => setRewardModalVisible(false)}
        onClaim={handleClaimReward}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  rewardBanner: {
    height: 44,
    backgroundColor: "#1F1133",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  rewardBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rewardFlame: {
    fontSize: 16,
  },
  rewardBannerText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  rewardCoin: {
    fontSize: 16,
  },
  rewardDismiss: {
    color: "#A3A3A3",
    fontSize: 14,
    fontWeight: "700",
  },
  sectionSpacing: {
    marginTop: 8,
  },
});
