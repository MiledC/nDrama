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
import type { Series } from "../api/types";

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
  const featuredQuery = useSeriesList({ limit: 5 });
  const categoriesQuery = useCategories();
  const watchHistoryQuery = useWatchHistory();

  // --- Derived data ---
  const showRewardBanner = !hasClaimedToday && !rewardBannerDismissed;

  const heroItems = useMemo(() => {
    const items = featuredQuery.data?.items ?? [];
    return items.map((s: Series) => ({
      id: s.id,
      title: s.title,
      description: s.description ?? "",
      thumbnailUrl: s.thumbnail_url,
      episodeCount: s.free_episode_count,
    }));
  }, [featuredQuery.data]);

  // Tags from series to use as "categories" in the UI
  const allSeries = featuredQuery.data?.items ?? [];
  const tagGroups = useMemo(() => {
    const tagMap = new Map<string, { name: string; series: Series[] }>();
    for (const s of allSeries) {
      for (const tag of s.tags) {
        const existing = tagMap.get(tag.id);
        if (existing) {
          existing.series.push(s);
        } else {
          tagMap.set(tag.id, { name: tag.name, series: [s] });
        }
      }
    }
    return Array.from(tagMap.values());
  }, [allSeries]);

  // --- Handlers ---
  const handleSeriesPress = useCallback(
    (seriesId: string) => {
      navigation.navigate("SeriesDetail", { seriesId });
    },
    [navigation]
  );

  const handleSeeAll = useCallback(
    (_tagId: string, _tagName: string) => {
      // Could navigate to a tag-filtered list in the future
    },
    []
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
    ]);
    setRefreshing(false);
  }, [featuredQuery, categoriesQuery, watchHistoryQuery]);

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

        {/* All Series */}
        {allSeries.length > 0 && (
          <View style={styles.sectionSpacing}>
            <CategoryRow
              title={t("home.allSeries")}
              series={allSeries.map((s: Series) => ({
                id: s.id,
                title: s.title,
                thumbnail_url: s.thumbnail_url,
                episode_count: s.free_episode_count,
              }))}
              onSeriesPress={handleSeriesPress}
            />
          </View>
        )}

        {/* Tag-based rows */}
        {tagGroups.map((group) => (
          <View key={group.name} style={styles.sectionSpacing}>
            <CategoryRow
              title={group.name}
              series={group.series.map((s: Series) => ({
                id: s.id,
                title: s.title,
                thumbnail_url: s.thumbnail_url,
                episode_count: s.free_episode_count,
              }))}
              onSeriesPress={handleSeriesPress}
            />
          </View>
        ))}
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
