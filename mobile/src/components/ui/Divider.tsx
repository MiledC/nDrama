import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";

interface DividerProps {
  style?: ViewStyle;
}

export function Divider({ style }: DividerProps) {
  return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#2A2A2A",
    width: "100%",
  },
});
