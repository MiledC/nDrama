import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {colors, fontSizes, fontWeights, spacing, radii, sizes} from '../theme';
import EpisodeGrid, {EpisodeData} from '../components/EpisodeGrid';
import NowPlayingCard, {NowPlayingEpisode} from '../components/NowPlayingCard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = NativeStackScreenProps<RootStackParamList, 'SeriesDetail'>;

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const HERO_HEIGHT_RATIO = 0.4;

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const TOTAL_EPISODES = 78;
const FREE_EPISODES = 5;
const WATCHED_THROUGH = 30;
const CURRENT_EPISODE = 31;

interface MockSeries {
  id: string;
  title: string;
  description: string;
  genreTags: string[];
  year: string;
  ageRating: string;
  totalEpisodes: number;
  freeEpisodes: number;
  rating: number;
  viewCount: string;
  completionRate: number;
  coinCostPerEpisode: number;
}

const MOCK_SERIES: MockSeries = {
  id: 'series-1',
  title: '\u0639\u0627\u0635\u0641\u0629 \u0627\u0644\u0635\u062D\u0631\u0627\u0621',
  description:
    '\u062F\u0631\u0627\u0645\u0627 \u0645\u0634\u0648\u0642\u0629 \u062A\u062F\u0648\u0631 \u0623\u062D\u062F\u0627\u062B\u0647\u0627 \u0641\u064A \u0642\u0644\u0628 \u0627\u0644\u0635\u062D\u0631\u0627\u0621 \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629\u060C \u062D\u064A\u062B \u062A\u062A\u0634\u0627\u0628\u0643 \u0645\u0635\u0627\u0626\u0631 \u0639\u0627\u0626\u0644\u0627\u062A \u0645\u062A\u0646\u0627\u0641\u0633\u0629 \u0641\u064A \u0635\u0631\u0627\u0639 \u0639\u0644\u0649 \u0627\u0644\u0633\u0644\u0637\u0629 \u0648\u0627\u0644\u062B\u0631\u0648\u0629. \u062A\u062A\u0628\u0639 \u0627\u0644\u0642\u0635\u0629 \u0631\u062D\u0644\u0629 \u0634\u0627\u0628 \u064A\u0643\u062A\u0634\u0641 \u0623\u0633\u0631\u0627\u0631 \u0639\u0627\u0626\u0644\u062A\u0647 \u0627\u0644\u0645\u062E\u0641\u064A\u0629 \u0648\u064A\u0648\u0627\u062C\u0647 \u062E\u064A\u0627\u0631\u0627\u062A \u0635\u0639\u0628\u0629 \u0628\u064A\u0646 \u0627\u0644\u062D\u0628 \u0648\u0627\u0644\u0648\u0641\u0627\u0621 \u0648\u0627\u0644\u0637\u0645\u0648\u062D.',
  genreTags: ['\u062F\u0631\u0627\u0645\u0627', '\u0631\u0648\u0645\u0627\u0646\u0633\u064A\u0629', '2024'],
  year: '2024',
  ageRating: '16+',
  totalEpisodes: TOTAL_EPISODES,
  freeEpisodes: FREE_EPISODES,
  rating: 4.8,
  viewCount: '450K',
  completionRate: 85,
  coinCostPerEpisode: 5,
};

/** Generate 78 mock episodes */
function generateEpisodes(): EpisodeData[] {
  const episodes: EpisodeData[] = [];
  for (let i = 1; i <= TOTAL_EPISODES; i++) {
    let state: EpisodeData['state'];
    if (i <= WATCHED_THROUGH) {
      state = 'watched';
    } else if (i === CURRENT_EPISODE) {
      state = 'current';
    } else if (i <= FREE_EPISODES) {
      // Free episodes that haven't been watched yet (edge case in mock — all free are watched)
      state = 'free';
    } else if (i > WATCHED_THROUGH && i <= FREE_EPISODES) {
      state = 'free';
    } else if (i > CURRENT_EPISODE) {
      state = 'locked';
    } else {
      state = 'free';
    }
    episodes.push({
      id: `ep-${i}`,
      number: i,
      state,
      coinCost: state === 'locked' ? MOCK_SERIES.coinCostPerEpisode : undefined,
    });
  }
  return episodes;
}

