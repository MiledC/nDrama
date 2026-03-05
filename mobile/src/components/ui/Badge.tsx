import React from "react";
import { View, Text, StyleSheet } from "react-native";

type BadgeType = "free" | "locked" | "new" | "continue" | "subscribed";

interface BadgeProps {
  type: BadgeType;
  label?: string;
}

const badgeConfig: Record<BadgeType, { bg: string; text: string; defaultLabel: string }> = {
  free: { bg: "rgba(0, 184, 86, 0.15)", text: "#00B856", defaultLabel: "Free" },
  locked: { bg: "rgba(212, 168, 67, 0.15)", text: "#D4A843", defaultLabel: "Locked" },
  new: { bg: "rgba(0, 184, 86, 0.15)", text: "#00B856", defaultLabel: "New" },
  continue: { bg: "rgba(59, 130, 246, 0.15)", text: "#3B82F6", defaultLabel: "Continue" },
  subscribed: { bg: "rgba(212, 168, 67, 0.15)", text: "#D4A843", defaultLabel: "VIP" },
};

export function Badge({ type, label }: BadgeProps) {
  const config = badgeConfig[type];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>
        {label || config.defaultLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
  },
});
