import React from "react";
import { View, StyleSheet, ViewStyle, TouchableOpacity } from "react-native";

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  elevated?: boolean;
  style?: ViewStyle;
}

export function Card({ children, onPress, elevated = false, style }: CardProps) {
  const content = (
    <View
      style={[
        styles.card,
        elevated && styles.elevated,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1F1133",
    borderRadius: 12,
    overflow: "hidden",
  },
  elevated: {
    backgroundColor: "#2A1845",
  },
});
