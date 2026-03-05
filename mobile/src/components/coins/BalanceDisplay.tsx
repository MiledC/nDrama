import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { CoinDisplay } from "../ui/CoinDisplay";
import { useCoinStore } from "../../stores/coinStore";

interface BalanceDisplayProps {
  onPress?: () => void;
}

export function BalanceDisplay({ onPress }: BalanceDisplayProps) {
  const balance = useCoinStore((s) => s.balance);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={styles.container}
    >
      <CoinDisplay amount={balance} size="sm" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(212, 168, 67, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
});
