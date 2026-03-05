import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { CoinDisplay } from "../ui/CoinDisplay";

interface CoinPackageCardProps {
  name: string;
  coins: number;
  bonusCoins: number;
  price: string;
  isPopular: boolean;
  onPress: () => void;
}

export function CoinPackageCard({
  name,
  coins,
  bonusCoins,
  price,
  isPopular,
  onPress,
}: CoinPackageCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.card, isPopular && styles.popular]}
    >
      {isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>Best Value</Text>
        </View>
      )}
      <CoinDisplay amount={coins} size="lg" style={styles.coins} />
      {bonusCoins > 0 && (
        <Text style={styles.bonus}>+{bonusCoins} bonus</Text>
      )}
      <Text style={styles.name}>{name}</Text>
      <View style={styles.priceButton}>
        <Text style={styles.price}>{price}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#1F1133",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  popular: {
    borderColor: "#D4A843",
  },
  popularBadge: {
    position: "absolute",
    top: -10,
    backgroundColor: "#D4A843",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  popularText: {
    color: "#0D0D0D",
    fontSize: 10,
    fontWeight: "700",
  },
  coins: {
    marginTop: 8,
    marginBottom: 4,
  },
  bonus: {
    color: "#00B856",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  name: {
    color: "#A3A3A3",
    fontSize: 12,
    marginBottom: 12,
  },
  priceButton: {
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  price: {
    color: "#8B5CF6",
    fontSize: 14,
    fontWeight: "700",
  },
});
