import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { ScreenHeader } from "../components/common/ScreenHeader";
import { CoinDisplay } from "../components/ui/CoinDisplay";
import { CoinPackageCard } from "../components/coins/CoinPackageCard";
import { useCoinBalance, useCoinPackages, usePurchaseCoins } from "../api/queries";
import { useCoinStore } from "../stores/coinStore";

export default function CoinStoreScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const balance = useCoinStore((s) => s.balance);
  const { data: packages } = useCoinPackages();
  const purchaseCoins = usePurchaseCoins();

  const handlePurchase = (pkg: any) => {
    Alert.alert(
      t("coins.buyCoins"),
      `Buy ${pkg.coins} coins for $${pkg.price_usd}?`,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.confirm"),
          onPress: () => {
            purchaseCoins.mutate({
              package_id: pkg.id,
              receipt: "mock_receipt",
              platform: "ios",
            });
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={t("coins.coinStore")}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t("coins.balance")}</Text>
          <CoinDisplay amount={balance} size="lg" />
        </View>

        {/* Packages Grid */}
        <Text style={styles.sectionTitle}>{t("coins.buyCoins")}</Text>
        <View style={styles.grid}>
          {(packages || []).map((pkg: any, i: number) => (
            <View key={pkg.id || i} style={styles.gridItem}>
              <CoinPackageCard
                name={pkg.name}
                coins={pkg.coins}
                bonusCoins={pkg.bonus_coins || 0}
                price={`$${pkg.price_usd}`}
                isPopular={pkg.is_popular || false}
                onPress={() => handlePurchase(pkg)}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  content: { paddingHorizontal: 16, paddingBottom: 100 },
  balanceCard: {
    backgroundColor: "#1F1133",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  balanceLabel: { color: "#A3A3A3", fontSize: 16 },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridItem: {
    width: "48%",
  },
});
