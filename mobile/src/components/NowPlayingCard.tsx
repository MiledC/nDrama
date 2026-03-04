import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {colors, fontSizes, fontWeights, spacing, radii} from '../theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NowPlayingEpisode {
  id: string;
  number: number;
  title: string;
  duration: string;
  thumbnail: string | null;
  /** 0..1 progress through episode */
  progress: number;
}

interface NowPlayingCardProps {
  episode: NowPlayingEpisode;
  seriesId: string;
}

type Nav = NativeStackNavigationProp<RootStackParamList>;

const THUMBNAIL_WIDTH = 120;
const THUMBNAIL_HEIGHT = 68;
const PROGRESS_HEIGHT = 3;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NowPlayingCard({episode, seriesId}: NowPlayingCardProps) {
  const navigation = useNavigation<Nav>();

  const handlePress = () => {
    navigation.navigate('VideoPlayer', {
      episodeId: episode.id,
      seriesId,
    });
  };

  return (
    <View style={styles.wrapper}>
      {/* "Now Playing" badge */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {'\u064A\u0639\u0631\u0636 \u0627\u0644\u0622\u0646'}
        </Text>
      </View>

      {/* Card */}
      <Pressable style={styles.card} onPress={handlePress}>
        {/* Green accent border on the right (RTL leading) */}
        <View style={styles.accentBorder} />

        {/* Thumbnail */}
        <View style={styles.thumbnailContainer}>
          <View style={styles.thumbnail} />

          {/* Play icon overlay */}
          <View style={styles.playOverlay}>
            <Text style={styles.playIcon}>{'\u25B6'}</Text>
          </View>

          {/* Progress bar at bottom of thumbnail */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {width: `${Math.round(episode.progress * 100)}%`},
              ]}
            />
          </View>
        </View>

        {/* Episode info */}
        <View style={styles.info}>
          <Text style={styles.epLabel}>
            {'\u062D'} {episode.number}
          </Text>
          <Text style={styles.epTitle} numberOfLines={2}>
            {episode.title}
          </Text>
          <Text style={styles.duration}>{episode.duration}</Text>
        </View>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },

  /* Badge */
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.cta,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    marginBottom: spacing.sm,
  },
  badgeText: {
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    writingDirection: 'rtl',
  },

  /* Card */
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: spacing.md,
    alignItems: 'center',
    overflow: 'hidden',
  },

  /* Green right border accent (RTL leading) */
  accentBorder: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: colors.cta,
    borderTopRightRadius: radii.card,
    borderBottomRightRadius: radii.card,
  },

  /* Thumbnail */
  thumbnailContainer: {
    width: THUMBNAIL_WIDTH,
    height: THUMBNAIL_HEIGHT,
    borderRadius: radii.thumbnail,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.cardElevated,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playIcon: {
    fontSize: 20,
    color: colors.text,
  },

  /* Progress bar */
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: PROGRESS_HEIGHT,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.cta,
  },

  /* Info */
  info: {
    flex: 1,
    marginStart: spacing.md,
    writingDirection: 'rtl',
  },
  epLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    color: colors.cta,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  epTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
    color: colors.text,
    marginTop: 2,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  duration: {
    fontSize: fontSizes.caption,
    color: colors.textDim,
    marginTop: spacing.xs,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
});
