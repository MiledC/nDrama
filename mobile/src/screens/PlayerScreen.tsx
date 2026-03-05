import React, { useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  Dimensions,
  PanResponder,
  Text,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useNavigation } from "@react-navigation/native";
import { usePlayerStore } from "../stores/playerStore";
import { PlayerControls } from "../components/player/PlayerControls";
import { useUpdateProgress } from "../api/queries";
import { buildDRMConfig } from "../utils/drm";
import { useAuthStore } from "../stores/authStore";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = 50;

export default function PlayerScreen() {
  const navigation = useNavigation();
  const sessionToken = useAuthStore((s) => s.sessionToken);
  const {
    currentEpisode,
    setPlaybackPosition,
    nextEpisode,
    previousEpisode,
    setEpisode,
    setAutoAdvanceCountdown,
  } = usePlayerStore();

  const updateProgress = useUpdateProgress();
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playbackUrl = currentEpisode?.playback_url || "";

  const player = useVideoPlayer(playbackUrl, (p) => {
    p.loop = false;
    p.play();
  });

  // Progress reporting every 10s
  useEffect(() => {
    if (!player || !currentEpisode) return;
    const interval = setInterval(() => {
      if (player.currentTime != null && player.currentTime > 0) {
        setPlaybackPosition(player.currentTime);
        updateProgress.mutate({
          episodeId: currentEpisode.id,
          body: {
            progress_seconds: Math.floor(player.currentTime),
            duration_seconds: Math.floor(player.duration || currentEpisode.duration_seconds || 0),
          },
        });
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [player, currentEpisode, setPlaybackPosition, updateProgress]);

  // Auto-advance on video end
  useEffect(() => {
    if (!player) return;
    const sub = player.addListener("playToEnd", () => {
      const next = nextEpisode();
      if (next) {
        let countdown = 3;
        setAutoAdvanceCountdown(countdown);
        autoAdvanceTimer.current = setInterval(() => {
          countdown -= 1;
          setAutoAdvanceCountdown(countdown);
          if (countdown <= 0) {
            if (autoAdvanceTimer.current) clearInterval(autoAdvanceTimer.current);
            setAutoAdvanceCountdown(null);
            setEpisode(next);
          }
        }, 1000);
      }
    });
    return () => {
      sub.remove();
      if (autoAdvanceTimer.current) clearInterval(autoAdvanceTimer.current);
    };
  }, [player, nextEpisode, setEpisode, setAutoAdvanceCountdown]);

  // Swipe for next/prev episode
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 20,
      onPanResponderRelease: (_, gs) => {
        if (gs.dy < -SWIPE_THRESHOLD) {
          const next = nextEpisode();
          if (next) setEpisode(next);
        } else if (gs.dy > SWIPE_THRESHOLD) {
          const prev = previousEpisode();
          if (prev) setEpisode(prev);
        }
      },
    })
  ).current;

  const handlePlayPause = useCallback(() => {
    if (!player) return;
    if (player.playing) player.pause();
    else player.play();
  }, [player]);

  const handleSeek = useCallback(
    (seconds: number) => {
      if (!player) return;
      player.currentTime = seconds;
    },
    [player]
  );

  if (!currentEpisode) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No episode selected</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <StatusBar hidden />
      <VideoView
        player={player}
        style={styles.video}
        nativeControls={false}
        contentFit="contain"
      />
      <PlayerControls
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        duration={player?.duration || currentEpisode.duration_seconds}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  video: {
    flex: 1,
  },
  errorText: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    marginTop: SCREEN_HEIGHT / 2 - 20,
  },
});
