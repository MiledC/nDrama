import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Share,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenHeader } from "../components/common/ScreenHeader";
import { Button } from "../components/ui/Button";
import { CoinDisplay } from "../components/ui/CoinDisplay";

const REFERRAL_CODE = "DRAAMA2026";
const REFERRAL_LINK = "https://draama.app/invite/DRAAMA2026";

export default function ReferralScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on Draama! Use my code ${REFERRAL_CODE} and get 50 free coins. ${REFERRAL_LINK}`,
      });
    } catch {}
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Invite Friends" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Earn Free Coins</Text>
          <Text style={styles.heroSubtext}>
            Share your code with friends. When they sign up, you both earn coins!
          </Text>
        </View>

        {/* Referral Code */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <Text style={styles.code}>{REFERRAL_CODE}</Text>
          <TouchableOpacity style={styles.copyButton}>
            <Text style={styles.copyText}>Copy Code</Text>
          </TouchableOpacity>
        </View>

        <Button
          title="Share Invite Link"
          onPress={handleShare}
          variant="primary"
          size="lg"
          fullWidth
        />

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Friends Invited</Text>
          </View>
          <View style={styles.stat}>
            <CoinDisplay amount={0} size="md" />
            <Text style={styles.statLabel}>Coins Earned</Text>
          </View>
        </View>

        {/* Rewards Info */}
        <View style={styles.rewardInfo}>
          <Text style={styles.rewardTitle}>How it works</Text>
          <Text style={styles.rewardStep}>1. Share your code with friends</Text>
          <Text style={styles.rewardStep}>2. They sign up using your code</Text>
          <Text style={styles.rewardStep}>3. You both get 50 coins!</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  content: { paddingHorizontal: 16, paddingBottom: 100 },
  hero: { alignItems: "center", marginBottom: 32 },
  heroTitle: { color: "#FFFFFF", fontSize: 28, fontWeight: "700", marginBottom: 8 },
  heroSubtext: { color: "#A3A3A3", fontSize: 14, textAlign: "center" },
  codeCard: {
    backgroundColor: "#1F1133",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  codeLabel: { color: "#A3A3A3", fontSize: 13, marginBottom: 8 },
  code: {
    color: "#8B5CF6",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 4,
    marginBottom: 12,
  },
  copyButton: {
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  copyText: { color: "#8B5CF6", fontSize: 14, fontWeight: "600" },
  statsRow: {
    flexDirection: "row",
    marginTop: 24,
    gap: 12,
  },
  stat: {
    flex: 1,
    backgroundColor: "#1F1133",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statNumber: { color: "#FFFFFF", fontSize: 24, fontWeight: "700", marginBottom: 4 },
  statLabel: { color: "#A3A3A3", fontSize: 12, marginTop: 4 },
  rewardInfo: {
    backgroundColor: "#1F1133",
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
  },
  rewardTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700", marginBottom: 12 },
  rewardStep: { color: "#A3A3A3", fontSize: 14, marginBottom: 6 },
});
