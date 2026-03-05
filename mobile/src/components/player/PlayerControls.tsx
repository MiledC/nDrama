import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlayerStore } from "../../stores/playerStore";
import { formatDuration } from "../../utils/formatters";
import { ProgressBar } from "../ui/ProgressBar";
import { progressPercentage } from "../../utils/formatters";

const AUTO_HIDE_DELAY = 3000;

interface PlayerControlsProps {
  onPlayPause: () => void;
  onSeek: (seconds: number) => void;
  duration: number;
}

export function PlayerControls({
  onPlayPause,
  onSeek,
  duration,
}: PlayerControlsProps) {
  const insets = useSafeAreaInsets();
  const {
    isPlaying,
    playbackPosition,
    showControls,
    setShowControls,
    currentEpisode,
    autoAdvanceCountdown,
  } = usePlayerStore();

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (showControls && isPlaying) {
      hideTimer.current = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowControls(false));
      }, AUTO_HIDE_DELAY);
    }
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [showControls, isPlaying, fadeAnim, setShowControls]);

  const toggleControls = () => {
    if (showControls) {
      setShowControls(false);
      fadeAnim.setValue(0);
    } else {
      setShowControls(true);
      fadeAnim.setValue(1);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={toggleControls}
      style={StyleSheet.absoluteFill}
    >
      <Animated.View
        style={[styles.overlay, { opacity: fadeAnim }]}
        pointerEvents={showControls ? "auto" : "none"}
      >
        {/* Top controls */}
        <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.episodeTitle} numberOfLines={1}>
            {currentEpisode
              ? `Ep ${currentEpisode.episode_number} - ${currentEpisode.title}`
              : ""}
          </Text>
        </View>

        {/* Center play/pause */}
        <View style={styles.center}>
          <TouchableOpacity onPress={onPlayPause} style={styles.playButton}>
            <Text style={styles.playIcon}>{isPlaying ? "||" : ">"}</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom controls */}
        <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.timeRow}>
            <Text style={styles.time}>{formatDuration(Math.floor(playbackPosition))}</Text>
            <Text style={styles.time}>{formatDuration(Math.floor(duration))}</Text>
          </View>
          <ProgressBar
            progress={progressPercentage(playbackPosition, duration)}
            height={4}
            color="#8B5CF6"
          />
        </View>

        {/* Auto-advance countdown */}
        {autoAdvanceCountdown !== null && (
          <View style={styles.autoAdvance}>
            <Text style={styles.autoAdvanceText}>
              Next episode in {autoAdvanceCountdown}s
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Mini progress bar - always visible */}
      {!showControls && (
        <View style={[styles.miniProgress, { bottom: insets.bottom + 4 }]}>
          <ProgressBar
            progress={progressPercentage(playbackPosition, duration)}
            height={2}
            color="#8B5CF6"
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "space-between",
  },
  top: {
    paddingHorizontal: 16,
  },
  episodeTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(139, 92, 246, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  bottom: {
    paddingHorizontal: 16,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  time: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  miniProgress: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 4,
  },
  autoAdvance: {
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
    backgroundColor: "rgba(139, 92, 246, 0.9)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  autoAdvanceText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
