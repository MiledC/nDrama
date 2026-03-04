import React, {useState, useMemo, useCallback, useRef, useEffect} from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {colors, fontSizes, fontWeights, spacing, radii, sizes} from '../theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EpisodeState = 'watched' | 'current' | 'free' | 'locked';

export interface EpisodeData {
  id: string;
  number: number;
  state: EpisodeState;
  coinCost?: number;
}

interface EpisodeGridProps {
  episodes: EpisodeData[];
  seriesId: string;
  /** Number of episodes per range selector chunk */
  chunkSize?: number;
}

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SQUARE = sizes.episodeSquare;
const GAP = spacing.sm;

// ---------------------------------------------------------------------------
// Pulsing dot for "current" episode
// ---------------------------------------------------------------------------

function PulsingIndicator() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.pulsingDot, {opacity}]} />
  );
}

// ---------------------------------------------------------------------------
// Single episode square
// ---------------------------------------------------------------------------

interface EpisodeSquareProps {
  episode: EpisodeData;
  seriesId: string;
}

function EpisodeSquare({episode, seriesId}: EpisodeSquareProps) {
  const navigation = useNavigation<Nav>();

  const handlePress = useCallback(() => {
    if (episode.state === 'locked') {
      navigation.navigate('LockedEpisode', {
        episodeId: episode.id,
        coinCost: episode.coinCost ?? 5,
      });
    } else {
      navigation.navigate('VideoPlayer', {
        episodeId: episode.id,
        seriesId,
      });
    }
  }, [navigation, episode, seriesId]);

  const squareStyle = useMemo(() => {
    switch (episode.state) {
      case 'watched':
        return styles.squareWatched;
      case 'current':
        return styles.squareCurrent;
      case 'locked':
        return styles.squareLocked;
      case 'free':
      default:
        return styles.squareFree;
    }
  }, [episode.state]);

  const numberStyle = useMemo(() => {
    switch (episode.state) {
      case 'locked':
        return styles.numberLocked;
      default:
        return styles.numberDefault;
    }
  }, [episode.state]);

  return (
    <Pressable
      style={[styles.square, squareStyle]}
      onPress={handlePress}
      accessibilityLabel={`Episode ${episode.number}`}
      accessibilityHint={
        episode.state === 'locked'
          ? 'Locked episode, tap to unlock'
          : 'Tap to play'
      }>
      {/* Checkmark for watched */}
      {episode.state === 'watched' && (
        <Text style={styles.checkmark}>{'\u2713'}</Text>
      )}

      {/* Lock icon for locked */}
      {episode.state === 'locked' && (
        <View style={styles.lockIconContainer}>
          <Text style={styles.lockIcon}>{'\uD83D\uDD12'}</Text>
        </View>
      )}

      {/* Pulsing indicator for current */}
      {episode.state === 'current' && <PulsingIndicator />}

      {/* Episode number */}
      <Text style={[styles.episodeNumber, numberStyle]}>
        {episode.number}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function EpisodeGrid({
  episodes,
  seriesId,
  chunkSize = 20,
}: EpisodeGridProps) {
  // Build range chunks
  const totalEpisodes = episodes.length;
  const ranges = useMemo(() => {
    const result: {label: string; start: number; end: number}[] = [];
    for (let i = 0; i < totalEpisodes; i += chunkSize) {
      const start = i + 1;
      const end = Math.min(i + chunkSize, totalEpisodes);
      result.push({label: `${start}-${end}`, start, end});
    }
    return result;
  }, [totalEpisodes, chunkSize]);

  // Find the range containing the current episode, default to first
  const initialRange = useMemo(() => {
    const currentEp = episodes.find(e => e.state === 'current');
    if (!currentEp) return 0;
    return ranges.findIndex(
      r => currentEp.number >= r.start && currentEp.number <= r.end,
    );
  }, [episodes, ranges]);

  const [activeRange, setActiveRange] = useState(
    initialRange >= 0 ? initialRange : 0,
  );

  // Get episodes in active range
  const visibleEpisodes = useMemo(() => {
    const range = ranges[activeRange];
    if (!range) return [];
    return episodes.filter(
      e => e.number >= range.start && e.number <= range.end,
    );
  }, [episodes, ranges, activeRange]);

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>{'\u0627\u0644\u062D\u0644\u0642\u0627\u062A'}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{totalEpisodes}</Text>
        </View>
      </View>

      {/* Range selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rangeRow}>
        {ranges.map((range, index) => (
          <Pressable
            key={range.label}
            style={[
              styles.rangePill,
              index === activeRange && styles.rangePillActive,
            ]}
            onPress={() => setActiveRange(index)}>
            <Text
              style={[
                styles.rangePillText,
                index === activeRange && styles.rangePillTextActive,
              ]}>
              {range.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Episode grid */}
      <View style={styles.grid}>
        {visibleEpisodes.map(episode => (
          <EpisodeSquare
            key={episode.id}
            episode={episode}
            seriesId={seriesId}
          />
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    writingDirection: 'rtl',
  },
  sectionTitle: {
    fontSize: fontSizes.sectionTitle - 2, // 18px per spec
    fontWeight: fontWeights.bold,
    color: colors.text,
    writingDirection: 'rtl',
  },
  countBadge: {
    backgroundColor: colors.cardElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    marginStart: spacing.sm,
  },
  countBadgeText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
    color: colors.text,
  },

  /* Range selector */
  rangeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingVertical: spacing.xs,
  },
  rangePill: {
    backgroundColor: colors.cardElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  rangePillActive: {
    backgroundColor: colors.cta,
  },
  rangePillText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
    color: colors.text,
  },
  rangePillTextActive: {
    color: colors.text,
    fontWeight: fontWeights.bold,
  },

  /* Grid */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },

  /* Individual squares */
  square: {
    width: SQUARE,
    height: SQUARE,
    borderRadius: radii.thumbnail,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  squareWatched: {
    backgroundColor: colors.episodeWatchedBg,
    borderWidth: 1,
    borderColor: colors.episodeWatched,
  },
  squareCurrent: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.episodeCurrent,
    // Glow effect approximated with shadow
    shadowColor: colors.episodeCurrent,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  squareFree: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.episodeFree,
  },
  squareLocked: {
    backgroundColor: colors.episodeLockedBg,
    borderWidth: 1,
    borderColor: colors.episodeLocked,
  },

  /* Episode number text */
  episodeNumber: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
  numberDefault: {
    color: colors.text,
  },
  numberLocked: {
    color: colors.episodeLocked,
  },

  /* Watched checkmark */
  checkmark: {
    position: 'absolute',
    top: 2,
    end: 4,
    fontSize: 8,
    color: colors.text,
    fontWeight: fontWeights.bold,
  },

  /* Lock icon */
  lockIconContainer: {
    position: 'absolute',
    top: 2,
    start: 4,
  },
  lockIcon: {
    fontSize: 8,
    color: colors.episodeLocked,
  },

  /* Pulsing dot for current episode */
  pulsingDot: {
    position: 'absolute',
    top: 4,
    end: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.episodeCurrent,
  },
});
