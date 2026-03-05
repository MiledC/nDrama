import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../stores/authStore";
import { useCoinStore } from "../stores/coinStore";
import { CoinDisplay } from "../components/ui/CoinDisplay";
import { Divider } from "../components/ui/Divider";
import { Button } from "../components/ui/Button";

function MenuItem({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuChevron}>{">"}</Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { subscriber, isRegistered } = useAuthStore();
  const balance = useCoinStore((s) => s.balance);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 16 }]}
      contentContainerStyle={styles.content}
    >
      {/* Avatar + Name */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {subscriber?.name?.[0]?.toUpperCase() || "D"}
          </Text>
        </View>
        <Text style={styles.name}>
          {subscriber?.name || "Draama User"}
        </Text>
        {subscriber?.email && (
          <Text style={styles.email}>{subscriber.email}</Text>
        )}
      </View>

      {/* Coin Balance */}
      <TouchableOpacity
        style={styles.coinCard}
        onPress={() => navigation.navigate("CoinStore")}
        activeOpacity={0.8}
      >
        <Text style={styles.coinLabel}>{t("coins.balance")}</Text>
        <CoinDisplay amount={balance} size="lg" />
      </TouchableOpacity>

      <Divider style={styles.divider} />

      {/* Menu Items */}
      <MenuItem
        label={t("profile.watchHistory")}
        onPress={() => navigation.navigate("WatchHistory")}
      />
      <MenuItem
        label={t("profile.notifications")}
        onPress={() => navigation.navigate("Notifications")}
      />
      <MenuItem
        label={t("coins.coinStore")}
        onPress={() => navigation.navigate("CoinStore")}
      />
      <MenuItem
        label={t("subscriptions.subscribe")}
        onPress={() => navigation.navigate("Subscriptions")}
      />
      <MenuItem
        label="Referral"
        onPress={() => navigation.navigate("Referral")}
      />

      <Divider style={styles.divider} />

      <MenuItem
        label={t("profile.settings")}
        onPress={() => navigation.navigate("Settings")}
      />

      {!isRegistered && (
        <Button
          title={t("auth.login")}
          onPress={() => navigation.navigate("Auth", { screen: "Login" })}
          variant="primary"
          fullWidth
          style={styles.loginButton}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  content: { paddingHorizontal: 16, paddingBottom: 100 },
  avatarSection: { alignItems: "center", marginBottom: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { color: "#FFFFFF", fontSize: 32, fontWeight: "700" },
  name: { color: "#FFFFFF", fontSize: 20, fontWeight: "700" },
  email: { color: "#A3A3A3", fontSize: 14, marginTop: 4 },
  coinCard: {
    backgroundColor: "#1F1133",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  coinLabel: { color: "#A3A3A3", fontSize: 14 },
  divider: { marginVertical: 8 },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  menuLabel: { color: "#FFFFFF", fontSize: 16 },
  menuChevron: { color: "#666666", fontSize: 16 },
  loginButton: { marginTop: 24 },
});
