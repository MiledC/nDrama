import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Share,
  I18nManager,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import { useSeriesDetail, useEpisodes, useToggleFavorite } from "@/api/queries";
import { EpisodeGrid } from "@/components/series/EpisodeGrid";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useFavoritesStore } from "@/stores/favoritesStore";
import type { HomeStackParamList, SearchStackParamList, DiscoverStackParamList } from "@/navigation/types";
import type { Episode } from "@/api/types";
import { colors, spacing, radii, typography } from "@/theme/tokens";

// The screen can appear in any stack that has SeriesDetail
type SeriesDetailRoute = RouteProp<HomeStackParamList, "SeriesDetail">;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_HEIGHT * 0.6;
const EPISODES_PER_RANGE = 20;

type DetailTab = "episodes" | "related";

export default function SeriesDetailScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<SeriesDetailRoute>();
  const { seriesId } = route.params;

  const [activeTab, setActiveTab] = useState<DetailTab>("episodes");
  const [selectedRange, setSelectedRange] = useState(0);

  const { data: series, isLoading, isError, refetch } = useSeriesDetail(seriesId);
  const { data: episodesData } = useEpisodes(seriesId);
  const toggleFavoriteMutation = useToggleFavorite();

  const isFavorite = useFavoritesStore((s) => s.isFavorite(seriesId));

  const episodes = useMemo(() => {
    // Prefer paginated episodes data, fall back to detail-embedded episodes
    if (episodesData?.items) return episodesData.items;
    if (series?.episodes) return series.episodes;
    return [];
  }, [episodesData, series]);

  const episodeRanges = useMemo(() => {
    if (episodes.length <= EPISODES_PER_RANGE) return [];
    const ranges: { start: number; end: number }[] = [];
    for (let i = 0; i < episodes.length; i += EPISODES_PER_RANGE) {
      ranges.push({
        start: i + 1,
        end: Math.min(i + EPISODES_PER_RANGE, episodes.length),
      });
    }
    return ranges;
  }, [episodes]);

  const visibleEpisodes = useMemo(() => {
    if (episodeRanges.length === 0) return episodes;
    const start = selectedRange * EPISODES_PER_RANGE;
    return episodes.slice(start, start + EPISODES_PER_RANGE);
  }, [episodes, episodeRanges, selectedRange]);

  const gridEpisodes = useMemo(
    () =>
      visibleEpisodes.map((ep) => ({
        id: ep.id,
        episode_number: ep.episode_number,
        is_free: ep.is_free,
        is_locked: !ep.is_unlocked && !ep.is_free,
        coin_cost: ep.coin_price,
      })),
    [visibleEpisodes],
  );

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleWatchNow = useCallback(() => {
    if (episodes.length === 0) return;
    // Find first free or unlocked episode
    const firstPlayable =
      episodes.find((ep) => ep.is_free || ep.is_unlocked) ?? episodes[0];
    if (!firstPlayable.is_free && !firstPlayable.is_unlocked) {
      Alert.alert(t("series.locked"), t("coins.insufficientCoins"));
      return;
    }
    navigation.navigate("SeriesDetail", { seriesId }); // Already here, navigate to Player
    // Use the root navigation to go to Player
    navigation.getParent()?.getParent()?.navigate("Player", {
      episodeId: firstPlayable.id,
      seriesId,
    });
  }, [episodes, navigation, seriesId, t]);

  const handleToggleFavorite = useCallback(() => {
    if (!series) return;
    toggleFavoriteMutation.mutate({
      seriesId: series.id,
      isFavorited: isFavorite,
    });
    // Optimistically toggle in store
    useFavoritesStore.getState().toggleFavorite(seriesId, {
      id: `fav-${seriesId}`,
      series_id: seriesId,
      title: series.title,
      thumbnail_url: series.poster_url,
      episode_count: series.episode_count,
      created_at: new Date().toISOString(),
    });
  }, [series, isFavorite, seriesId, toggleFavoriteMutation]);

  const handleShare = useCallback(async () => {
    if (!series) return;
    try {
      await Share.share({
        message: `${series.title} - Draama`,
      });
    } catch {
      // User cancelled
    }
  }, [series]);

  const handleEpisodePress = useCallback(
    (episode: { id: string; is_free: boolean; is_locked: boolean }) => {
      if (episode.is_locked) {
        Alert.alert(t("series.locked"), t("coins.insufficientCoins"));
        return;
      }
      navigation.getParent()?.getParent()?.navigate("Player", {
        episodeId: episode.id,
        seriesId,
      });
    },
    [navigation, seriesId, t],
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !series) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{t("common.error")}</Text>
        <Button
          title={t("common.retry")}
          onPress={() => refetch()}
          variant="outline"
          size="sm"
          style={{ marginTop: 12 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image
            source={series.banner_url ?? series.poster_url ? { uri: series.banner_url ?? series.poster_url ?? "" } : undefined}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
          />
          {/* Gradient overlay */}
          <View style={styles.heroGradientBottom} />

          {/* Back button */}
          <TouchableOpacity
            onPress={handleBack}
            style={[styles.backButton, { top: insets.top + 8 }]}
            activeOpacity={0.7}
          >
            <Text style={styles.backIcon}>{"<"}</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Title */}
          <Text style={styles.title}>{series.title}</Text>

          {/* Tags / Genre */}
          {series.tags && series.tags.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tagsRow}
              contentContainerStyle={[
                styles.tagsContent,
                I18nManager.isRTL && styles.rowReverse,
              ]}
            >
              {series.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  type="new"
                  label={I18nManager.isRTL && tag.name_ar ? tag.name_ar : tag.name}
                />
              ))}
            </ScrollView>
          )}

          {/* Episode count */}
          <Text style={styles.episodeCountText}>
            {series.episode_count} {t("series.episodes")}
          </Text>

          {/* Description */}
          {series.description && (
            <Text style={styles.description} numberOfLines={4}>
              {I18nManager.isRTL && series.description_ar
                ? series.description_ar
                : series.description}
            </Text>
          )}

          {/* Action Buttons Row */}
          <View style={styles.actionsRow}>
            <Button
              title={t("series.watchNow")}
              onPress={handleWatchNow}
              variant="primary"
              size="md"
              style={styles.watchNowButton}
            />
            <TouchableOpacity
              onPress={handleToggleFavorite}
              style={styles.iconAction}
              activeOpacity={0.7}
            >
              <Text style={[styles.heartIcon, isFavorite && styles.heartIconActive]}>
                {isFavorite ? "H" : "h"}
              </Text>
              <Text style={styles.iconLabel}>{t("series.favorite")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShare}
              style={styles.iconAction}
              activeOpacity={0.7}
            >
              <Text style={styles.shareIcon}>S</Text>
              <Text style={styles.iconLabel}>{t("series.share")}</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              onPress={() => setActiveTab("episodes")}
              style={[styles.tab, activeTab === "episodes" && styles.tabActive]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "episodes" && styles.tabTextActive,
                ]}
              >
                {t("series.episodes")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("related")}
              style={[styles.tab, activeTab === "related" && styles.tabActive]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "related" && styles.tabTextActive,
                ]}
              >
                {t("series.related")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === "episodes" ? (
            <View style={styles.episodesSection}>
              {/* Episode Range Selector */}
              {episodeRanges.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[
                    styles.rangeRow,
                    I18nManager.isRTL && styles.rowReverse,
                  ]}
                >
                  {episodeRanges.map((range, index) => (
                    <TouchableOpacity
                      key={`range-${index}`}
                      onPress={() => setSelectedRange(index)}
                      style={[
                        styles.rangePill,
                        index === selectedRange && styles.rangePillActive,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.rangePillText,
                          index === selectedRange && styles.rangePillTextActive,
                        ]}
                      >
                        {t("series.episodesRange", {
                          start: range.start,
                          end: range.end,
                        })}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Episode Grid */}
              <EpisodeGrid
                episodes={gridEpisodes}
                onEpisodePress={handleEpisodePress}
              />

              {episodes.length === 0 && (
                <View style={styles.emptyEpisodes}>
                  <Text style={styles.emptyText}>{t("common.noResults")}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.relatedSection}>
              <Text style={styles.relatedPlaceholder}>
                {t("series.related")}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 16,
  },

  // Hero
  heroContainer: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGradientBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(13,13,13,0.8)",
  },
  backButton: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  backIcon: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },

  // Content
  contentContainer: {
    marginTop: -60,
    paddingHorizontal: spacing.screenHorizontal,
  },
  title: {
    color: colors.textPrimary,
    ...typography.heroTitle,
    marginBottom: 8,
  },
  tagsRow: {
    marginBottom: 8,
    maxHeight: 32,
  },
  tagsContent: {
    gap: 8,
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
  episodeCountText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 10,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },

  // Action Buttons
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 20,
  },
  watchNowButton: {
    flex: 1,
    maxWidth: 200,
  },
  iconAction: {
    alignItems: "center",
    gap: 4,
  },
  heartIcon: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  heartIconActive: {
    color: colors.error,
  },
  shareIcon: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  iconLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "500",
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.textTertiary,
    fontSize: 15,
    fontWeight: "600",
  },
  tabTextActive: {
    color: colors.textPrimary,
  },

  // Episodes
  episodesSection: {
    marginTop: 4,
  },
  rangeRow: {
    paddingBottom: 14,
    gap: 10,
  },
  rangePill: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  rangePillActive: {
    backgroundColor: colors.accent,
  },
  rangePillText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
  rangePillTextActive: {
    color: colors.white,
    fontWeight: "600",
  },
  emptyEpisodes: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
  },

  // Related
  relatedSection: {
    paddingVertical: 40,
    alignItems: "center",
  },
  relatedPlaceholder: {
    color: colors.textTertiary,
    fontSize: 14,
  },
});
