import React, { useRef, useEffect, useCallback } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { usePlayerStore } from "../../stores/playerStore";
import { PlayerControls } from "./PlayerControls";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface VideoPlayerProps {
  playbackUrl: string;
  drmConfig?: {
    type: "widevine" | "fairplay";
    licenseServer: string;
    certificateUrl?: string;
    headers?: Record<string, string>;
  };
  onProgress?: (position: number) => void;
  onComplete?: () => void;
}

export function VideoPlayer({
  playbackUrl,
  drmConfig,
  onProgress,
  onComplete,
}: VideoPlayerProps) {
  const { isPlaying, setIsPlaying, setIsBuffering, setPlaybackPosition } =
    usePlayerStore();

  const player = useVideoPlayer(playbackUrl, (player) => {
    player.loop = false;
    player.play();
  });

  useEffect(() => {
    if (!player) return;

    const subscription = player.addListener("playingChange", (event) => {
      setIsPlaying(event.isPlaying);
    });

    return () => {
      subscription.remove();
    };
  }, [player, setIsPlaying]);

  useEffect(() => {
    if (!player) return;

    const interval = setInterval(() => {
      if (player.currentTime != null) {
        setPlaybackPosition(player.currentTime);
        onProgress?.(player.currentTime);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [player, setPlaybackPosition, onProgress]);

  const handlePlayPause = useCallback(() => {
    if (!player) return;
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [player]);

  const handleSeek = useCallback(
    (seconds: number) => {
      if (!player) return;
      player.currentTime = seconds;
    },
    [player]
  );

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls={false}
        contentFit="contain"
      />
      <PlayerControls
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        duration={player?.duration || 0}
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
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});
