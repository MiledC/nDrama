import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { formatCoinAmount } from "../../utils/formatters";

interface CoinDisplayProps {
  amount: number;
  size?: "sm" | "md" | "lg";
  style?: ViewStyle;
}

const sizeConfig = {
  sm: { fontSize: 12, iconSize: 14, gap: 3 },
  md: { fontSize: 16, iconSize: 18, gap: 4 },
  lg: { fontSize: 24, iconSize: 28, gap: 6 },
};

export function CoinDisplay({ amount, size = "md", style }: CoinDisplayProps) {
  const config = sizeConfig[size];

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.coinIcon,
          { width: config.iconSize, height: config.iconSize, borderRadius: config.iconSize / 2 },
        ]}
      >
        <Text style={[styles.coinSymbol, { fontSize: config.iconSize * 0.6 }]}>C</Text>
      </View>
      <Text style={[styles.amount, { fontSize: config.fontSize, marginStart: config.gap }]}>
        {formatCoinAmount(amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  coinIcon: {
    backgroundColor: "#D4A843",
    alignItems: "center",
    justifyContent: "center",
  },
  coinSymbol: {
    color: "#0D0D0D",
    fontWeight: "700",
  },
  amount: {
    color: "#D4A843",
    fontWeight: "700",
  },
});