const MOCK_EPISODES = generateEpisodes();

const NOW_PLAYING: NowPlayingEpisode = {
  id: `ep-${CURRENT_EPISODE}`,
  number: CURRENT_EPISODE,
  title: '\u0627\u0644\u0645\u0648\u0627\u062C\u0647\u0629 \u0627\u0644\u0643\u0628\u0631\u0649',
  duration: '2:04',
  thumbnail: null,
  progress: 0.35,
};

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

export default function SeriesDetailScreen({navigation}: Props) {
  const insets = useSafeAreaInsets();
  const [descExpanded, setDescExpanded] = useState(false);
  const [inMyList, setInMyList] = useState(false);

  const series = MOCK_SERIES;
  const heroHeight = Dimensions.get('window').height * HERO_HEIGHT_RATIO;

  // Progress info for CTA
  const currentEp = useMemo(
    () => MOCK_EPISODES.find(e => e.state === 'current'),
    [],
  );

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
              {series.genreTags.map(tag => (
                <View key={tag} style={styles.genrePill}>
                  <Text style={styles.genrePillText}>{tag}</Text>
                </View>
              ))}
            </View>

            {/* Metadata row */}
            <Text style={styles.metaText}>
              {series.totalEpisodes} {'\u062D\u0644\u0642\u0629'} {'\u00B7'} {series.year}{' '}
              {'\u00B7'} {series.ageRating}
            </Text>

            {/* Social proof */}
            <Text style={styles.socialProof}>
              {'\u0634\u0627\u0647\u062F\u0647'} {series.viewCount}{' '}
              {'\u0645\u0634\u0627\u0647\u062F'}
            </Text>
          </View>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Content below hero */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.content}>
          {/* Free episodes pill */}
          <View style={styles.freeEpPill}>
            <Text style={styles.freeEpText}>
              {'\u0623\u0648\u0644'} {series.freeEpisodes}{' '}
              {'\u062D\u0644\u0642\u0627\u062A \u0645\u062C\u0627\u0646\u064A\u0629'}
            </Text>
          </View>

          {/* Description */}
          <Pressable onPress={() => setDescExpanded(prev => !prev)}>
            <Text
              style={styles.description}
              numberOfLines={descExpanded ? undefined : 3}>
              {series.description}
            </Text>
            {!descExpanded && (
              <Text style={styles.moreToggle}>
                {'\u0627\u0644\u0645\u0632\u064A\u062F'}
              </Text>
            )}
          </Pressable>

          {/* Completion stat */}
          <View style={styles.completionRow}>
            <View style={styles.completionBar}>
              <View
                style={[
                  styles.completionFill,
                  {width: `${series.completionRate}%`},
                ]}
              />
            </View>
            <Text style={styles.completionText}>
              {series.completionRate}%{' '}
              {'\u0645\u0646 \u0627\u0644\u0645\u0634\u0627\u0647\u062F\u064A\u0646 \u0623\u0643\u0645\u0644\u0648\u0627 \u0647\u0630\u0627 \u0627\u0644\u0645\u0633\u0644\u0633\u0644'}
            </Text>
          </View>

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
              {currentEp.number} {'\u0645\u0646'} {series.totalEpisodes}{' '}
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
                {'\u0623\u0648\u0644'} {series.freeEpisodes}{' '}
                {'\u062D\u0644\u0642\u0627\u062A \u0645\u062C\u0627\u0646\u064A\u0629\u060C \u062B\u0645'}{' '}
                {series.coinCostPerEpisode}{' '}
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
              episodes={MOCK_EPISODES}
              seriesId={series.id}
            />
          </View>

          {/* ---- Now Playing card ---- */}
          <NowPlayingCard episode={NOW_PLAYING} seriesId={series.id} />

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
