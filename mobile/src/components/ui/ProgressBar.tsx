import React from "react";
import { View, StyleSheet, I18nManager, ViewStyle } from "react-native";

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  height = 3,
  color = "#00B856",
  backgroundColor = "rgba(255, 255, 255, 0.1)",
  style,
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <View style={[styles.track, { height, backgroundColor, borderRadius: height / 2 }, style]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress}%`,
            backgroundColor: color,
            borderRadius: height / 2,
            // RTL-aware: progress fills from right in RTL
            ...(I18nManager.isRTL ? { right: 0 } : { left: 0 }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  fill: {
    position: "absolute",
    top: 0,
    bottom: 0,
  },
});
