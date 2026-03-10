import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import Video, {
  type VideoRef,
  type OnProgressData,
  type OnLoadData,
  type SelectedTrack,
  SelectedTrackType,
} from 'react-native-video';
import {GestureDetector, Gesture} from 'react-native-gesture-handler';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import {useEpisodeDetail} from '../hooks/useEpisodes';
import {useSeriesEpisodes} from '../hooks/useSeries';
import {useReportProgress} from '../hooks/useHistory';
import type {EpisodeListItem, AudioTrackItem, SubtitleItem} from '../types/api';
import {colors, fontSizes, fontWeights, spacing, radii} from '../theme';
import UnlockEpisodeSheet from '../components/sheets/UnlockEpisodeSheet';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = NativeStackScreenProps<RootStackParamList, 'VideoPlayer'>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const SWIPE_THRESHOLD = 80;

const CONTROLS_HIDE_DELAY = 3000;
const AUTO_NEXT_COUNTDOWN = 5;
const PROGRESS_REPORT_INTERVAL_MS = 12000; // ~12 seconds between progress reports

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

const VideoPlayerScreen: React.FC<Props> = ({navigation, route}) => {
  const {episodeId, seriesId} = route.params;

  // ---------------------------------------------------------------------------
  // API data
  // ---------------------------------------------------------------------------

  const [currentEpisodeId, setCurrentEpisodeId] = useState(episodeId);
  const {
    data: episode,
    isLoading: episodeLoading,
    error: episodeError,
  } = useEpisodeDetail(currentEpisodeId);
  const {data: seriesEpisodes} = useSeriesEpisodes(seriesId, {limit: 200});
  const reportProgress = useReportProgress();

  // ---------------------------------------------------------------------------
  // Derived episode list & navigation
  // ---------------------------------------------------------------------------

  const episodeList = useMemo(
    () => seriesEpisodes?.items ?? [],
    [seriesEpisodes?.items],
  );
  const currentIndex = episodeList.findIndex(ep => ep.id === currentEpisodeId);
  const totalEpisodes = seriesEpisodes?.total ?? 0;

  const findAdjacentEpisode = useCallback(
    (direction: 'next' | 'prev'): EpisodeListItem | null => {
      if (currentIndex === -1 || episodeList.length === 0) {
        return null;
      }
      const targetIndex =
        direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      return episodeList[targetIndex] ?? null;
    },
    [currentIndex, episodeList],
  );

  const nextEpisode = findAdjacentEpisode('next');
  const prevEpisode = findAdjacentEpisode('prev');

  // ---------------------------------------------------------------------------
  // Playback state
  // ---------------------------------------------------------------------------

  const videoRef = useRef<VideoRef>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showAutoNext, setShowAutoNext] = useState(false);
  const [autoNextCountdown, setAutoNextCountdown] = useState(AUTO_NEXT_COUNTDOWN);

  // Audio & subtitle selection
  const [selectedAudio, setSelectedAudio] = useState<AudioTrackItem | null>(
    null,
  );
  const [selectedSubtitle, setSelectedSubtitle] =
    useState<SubtitleItem | null>(null);
  const [showTrackPicker, setShowTrackPicker] = useState<
    'audio' | 'subtitle' | null
  >(null);

  // Swipe navigation
  const translateY = useSharedValue(0);
  const [lockedEpisodeInfo, setLockedEpisodeInfo] = useState<{
    episodeId: string;
    episodeNumber: number;
    episodeTitle: string;
    coinCost: number;
  } | null>(null);

  // Animated opacity for controls overlay
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressReportTimer = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const lastReportedTime = useRef(0);

  // ---------------------------------------------------------------------------
  // Set default audio/subtitle when episode loads
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (episode?.audio_tracks?.length) {
      const defaultTrack =
        episode.audio_tracks.find(t => t.is_default) ??
        episode.audio_tracks[0];
      setSelectedAudio(defaultTrack);
    }
    if (episode?.subtitles?.length) {
      const defaultSub =
        episode.subtitles.find(t => t.is_default) ?? null;
      setSelectedSubtitle(defaultSub);
    }
  }, [episode]);

  // ---------------------------------------------------------------------------
  // Progress reporting (every ~12 seconds)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isPlaying || !currentEpisodeId) {
      return;
    }
    progressReportTimer.current = setInterval(() => {
      const seconds = Math.floor(lastReportedTime.current);
      if (seconds > 0) {
        reportProgress.mutate({
          episodeId: currentEpisodeId,
          progressSeconds: seconds,
        });
      }
    }, PROGRESS_REPORT_INTERVAL_MS);

    return () => {
      if (progressReportTimer.current) {
        clearInterval(progressReportTimer.current);
      }
    };
  }, [isPlaying, currentEpisodeId, reportProgress]);

  // Report final progress on unmount or episode change
  useEffect(() => {
    return () => {
      const seconds = Math.floor(lastReportedTime.current);
      if (seconds > 0 && currentEpisodeId) {
        reportProgress.mutate({
          episodeId: currentEpisodeId,
          progressSeconds: seconds,
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEpisodeId]);

  // ---------------------------------------------------------------------------
  // Controls visibility
  // ---------------------------------------------------------------------------

  const showControlsFn = useCallback(() => {
    setControlsVisible(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [controlsOpacity]);

  const hideControlsFn = useCallback(() => {
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
        hideControlsFn();
      }
    }, CONTROLS_HIDE_DELAY);
  }, [hideControlsFn, showAutoNext]);

  const handleScreenTap = useCallback(() => {
    if (showAutoNext || showTrackPicker) {
      if (showTrackPicker) {
        setShowTrackPicker(null);
      }
      return;
    }
    if (controlsVisible) {
      hideControlsFn();
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    } else {
      showControlsFn();
      resetHideTimer();
    }
  }, [
    controlsVisible,
    showAutoNext,
    showTrackPicker,
    showControlsFn,
    hideControlsFn,
    resetHideTimer,
  ]);

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
  // Video callbacks
  // ---------------------------------------------------------------------------

  const onLoad = useCallback((data: OnLoadData) => {
    setDuration(data.duration);
    setIsBuffering(false);
  }, []);

  const onProgress = useCallback((data: OnProgressData) => {
    setCurrentTime(data.currentTime);
    lastReportedTime.current = data.currentTime;
  }, []);

  const onEnd = useCallback(() => {
    setIsPlaying(false);
    if (nextEpisode) {
      setShowAutoNext(true);
      setAutoNextCountdown(AUTO_NEXT_COUNTDOWN);
      showControlsFn();
    }
  }, [nextEpisode, showControlsFn]);

  const onBuffer = useCallback(({isBuffering: buffering}: {isBuffering: boolean}) => {
    setIsBuffering(buffering);
  }, []);

  // ---------------------------------------------------------------------------
  // Auto-next countdown
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (showAutoNext) {
      countdownInterval.current = setInterval(() => {
        setAutoNextCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval.current!);
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
    if (!nextEpisode) {
      return;
    }
    // Report final progress before switching
    const seconds = Math.floor(lastReportedTime.current);
    if (seconds > 0) {
      reportProgress.mutate({
        episodeId: currentEpisodeId,
        progressSeconds: seconds,
      });
    }
    setShowAutoNext(false);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);
    setIsBuffering(true);
    lastReportedTime.current = 0;
    setCurrentEpisodeId(nextEpisode.id);
    showControlsFn();
    resetHideTimer();
  }, [
    nextEpisode,
    currentEpisodeId,
    reportProgress,
    showControlsFn,
    resetHideTimer,
  ]);

  const goToPreviousEpisode = useCallback(() => {
    if (!prevEpisode) {
      return;
    }
    const seconds = Math.floor(lastReportedTime.current);
    if (seconds > 0) {
      reportProgress.mutate({
        episodeId: currentEpisodeId,
        progressSeconds: seconds,
      });
    }
    setShowAutoNext(false);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);
    setIsBuffering(true);
    lastReportedTime.current = 0;
    setCurrentEpisodeId(prevEpisode.id);
    showControlsFn();
    resetHideTimer();
  }, [
    prevEpisode,
    currentEpisodeId,
    reportProgress,
    showControlsFn,
    resetHideTimer,
  ]);

  const cancelAutoNext = useCallback(() => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }
    setShowAutoNext(false);
    setIsPlaying(false);
    showControlsFn();
  }, [showControlsFn]);

  // ---------------------------------------------------------------------------
  // Swipe episode navigation
  // ---------------------------------------------------------------------------

  const handleSwipeToEpisode = useCallback(
    (direction: 'next' | 'prev') => {
      const targetEpisode = direction === 'next' ? nextEpisode : prevEpisode;
      if (!targetEpisode) return;

      // Check if the target episode is locked
      if (!targetEpisode.is_free && !targetEpisode.is_unlocked) {
        setLockedEpisodeInfo({
          episodeId: targetEpisode.id,
          episodeNumber: targetEpisode.episode_number,
          episodeTitle: targetEpisode.title,
          coinCost: targetEpisode.coin_price ?? 0,
        });
        return;
      }

      // Navigate to the episode
      if (direction === 'next') {
        goToNextEpisode();
      } else {
        goToPreviousEpisode();
      }
    },
    [nextEpisode, prevEpisode, goToNextEpisode, goToPreviousEpisode],
  );

  const handleLockedUnlocked = useCallback(() => {
    if (!lockedEpisodeInfo) return;
    // After unlock, switch to the episode
    const unlockedId = lockedEpisodeInfo.episodeId;
    setLockedEpisodeInfo(null);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);
    setIsBuffering(true);
    lastReportedTime.current = 0;
    setCurrentEpisodeId(unlockedId);
    showControlsFn();
    resetHideTimer();
  }, [lockedEpisodeInfo, showControlsFn, resetHideTimer]);

  const handleLockedDismiss = useCallback(() => {
    setLockedEpisodeInfo(null);
  }, []);

  const swipeGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (showAutoNext || showTrackPicker) return;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (showAutoNext || showTrackPicker) {
        translateY.value = withSpring(0);
        return;
      }

      if (e.translationY < -SWIPE_THRESHOLD && nextEpisode) {
        // Swiped up — go to next
        translateY.value = withSpring(-SCREEN_HEIGHT, {damping: 20}, () => {
          translateY.value = 0;
          runOnJS(handleSwipeToEpisode)('next');
        });
      } else if (e.translationY > SWIPE_THRESHOLD && prevEpisode) {
        // Swiped down — go to prev
        translateY.value = withSpring(SCREEN_HEIGHT, {damping: 20}, () => {
          translateY.value = 0;
          runOnJS(handleSwipeToEpisode)('prev');
        });
      } else {
        // Snap back
        translateY.value = withSpring(0);
      }
    })
    .activeOffsetY([-20, 20])
    .failOffsetX([-20, 20]);

  const animatedPlayerStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}],
  }));

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
    showControlsFn();
    resetHideTimer();
  }, [showControlsFn, resetHideTimer]);

  // ---------------------------------------------------------------------------
  // Skip intro
  // ---------------------------------------------------------------------------

  const skipIntro = useCallback(() => {
    if (duration > 0) {
      const skipToTime = duration * INTRO_END;
      videoRef.current?.seek(skipToTime);
      setCurrentTime(skipToTime);
    }
    showControlsFn();
    resetHideTimer();
  }, [duration, showControlsFn, resetHideTimer]);

  // ---------------------------------------------------------------------------
  // Track selection helpers
  // ---------------------------------------------------------------------------

  const videoSelectedAudioTrack: SelectedTrack | undefined = selectedAudio
    ? {type: SelectedTrackType.INDEX, value: (episode?.audio_tracks ?? []).indexOf(selectedAudio)}
    : undefined;

  const videoSelectedTextTrack: SelectedTrack | undefined = selectedSubtitle
    ? {type: SelectedTrackType.INDEX, value: (episode?.subtitles ?? []).indexOf(selectedSubtitle)}
    : undefined;

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const progress = duration > 0 ? currentTime / duration : 0;
  const showSkipIntro = isPlaying && progress < INTRO_END && !showAutoNext && duration > 0;
  const episodeNumber = episode?.episode_number ?? 0;
  const episodeTitle = episode?.title ?? '';

  // ---------------------------------------------------------------------------
  // Loading / error states
  // ---------------------------------------------------------------------------

  if (episodeLoading) {
    return (
      <View style={styles.root}>
        <StatusBar hidden />
        <ActivityIndicator
          size="large"
          color={colors.cta}
          style={styles.centered}
        />
      </View>
    );
  }

  if (episodeError || !episode) {
    return (
      <View style={styles.root}>
        <StatusBar hidden />
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            حدث خطأ في تحميل الحلقة
          </Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.retryText}>العودة</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <GestureDetector gesture={swipeGesture}>
    <ReAnimated.View style={[styles.root, animatedPlayerStyle]}>
      <StatusBar hidden />

      {/* Video player */}
      {episode.playback_url ? (
        <Video
          ref={videoRef}
          source={{uri: episode.playback_url}}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
          paused={!isPlaying}
          onLoad={onLoad}
          onProgress={onProgress}
          onEnd={onEnd}
          onBuffer={onBuffer}
          selectedAudioTrack={videoSelectedAudioTrack}
          selectedTextTrack={videoSelectedTextTrack}
          progressUpdateInterval={250}
        />
      ) : (
        <View style={styles.videoPlaceholder} />
      )}

      {/* Buffering indicator */}
      {isBuffering && isPlaying && (
        <ActivityIndicator
          size="large"
          color={colors.cta}
          style={styles.bufferingIndicator}
        />
      )}

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

            <Text style={styles.episodeTitleText} numberOfLines={1}>
              {'ح ' + episodeNumber + ' — ' + episodeTitle}
            </Text>

            <View style={styles.topActions}>
              {/* Audio track button */}
              {(episode.audio_tracks?.length ?? 0) > 1 && (
                <Pressable
                  style={styles.topButton}
                  onPress={() =>
                    setShowTrackPicker(
                      showTrackPicker === 'audio' ? null : 'audio',
                    )
                  }
                  hitSlop={8}>
                  <Text style={styles.trackIcon}>{'🔊'}</Text>
                </Pressable>
              )}

              {/* Subtitle button */}
              {(episode.subtitles?.length ?? 0) > 0 && (
                <Pressable
                  style={styles.topButton}
                  onPress={() =>
                    setShowTrackPicker(
                      showTrackPicker === 'subtitle' ? null : 'subtitle',
                    )
                  }
                  hitSlop={8}>
                  <Text style={styles.trackIcon}>{'CC'}</Text>
                </Pressable>
              )}

              <Pressable style={styles.topButton} hitSlop={12}>
                <Text style={styles.shareIcon}>{'⤴'}</Text>
              </Pressable>
            </View>
          </View>

          {/* Track picker dropdown */}
          {showTrackPicker === 'audio' && (
            <View style={styles.trackPickerOverlay}>
              <Text style={styles.trackPickerTitle}>الصوت</Text>
              {episode.audio_tracks.map(track => (
                <Pressable
                  key={track.id}
                  style={[
                    styles.trackOption,
                    selectedAudio?.id === track.id && styles.trackOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedAudio(track);
                    setShowTrackPicker(null);
                  }}>
                  <Text style={styles.trackOptionText}>{track.label}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {showTrackPicker === 'subtitle' && (
            <View style={styles.trackPickerOverlay}>
              <Text style={styles.trackPickerTitle}>الترجمة</Text>
              <Pressable
                style={[
                  styles.trackOption,
                  !selectedSubtitle && styles.trackOptionSelected,
                ]}
                onPress={() => {
                  setSelectedSubtitle(null);
                  setShowTrackPicker(null);
                }}>
                <Text style={styles.trackOptionText}>إيقاف</Text>
              </Pressable>
              {episode.subtitles.map(track => (
                <Pressable
                  key={track.id}
                  style={[
                    styles.trackOption,
                    selectedSubtitle?.id === track.id &&
                      styles.trackOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedSubtitle(track);
                    setShowTrackPicker(null);
                  }}>
                  <Text style={styles.trackOptionText}>{track.label}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Center play/pause button */}
          {!showAutoNext && !showTrackPicker && (
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
                  {formatTime(currentTime)}
                </Text>
                <Text style={styles.timeLabel}>
                  {formatTime(duration)}
                </Text>
              </View>

              {/* Episode navigation row */}
              <View style={styles.episodeNavRow}>
                <Pressable
                  onPress={goToPreviousEpisode}
                  hitSlop={12}
                  disabled={!prevEpisode}>
                  <Text
                    style={[
                      styles.episodeNavText,
                      !prevEpisode && styles.episodeNavDisabled,
                    ]}>
                    السابقة
                  </Text>
                </Pressable>

                <Text style={styles.episodeCounter}>
                  {'ح ' + episodeNumber + '/' + totalEpisodes}
                </Text>

                <Pressable
                  onPress={goToNextEpisode}
                  hitSlop={12}
                  disabled={!nextEpisode}>
                  <Text
                    style={[
                      styles.episodeNavText,
                      !nextEpisode && styles.episodeNavDisabled,
                    ]}>
                    التالية
                  </Text>
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
            {nextEpisode && (
              <View style={styles.nextEpisodeCard}>
                {nextEpisode.thumbnail_url ? (
                  <Image
                    source={{uri: nextEpisode.thumbnail_url}}
                    style={styles.nextEpisodeThumbnail}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.nextEpisodeThumbnail} />
                )}
                <View style={styles.nextEpisodeInfo}>
                  <Text style={styles.nextEpisodeTitleText}>
                    {'ح ' + nextEpisode.episode_number + ' — ' + nextEpisode.title}
                  </Text>
                </View>
              </View>
            )}

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

      {/* Locked episode sheet */}
      {lockedEpisodeInfo && (
        <UnlockEpisodeSheet
          episodeId={lockedEpisodeInfo.episodeId}
          episodeNumber={lockedEpisodeInfo.episodeNumber}
          episodeTitle={lockedEpisodeInfo.episodeTitle}
          coinCost={lockedEpisodeInfo.coinCost}
          onUnlocked={handleLockedUnlocked}
          onDismiss={handleLockedDismiss}
        />
      )}
    </ReAnimated.View>
    </GestureDetector>
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

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorText: {
    fontSize: fontSizes.body,
    color: colors.text,
    marginBottom: spacing.lg,
    writingDirection: 'rtl',
  },

  retryButton: {
    backgroundColor: colors.cta,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },

  retryText: {
    fontSize: fontSizes.button,
    color: colors.text,
    fontWeight: fontWeights.semibold,
    writingDirection: 'rtl',
  },

  bufferingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -18,
    marginTop: -18,
  },

  // ---- Top bar ----
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xl + 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  topButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
  trackIcon: {
    fontSize: 16,
    color: colors.text,
  },
  episodeTitleText: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    writingDirection: 'rtl',
  },

  // ---- Track picker ----
  trackPickerOverlay: {
    position: 'absolute',
    top: spacing.xl + 70,
    right: spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.90)',
    borderRadius: radii.card,
    padding: spacing.md,
    minWidth: 160,
    zIndex: 10,
  },
  trackPickerTitle: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
    fontWeight: fontWeights.semibold,
    marginBottom: spacing.sm,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  trackOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.thumbnail,
  },
  trackOptionSelected: {
    backgroundColor: 'rgba(0, 108, 53, 0.30)',
  },
  trackOptionText: {
    fontSize: fontSizes.body,
    color: colors.text,
    writingDirection: 'rtl',
    textAlign: 'right',
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
    paddingBottom: spacing.xl + 20,
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
  episodeNavDisabled: {
    opacity: 0.3,
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
    height: SCREEN_WIDTH * 0.75 * 0.56,
    backgroundColor: '#252525',
  },
  nextEpisodeInfo: {
    padding: spacing.md,
  },
  nextEpisodeTitleText: {
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
