import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {colors, fontSizes, fontWeights, spacing, radii, sizes} from '../theme';
import EpisodeGrid, {EpisodeData} from '../components/EpisodeGrid';
import NowPlayingCard, {NowPlayingEpisode} from '../components/NowPlayingCard';
import {useSeriesDetail} from '../hooks';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = NativeStackScreenProps<RootStackParamList, 'SeriesDetail'>;

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const HERO_HEIGHT_RATIO = 0.4;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Back button circle */
function HeaderButton({
  onPress,
  children,
  side,
}: {
  onPress: () => void;
  children: React.ReactNode;
  side: 'start' | 'end';
}) {
  return (
    <Pressable
      style={[
        styles.headerButton,
        side === 'start' ? styles.headerButtonStart : styles.headerButtonEnd,
      ]}
      onPress={onPress}
      hitSlop={8}>
      {children}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function SeriesDetailScreen({navigation, route}: Props) {
  const insets = useSafeAreaInsets();
  const [descExpanded, setDescExpanded] = useState(false);
  const [inMyList, setInMyList] = useState(false);

  const seriesId = route.params.seriesId;
  const {data: series, isLoading, error} = useSeriesDetail(seriesId);

  const heroHeight = Dimensions.get('window').height * HERO_HEIGHT_RATIO;

  // Map API episodes to EpisodeData format
  const episodes = useMemo((): EpisodeData[] => {
    if (!series?.episodes) return [];

    // Find the first non-free, unlocked episode to mark as current
    let currentEpisodeIndex = -1;
    for (let i = 0; i < series.episodes.length; i++) {
      const ep = series.episodes[i];
      if (!ep.is_free && ep.is_unlocked) {
        currentEpisodeIndex = i;
        break;
      }
    }

    return series.episodes.map((ep, index) => {
      let state: EpisodeData['state'];

      if (ep.is_free) {
        state = 'free';
      } else if (ep.is_unlocked) {
        // This is the current episode if it's the first non-free unlocked one
        state = index === currentEpisodeIndex ? 'current' : 'watched';
      } else {
        state = 'locked';
      }

      return {
        id: ep.id,
        number: ep.episode_number,
        state,
        coinCost: state === 'locked' ? series.coin_cost_per_episode : undefined,
      };
    });
  }, [series]);

  // Progress info for CTA
  const currentEp = useMemo(
    () => episodes.find(e => e.state === 'current'),
    [episodes],
  );

  // Map tags to genre pills
  const genreTags = useMemo(
    () => series?.tags?.map(tag => tag.name) || [],
    [series],
  );

  // Create now playing episode data if we have a current episode
  const nowPlayingEpisode = useMemo((): NowPlayingEpisode | null => {
    if (!currentEp || !series) return null;

    const apiEpisode = series.episodes.find(
      ep => ep.episode_number === currentEp.number,
    );

    if (!apiEpisode || !apiEpisode.duration_seconds) return null;

    const minutes = Math.floor(apiEpisode.duration_seconds / 60);
    const seconds = apiEpisode.duration_seconds % 60;
    const duration = `${minutes}:${String(seconds).padStart(2, '0')}`;

    return {
      id: apiEpisode.id,
      number: apiEpisode.episode_number,
      title: apiEpisode.title,
      duration,
      thumbnail: apiEpisode.thumbnail_url,
      progress: 0.35, // This would come from watch progress tracking
    };
  }, [currentEp, series]);

  // Derived display data
  const totalEpisodes = series?.episodes.length || 0;
  const freeEpisodes = series?.free_episode_count || 0;
  const coinCostPerEpisode = series?.coin_cost_per_episode || 0;

  // Calculate completion rate from unlocked episodes
  const completionRate = useMemo(() => {
    if (!episodes.length) return 0;
    const unlockedCount = episodes.filter(
      ep => ep.state === 'watched' || ep.state === 'current' || ep.state === 'free'
    ).length;
    return Math.round((unlockedCount / episodes.length) * 100);
  }, [episodes]);

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <ActivityIndicator size="large" color={colors.cta} />
      </View>
    );
  }

  // Error or not found state
  if (error || !series) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <Text style={styles.errorText}>
          {error?.message || 'المسلسل غير موجود'}
        </Text>
        <Pressable style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>رجوع</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* ---------------------------------------------------------------- */}
        {/* Hero Section */}
        {/* ---------------------------------------------------------------- */}
        <View style={[styles.hero, {height: heroHeight}]}>
          {/* Banner placeholder */}
          <View style={styles.heroBanner} />

          {/* Gradient overlay */}
          <View style={styles.heroGradientTop} />
          <View style={styles.heroGradientBottom} />

          {/* Top buttons */}
          <View style={[styles.headerRow, {paddingTop: insets.top + spacing.sm}]}>
            <HeaderButton side="end" onPress={() => navigation.goBack()}>
              <Text style={styles.headerIcon}>{'\u276E'}</Text>
            </HeaderButton>
            <HeaderButton
              side="start"
              onPress={() =>
                navigation.navigate('ShareRate', {seriesId: series.id})
              }>
              <Text style={styles.headerIcon}>{'\u2197'}</Text>
            </HeaderButton>
          </View>

          {/* Hero content */}
          <View style={styles.heroContent}>
            {/* Title */}
            <Text style={styles.heroTitle} numberOfLines={2}>
              {series.title}
            </Text>

            {/* Genre pills */}
            <View style={styles.genreRow}>
              {genreTags.map(tag => (
                <View key={tag} style={styles.genrePill}>
                  <Text style={styles.genrePillText}>{tag}</Text>
                </View>
              ))}
            </View>

            {/* Metadata row */}
            <Text style={styles.metaText}>
              {series.episodes.length} {'\u062D\u0644\u0642\u0629'}
            </Text>

            {/* Social proof - We'll show episode count for now */}
            <Text style={styles.socialProof}>
              {series.free_episode_count} {'\u062D\u0644\u0642\u0627\u062A \u0645\u062C\u0627\u0646\u064A\u0629'}
            </Text>
          </View>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Content below hero */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.content}>
          {/* Free episodes pill */}
          {freeEpisodes > 0 && (
            <View style={styles.freeEpPill}>
              <Text style={styles.freeEpText}>
                {'\u0623\u0648\u0644'} {freeEpisodes}{' '}
                {'\u062D\u0644\u0642\u0627\u062A \u0645\u062C\u0627\u0646\u064A\u0629'}
              </Text>
            </View>
          )}

          {/* Description */}
          {series.description && (
            <Pressable onPress={() => setDescExpanded(prev => !prev)}>
              <Text
                style={styles.description}
                numberOfLines={descExpanded ? undefined : 3}>
                {series.description}
              </Text>
              {!descExpanded && series.description.length > 200 && (
                <Text style={styles.moreToggle}>
                  {'\u0627\u0644\u0645\u0632\u064A\u062F'}
                </Text>
              )}
            </Pressable>
          )}

          {/* Completion stat */}
          {completionRate > 0 && (
            <View style={styles.completionRow}>
              <View style={styles.completionBar}>
                <View
                  style={[
                    styles.completionFill,
                    {width: `${completionRate}%`},
                  ]}
                />
              </View>
              <Text style={styles.completionText}>
                {completionRate}%{' '}
                {'\u0645\u0646 \u0627\u0644\u0645\u0634\u0627\u0647\u062F\u064A\u0646 \u0623\u0643\u0645\u0644\u0648\u0627 \u0647\u0630\u0627 \u0627\u0644\u0645\u0633\u0644\u0633\u0644'}
              </Text>
            </View>
          )}

          {/* ---- Action buttons ---- */}
          <Pressable style={styles.ctaButton}>
            <Text style={styles.ctaIcon}>{'\u25B6'}</Text>
            <Text style={styles.ctaText}>
              {currentEp
                ? `\u0623\u0643\u0645\u0644 \u062D ${currentEp.number}`
                : '\u0634\u0627\u0647\u062F \u0627\u0644\u0622\u0646'}
            </Text>
          </Pressable>

          {currentEp && (
            <Text style={styles.progressSubtext}>
              {currentEp.number} {'\u0645\u0646'} {totalEpisodes}{' '}
              {'\u062D\u0644\u0642\u0629'}
            </Text>
          )}

          {/* Secondary actions row */}
          <View style={styles.secondaryActions}>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => setInMyList(prev => !prev)}>
              <Text
                style={[
                  styles.secondaryIcon,
                  inMyList && styles.secondaryIconActive,
                ]}>
                {inMyList ? '\u2665' : '\u2661'}
              </Text>
              <Text style={styles.secondaryLabel}>
                {'\u0642\u0627\u0626\u0645\u062A\u064A'}
              </Text>
            </Pressable>

            <Pressable style={styles.secondaryButton}>
              <Text style={styles.secondaryIcon}>{'\u2606'}</Text>
              <Text style={styles.secondaryLabel}>
                {'\u062A\u0642\u064A\u064A\u0645'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() =>
                navigation.navigate('ShareRate', {seriesId: series.id})
              }>
              <Text style={styles.secondaryIcon}>{'\u2197'}</Text>
              <Text style={styles.secondaryLabel}>
                {'\u0645\u0634\u0627\u0631\u0643\u0629'}
              </Text>
            </Pressable>
          </View>

          {/* Monetization banner */}
          <View style={styles.monetBanner}>
            <View style={styles.monetLeft}>
              <Text style={styles.coinIcon}>{'\uD83E\uDE99'}</Text>
              <Text style={styles.monetText}>
                {'\u0623\u0648\u0644'} {freeEpisodes}{' '}
                {'\u062D\u0644\u0642\u0627\u062A \u0645\u062C\u0627\u0646\u064A\u0629\u060C \u062B\u0645'}{' '}
                {coinCostPerEpisode}{' '}
                {'\u0639\u0645\u0644\u0627\u062A \u0644\u0643\u0644 \u062D\u0644\u0642\u0629'}
              </Text>
            </View>
            <Pressable onPress={() => navigation.navigate('CoinStore')}>
              <Text style={styles.getCoinsText}>
                {'\u0627\u062D\u0635\u0644 \u0639\u0644\u0649 \u0639\u0645\u0644\u0627\u062A'}
              </Text>
            </Pressable>
          </View>

          {/* ---- Episode grid ---- */}
          <View style={styles.sectionSpacing}>
            <EpisodeGrid
              episodes={episodes}
              seriesId={series.id}
            />
          </View>

          {/* ---- Now Playing card ---- */}
          {nowPlayingEpisode && (
            <NowPlayingCard episode={nowPlayingEpisode} seriesId={series.id} />
          )}

          {/* Bottom spacer */}
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.section * 2,
  },

  /* ---- Loading & Error states ---- */
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
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    fontSize: fontSizes.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
    writingDirection: 'rtl',
  },
  retryButton: {
    backgroundColor: colors.cta,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
  },
  retryText: {
    fontSize: fontSizes.button,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    writingDirection: 'rtl',
  },

  /* ---- Hero ---- */
  hero: {
    width: SCREEN_WIDTH,
    position: 'relative',
    overflow: 'hidden',
  },
  heroBanner: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.cardElevated,
  },
  heroGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  heroGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: colors.bg,
    opacity: 0.95,
  },

  /* Header buttons */
  headerRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    zIndex: 10,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonStart: {},
  headerButtonEnd: {},
  headerIcon: {
    fontSize: 16,
    color: colors.text,
  },

  /* Hero content */
  heroContent: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 5,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: fontWeights.bold,
    color: colors.text,
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    justifyContent: 'flex-start',
  },
  genrePill: {
    backgroundColor: colors.cardElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  genrePillText: {
    fontSize: fontSizes.tabLabel,
    color: colors.text,
    writingDirection: 'rtl',
  },
  metaText: {
    fontSize: 13,
    color: colors.textMuted,
    writingDirection: 'rtl',
    marginBottom: 2,
  },
  socialProof: {
    fontSize: fontSizes.caption,
    color: colors.textDim,
    writingDirection: 'rtl',
  },

  /* ---- Content below hero ---- */
  content: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },

  /* Free episodes pill */
  freeEpPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.ctaGlow,
    borderColor: colors.cta,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    marginBottom: spacing.md,
  },
  freeEpText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    color: colors.cta,
    writingDirection: 'rtl',
  },

  /* Description */
  description: {
    fontSize: fontSizes.body,
    color: colors.textMuted,
    lineHeight: 22,
    writingDirection: 'rtl',
  },
  moreToggle: {
    fontSize: fontSizes.body,
    color: colors.text,
    fontWeight: fontWeights.medium,
    writingDirection: 'rtl',
    marginTop: 2,
  },

  /* Completion stat */
  completionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    justifyContent: 'flex-start',
    gap: spacing.sm,
  },
  completionBar: {
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  completionFill: {
    height: '100%',
    backgroundColor: colors.cta,
    borderRadius: 2,
  },
  completionText: {
    fontSize: fontSizes.caption,
    color: colors.textDim,
    fontStyle: 'italic',
    writingDirection: 'rtl',
    flex: 1,
  },

  /* CTA button */
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cta,
    height: sizes.buttonHeight,
    borderRadius: radii.pill,
    gap: spacing.sm,
  },
  ctaIcon: {
    fontSize: 14,
    color: colors.text,
  },
  ctaText: {
    fontSize: fontSizes.button,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    writingDirection: 'rtl',
  },
  progressSubtext: {
    fontSize: fontSizes.caption,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: spacing.xs,
    writingDirection: 'rtl',
  },

  /* Secondary actions */
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  secondaryButton: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  secondaryIcon: {
    fontSize: 20,
    color: colors.textMuted,
  },
  secondaryIconActive: {
    color: colors.cta,
  },
  secondaryLabel: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },

  /* Monetization banner */
  monetBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: spacing.md,
    marginBottom: spacing.section,
  },
  monetLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  coinIcon: {
    fontSize: 16,
  },
  monetText: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
    writingDirection: 'rtl',
    flex: 1,
  },
  getCoinsText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    color: colors.coin,
    writingDirection: 'rtl',
  },

  /* Section spacing */
  sectionSpacing: {
    marginHorizontal: -spacing.lg, // full-bleed since EpisodeGrid has its own padding
  },

  /* Bottom spacer */
  bottomSpacer: {
    height: spacing.section,
  },
});
