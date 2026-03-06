import React from 'react';
import {ScrollView, StyleSheet, StatusBar} from 'react-native';
import {colors, spacing} from '../theme';
import DailyRewardBanner from '../components/DailyRewardBanner';
import HeroBanner from '../components/HeroBanner';
import ContinueWatchingRow from '../components/ContinueWatchingRow';
import CategoryRow from '../components/CategoryRow';
import {SeriesData} from '../components/SeriesCard';
import {ContinueWatchingItem} from '../components/ContinueWatchingRow';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const FEATURED_SERIES = {
  id: 'featured-1',
  title: 'عاصفة الصحراء',
  genreTags: ['دراما', 'تشويق', 'رومانسية'],
};

const CONTINUE_WATCHING: ContinueWatchingItem[] = [
  {
    id: 'cw-1',
    seriesId: 's1',
    title: 'ظل الماضي',
    thumbnail: null,
    currentEp: 34,
    totalEps: 78,
    progress: 0.65,
  },
  {
    id: 'cw-2',
    seriesId: 's2',
    title: 'نبضات القلب',
    thumbnail: null,
    currentEp: 12,
    totalEps: 50,
    progress: 0.3,
  },
  {
    id: 'cw-3',
    seriesId: 's3',
    title: 'أسرار الليل',
    thumbnail: null,
    currentEp: 45,
    totalEps: 60,
    progress: 0.85,
  },
  {
    id: 'cw-4',
    seriesId: 's4',
    title: 'رحلة العمر',
    thumbnail: null,
    currentEp: 8,
    totalEps: 40,
    progress: 0.2,
  },
];

const TRENDING_SERIES: SeriesData[] = [
  {
    id: 't1',
    title: 'صراع العروش',
    thumbnail: null,
    genreTags: ['دراما', 'أكشن'],
    episodeCount: 78,
    viewCount: '1.2M',
    isNew: false,
  },
  {
    id: 't2',
    title: 'قلوب متحدة',
    thumbnail: null,
    genreTags: ['رومانسية'],
    episodeCount: 52,
    viewCount: '890K',
    isNew: true,
  },
  {
    id: 't3',
    title: 'لعبة الأقدار',
    thumbnail: null,
    genreTags: ['تشويق', 'غموض'],
    episodeCount: 65,
    viewCount: '2.1M',
    isNew: false,
  },
  {
    id: 't4',
    title: 'وعد الصباح',
    thumbnail: null,
    genreTags: ['دراما'],
    episodeCount: 40,
    viewCount: '650K',
    isNew: false,
  },
  {
    id: 't5',
    title: 'أمل جديد',
    thumbnail: null,
    genreTags: ['رومانسية', 'دراما'],
    episodeCount: 30,
    viewCount: '430K',
    isNew: true,
  },
];

const NEW_RELEASES: SeriesData[] = [
  {
    id: 'n1',
    title: 'سر المدينة',
    thumbnail: null,
    genreTags: ['غموض'],
    episodeCount: 24,
    viewCount: '320K',
    isNew: true,
  },
  {
    id: 'n2',
    title: 'حكايات الشرق',
    thumbnail: null,
    genreTags: ['دراما', 'تاريخي'],
    episodeCount: 36,
    viewCount: '510K',
    isNew: true,
  },
  {
    id: 'n3',
    title: 'طريق النجاح',
    thumbnail: null,
    genreTags: ['دراما'],
    episodeCount: 18,
    viewCount: '180K',
    isNew: true,
  },
  {
    id: 'n4',
    title: 'أحلام بعيدة',
    thumbnail: null,
    genreTags: ['رومانسية'],
    episodeCount: 42,
    viewCount: '720K',
    isNew: true,
  },
  {
    id: 'n5',
    title: 'ضوء القمر',
    thumbnail: null,
    genreTags: ['خيال'],
    episodeCount: 28,
    viewCount: '290K',
    isNew: true,
  },
];

const DRAMA_SERIES: SeriesData[] = [
  {
    id: 'd1',
    title: 'دموع الورد',
    thumbnail: null,
    genreTags: ['دراما', 'رومانسية'],
    episodeCount: 60,
    viewCount: '1.5M',
    isNew: false,
  },
  {
    id: 'd2',
    title: 'ميراث العائلة',
    thumbnail: null,
    genreTags: ['دراما'],
    episodeCount: 80,
    viewCount: '2.3M',
    isNew: false,
  },
  {
    id: 'd3',
    title: 'بين الحب والحرب',
    thumbnail: null,
    genreTags: ['دراما', 'أكشن'],
    episodeCount: 55,
    viewCount: '980K',
    isNew: false,
  },
  {
    id: 'd4',
    title: 'أيام الشباب',
    thumbnail: null,
    genreTags: ['كوميديا', 'دراما'],
    episodeCount: 45,
    viewCount: '750K',
    isNew: false,
  },
  {
    id: 'd5',
    title: 'عهد الوفاء',
    thumbnail: null,
    genreTags: ['دراما'],
    episodeCount: 70,
    viewCount: '1.8M',
    isNew: false,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HomeScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Daily reward banner — dismissable per session */}
      <DailyRewardBanner />

      {/* Hero featured series */}
      <HeroBanner featured={FEATURED_SERIES} />

      {/* Continue watching */}
      <ContinueWatchingRow items={CONTINUE_WATCHING} />

      {/* Trending */}
      <CategoryRow
        title={'الأكثر رواجاً 🔥'}
        showLiveDot
        liveCount="2.4K يشاهدون الآن"
        series={TRENDING_SERIES}
      />

      {/* New releases */}
      <CategoryRow
        title="إصدارات جديدة"
        series={NEW_RELEASES}
      />

      {/* Drama category */}
      <CategoryRow
        title="دراما"
        series={DRAMA_SERIES}
      />
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
});
