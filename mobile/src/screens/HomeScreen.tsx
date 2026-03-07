import React from 'react';
import {ScrollView, StyleSheet, StatusBar, View, Text, ActivityIndicator} from 'react-native';
import {colors, spacing, fontSizes} from '../theme';
import DailyRewardBanner from '../components/DailyRewardBanner';
import HeroBanner from '../components/HeroBanner';
import ContinueWatchingRow from '../components/ContinueWatchingRow';
import CategoryRow from '../components/CategoryRow';
import {SeriesData} from '../components/SeriesCard';
import {useHomeSections} from '../hooks';
import type {HomeSectionItem} from '../types/api';

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Map API HomeSectionItem to UI SeriesData shape.
 */
function mapToSeriesData(item: HomeSectionItem, isNew: boolean = false): SeriesData {
  return {
    id: item.id,
    title: item.title,
    thumbnail: item.thumbnail_url,
    genreTags: [], // Tags not included in home section items
    episodeCount: item.episode_count,
    viewCount: '', // View count not available in home section items
    isNew: isNew,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HomeScreen() {
  const {data: sections, isLoading, error} = useHomeSections();

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.cta} />
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>حدث خطأ في تحميل المحتوى</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
      </View>
    );
  }

  // Process sections data
  const featuredSection = sections?.find(s => s.type === 'featured');
  const otherSections = sections?.filter(s => s.type !== 'featured') || [];

  // Map all featured items for hero banner carousel
  const heroItems = featuredSection?.items.map(item => ({
    id: item.id,
    title: item.title,
    thumbnail_url: item.thumbnail_url,
    genreTags: [], // Tags not available in home section items
  })) || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Daily reward banner — dismissable per session */}
      <DailyRewardBanner />

      {/* Hero featured series carousel */}
      {heroItems.length > 0 && <HeroBanner featured={heroItems} />}

      {/* Continue watching - only show if we have data (empty for now) */}
      {/* TODO: Integrate with watch history API when available */}
      <ContinueWatchingRow items={[]} />

      {/* Render other sections as category rows */}
      {otherSections.map((section) => {
        const seriesItems = section.items.map(item =>
          mapToSeriesData(item, section.type === 'new_releases')
        );

        // Add special styling for trending section
        const isTrending = section.type === 'trending';

        return (
          <CategoryRow
            key={section.id}
            title={isTrending ? `${section.title} 🔥` : section.title}
            showLiveDot={isTrending}
            liveCount={isTrending ? "2.4K يشاهدون الآن" : undefined}
            series={seriesItems}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  contentContainer: {
    paddingBottom: spacing.section * 2,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    color: colors.text,
    fontSize: fontSizes.cardTitle,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorSubtext: {
    color: colors.textMuted,
    fontSize: fontSizes.caption,
    textAlign: 'center',
  },
});
