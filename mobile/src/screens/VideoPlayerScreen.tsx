import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import {colors, fontSizes, fontWeights, spacing, radii} from '../theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = NativeStackScreenProps<RootStackParamList, 'VideoPlayer'>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const CONTROLS_HIDE_DELAY = 3000;
const PLAYBACK_DURATION_MS = 10000; // 10 seconds mock playback
const PROGRESS_INTERVAL_MS = 100;
const AUTO_NEXT_COUNTDOWN = 5;
const TOTAL_EPISODES = 78;

// Mock episode data
const EPISODES = [
  {number: 31, title: 'العاصفة'},
  {number: 32, title: 'الكشف'},
  {number: 33, title: 'المواجهة'},
];

// Intro ends at 20% of progress
const INTRO_END = 0.2;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format seconds to mm:ss */
function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const VideoPlayerScreen: React.FC<Props> = ({navigation, route}) => {

  // Episode state
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const currentEpisode = EPISODES[currentEpisodeIndex];
  const nextEpisode = EPISODES[currentEpisodeIndex + 1] ?? EPISODES[0];

  // Playback state
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showAutoNext, setShowAutoNext] = useState(false);
  const [autoNextCountdown, setAutoNextCountdown] = useState(AUTO_NEXT_COUNTDOWN);

  // Animated opacity for controls overlay
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---------------------------------------------------------------------------
  // Controls visibility
  // ---------------------------------------------------------------------------

  const showControls = useCallback(() => {
    setControlsVisible(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [controlsOpacity]);

  const hideControls = useCallback(() => {
    Animated.timing(controlsOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setControlsVisible(false);
    });
  }, [controlsOpacity]);

  const resetHideTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    hideTimer.current = setTimeout(() => {
      if (!showAutoNext) {
        hideControls();
      }
    }, CONTROLS_HIDE_DELAY);
  }, [hideControls, showAutoNext]);

  const handleScreenTap = useCallback(() => {
    if (showAutoNext) {
      return;
    }
    if (controlsVisible) {
      hideControls();
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    } else {
      showControls();
      resetHideTimer();
    }
  }, [controlsVisible, showAutoNext, showControls, hideControls, resetHideTimer]);

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    if (controlsVisible && isPlaying && !showAutoNext) {
      resetHideTimer();
    }
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, [controlsVisible, isPlaying, showAutoNext, resetHideTimer]);

  // ---------------------------------------------------------------------------
  // Mock progress
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (isPlaying && !showAutoNext) {
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          const step = PROGRESS_INTERVAL_MS / PLAYBACK_DURATION_MS;
          const next = prev + step;
          if (next >= 1) {
            // Episode "ended"
            clearInterval(progressInterval.current!);
            return 1;
          }
          return next;
        });
      }, PROGRESS_INTERVAL_MS);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying, showAutoNext]);

  // Trigger auto-next when progress reaches 1
  useEffect(() => {
    if (progress >= 1 && !showAutoNext) {
      setIsPlaying(false);
      setShowAutoNext(true);
      setAutoNextCountdown(AUTO_NEXT_COUNTDOWN);
      showControls();
    }
  }, [progress, showAutoNext, showControls]);

  // ---------------------------------------------------------------------------
  // Auto-next countdown
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (showAutoNext) {
      countdownInterval.current = setInterval(() => {
        setAutoNextCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval.current!);
            // Auto-advance to next episode
            goToNextEpisode();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAutoNext]);

  // ---------------------------------------------------------------------------
  // Episode navigation
  // ---------------------------------------------------------------------------

  const goToNextEpisode = useCallback(() => {
    setShowAutoNext(false);
    setProgress(0);
    setIsPlaying(true);
    setCurrentEpisodeIndex(prev =>
      prev < EPISODES.length - 1 ? prev + 1 : 0,
    );
    showControls();
    resetHideTimer();
  }, [showControls, resetHideTimer]);

  const goToPreviousEpisode = useCallback(() => {
    setShowAutoNext(false);
    setProgress(0);
    setIsPlaying(true);
    setCurrentEpisodeIndex(prev =>
      prev > 0 ? prev - 1 : EPISODES.length - 1,
    );
    showControls();
    resetHideTimer();
  }, [showControls, resetHideTimer]);

  const cancelAutoNext = useCallback(() => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }
    setShowAutoNext(false);
    setIsPlaying(false);
    showControls();
  }, [showControls]);

  const playNow = useCallback(() => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }
    goToNextEpisode();
  }, [goToNextEpisode]);

  // ---------------------------------------------------------------------------
  // Play/Pause
  // ---------------------------------------------------------------------------

  const togglePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
    showControls();
    resetHideTimer();
  }, [showControls, resetHideTimer]);

  // ---------------------------------------------------------------------------
  // Skip intro
  // ---------------------------------------------------------------------------

  const skipIntro = useCallback(() => {
    setProgress(INTRO_END);
    showControls();
    resetHideTimer();
  }, [showControls, resetHideTimer]);

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const totalDurationSec = 4 * 60 + 56; // "04:56"
  const currentTimeSec = progress * totalDurationSec;
  const showSkipIntro = isPlaying && progress < INTRO_END && !showAutoNext;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      {/* Black video placeholder */}
      <View style={styles.videoPlaceholder} />

      {/* Tap target for showing/hiding controls */}
      <Pressable style={StyleSheet.absoluteFill} onPress={handleScreenTap}>
        {/* Controls overlay */}
        <Animated.View
          style={[StyleSheet.absoluteFill, {opacity: controlsOpacity}]}
          pointerEvents={controlsVisible ? 'auto' : 'none'}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <Pressable
              style={styles.topButton}
              onPress={() => navigation.goBack()}
              hitSlop={12}>
              <Text style={styles.backIcon}>{'‹'}</Text>
            </Pressable>

            <Text style={styles.episodeTitle} numberOfLines={1}>
              {'ح ' + currentEpisode.number + ' — ' + currentEpisode.title}
            </Text>

            <Pressable style={styles.topButton} hitSlop={12}>
              <Text style={styles.shareIcon}>{'⤴'}</Text>
            </Pressable>
          </View>

          {/* Center play/pause button */}
          {!showAutoNext && (
            <View style={styles.centerControls}>
              <Pressable
                style={styles.playPauseButton}
                onPress={togglePlayPause}>
                <Text style={styles.playPauseIcon}>
                  {isPlaying ? '❚❚' : '▶'}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Bottom controls */}
          {!showAutoNext && (
            <View style={styles.bottomControls}>
              {/* Skip intro pill */}
              {showSkipIntro && (
                <Pressable style={styles.skipIntroPill} onPress={skipIntro}>
                  <Text style={styles.skipIntroText}>تخطي المقدمة</Text>
                </Pressable>
              )}

              {/* Seek bar */}
              <View style={styles.seekBarContainer}>
                <View style={styles.seekTrack}>
                  <View
                    style={[
                      styles.seekPlayed,
                      {width: `${Math.min(progress * 100, 100)}%`},
                    ]}
                  />
                  <View
                    style={[
                      styles.seekHandle,
                      {left: `${Math.min(progress * 100, 100)}%`},
                    ]}
                  />
                </View>
              </View>

              {/* Time labels */}
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>
                  {formatTime(currentTimeSec)}
                </Text>
                <Text style={styles.timeLabel}>
                  {formatTime(totalDurationSec)}
                </Text>
              </View>

              {/* Episode navigation row */}
              <View style={styles.episodeNavRow}>
                <Pressable onPress={goToPreviousEpisode} hitSlop={12}>
                  <Text style={styles.episodeNavText}>السابقة</Text>
                </Pressable>

                <Text style={styles.episodeCounter}>
                  {'ح ' + currentEpisode.number + '/' + TOTAL_EPISODES}
                </Text>

                <Pressable onPress={goToNextEpisode} hitSlop={12}>
                  <Text style={styles.episodeNavText}>التالية</Text>
                </Pressable>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Auto-next overlay */}
        {showAutoNext && (
          <View style={styles.autoNextOverlay}>
            <Text style={styles.autoNextCountdownText}>
              {'الحلقة التالية في ' + autoNextCountdown + '...'}
            </Text>

            {/* Next episode card */}
            <View style={styles.nextEpisodeCard}>
              {/* Thumbnail placeholder */}
              <View style={styles.nextEpisodeThumbnail} />
              <View style={styles.nextEpisodeInfo}>
                <Text style={styles.nextEpisodeTitle}>
                  {'ح ' + nextEpisode.number + ' — ' + nextEpisode.title}
                </Text>
              </View>
            </View>

            {/* Action buttons */}
            <Pressable style={styles.playNowButton} onPress={playNow}>
              <Text style={styles.playNowText}>تشغيل الآن</Text>
            </Pressable>

            <Pressable
              style={styles.cancelButton}
              onPress={cancelAutoNext}
              hitSlop={12}>
              <Text style={styles.cancelText}>إلغاء</Text>
            </Pressable>
          </View>
        )}
      </Pressable>

      {/* Mini progress bar (always visible when controls hidden) */}
      {!controlsVisible && !showAutoNext && (
        <View style={styles.miniProgressContainer}>
          <View style={styles.miniProgressTrack}>
            <View
              style={[
                styles.miniProgressPlayed,
                {width: `${Math.min(progress * 100, 100)}%`},
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );
};

export default VideoPlayerScreen;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },

  videoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },

  // ---- Top bar ----
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xl + 20, // account for hidden status bar area
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  topButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 32,
    color: colors.text,
    fontWeight: fontWeights.bold,
    lineHeight: 36,
  },
  shareIcon: {
    fontSize: 22,
    color: colors.text,
  },
  episodeTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    writingDirection: 'rtl',
  },

  // ---- Center controls ----
  centerControls: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseIcon: {
    fontSize: 24,
    color: colors.cta,
    lineHeight: 28,
  },

  // ---- Bottom controls ----
  bottomControls: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 20, // account for home indicator area
  },

  // Skip intro pill
  skipIntroPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.cta,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  skipIntroText: {
    fontSize: fontSizes.caption,
    color: colors.text,
    fontWeight: fontWeights.semibold,
    writingDirection: 'rtl',
  },

  // Seek bar
  seekBarContainer: {
    height: 20,
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  seekTrack: {
    height: 3,
    backgroundColor: '#2A2A2A',
    borderRadius: 1.5,
    overflow: 'visible',
  },
  seekPlayed: {
    height: 3,
    backgroundColor: colors.cta,
    borderRadius: 1.5,
  },
  seekHandle: {
    position: 'absolute',
    top: -4.5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.text,
    marginStart: -6,
  },

  // Time labels
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  timeLabel: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
  },

  // Episode navigation
  episodeNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  episodeNavText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: fontWeights.semibold,
    writingDirection: 'rtl',
  },
  episodeCounter: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: fontWeights.semibold,
    writingDirection: 'rtl',
  },

  // ---- Auto-next overlay ----
  autoNextOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  autoNextCountdownText: {
    fontSize: fontSizes.button,
    color: colors.text,
    fontWeight: fontWeights.semibold,
    marginBottom: spacing.xl,
    writingDirection: 'rtl',
  },

  // Next episode card
  nextEpisodeCard: {
    width: SCREEN_WIDTH * 0.75,
    backgroundColor: colors.card,
    borderRadius: radii.card,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  nextEpisodeThumbnail: {
    width: '100%',
    height: SCREEN_WIDTH * 0.75 * 0.56, // ~16:9 aspect
    backgroundColor: '#252525',
  },
  nextEpisodeInfo: {
    padding: spacing.md,
  },
  nextEpisodeTitle: {
    fontSize: fontSizes.body,
    color: colors.text,
    fontWeight: fontWeights.semibold,
    writingDirection: 'rtl',
    textAlign: 'center',
  },

  // Play now button
  playNowButton: {
    backgroundColor: colors.cta,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl * 2,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  playNowText: {
    fontSize: fontSizes.button,
    color: colors.text,
    fontWeight: fontWeights.semibold,
    writingDirection: 'rtl',
  },

  // Cancel button
  cancelButton: {
    paddingVertical: spacing.sm,
  },
  cancelText: {
    fontSize: fontSizes.body,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },

  // ---- Mini progress bar ----
  miniProgressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  miniProgressTrack: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  miniProgressPlayed: {
    height: 2,
    backgroundColor: colors.cta,
  },
});
