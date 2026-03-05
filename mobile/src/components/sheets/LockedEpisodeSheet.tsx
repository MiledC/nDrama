import React, { useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { CoinDisplay } from "@/components/ui/CoinDisplay";
import { useCoinStore } from "@/stores/coinStore";
import { useAuthStore } from "@/stores/authStore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LockedEpisodeSheetProps {
  visible: boolean;
  onClose: () => void;
  episode: {
    id: string;
    title: string;
    episode_number: number;
    coin_price: number;
  } | null;
  onUnlock: (episodeId: string) => void;
  onNavigateCoinStore: () => void;
  onNavigateSubscriptions: () => void;
  onNavigateDailyRewards: () => void;
  onNavigateReferral: () => void;
  onNavigateLogin: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LockedEpisodeSheet({
  visible,
  onClose,
  episode,
  onUnlock,
  onNavigateCoinStore,
  onNavigateSubscriptions,
  onNavigateDailyRewards,
  onNavigateReferral,
  onNavigateLogin,
}: LockedEpisodeSheetProps) {
  const { t } = useTranslation();
  const sheetRef = useRef<BottomSheet>(null);
  const balance = useCoinStore((s) => s.balance);
  const isRegistered = useAuthStore((s) => s.isRegistered);

  const snapPoints = useMemo(() => ["60%", "85%"], []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
        pressBehavior="close"
      />
    ),
    []
  );

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  if (!visible || !episode) return null;

  const deficit = episode.coin_price - balance;
  const hasEnoughCoins = deficit <= 0;

  // -------------------------------------------------------------------------
  // Anonymous / not-signed-in variant
  // -------------------------------------------------------------------------
  if (!isRegistered) {
    return (
      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        onChange={handleSheetChange}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.indicator}
      >
        <BottomSheetScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Lock icon */}
          <View style={styles.lockIconContainer}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>

          <Text style={styles.heading}>
            {t("lockedEpisode.signInToWatch")}
          </Text>

          <Text style={styles.episodeInfo}>
            {t("lockedEpisode.episodeLabel", {
              number: episode.episode_number,
            })}{" "}
            — {episode.title}
          </Text>

          <Text style={styles.signInDescription}>
            {t("lockedEpisode.signInDescription")}
          </Text>

          <Button
            title={t("auth.login")}
            onPress={onNavigateLogin}
            variant="primary"
            size="md"
            fullWidth
            style={styles.primaryCta}
          />

          <Button
            title={t("auth.signUp")}
            onPress={onNavigateLogin}
            variant="gold"
            size="md"
            fullWidth
            style={styles.secondaryCta}
          />
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }

  // -------------------------------------------------------------------------
  // Signed-in variant
  // -------------------------------------------------------------------------
  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onChange={handleSheetChange}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.indicator}
    >
      <BottomSheetScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.lockIconContainer}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>

        <Text style={styles.teaser}>{t("lockedEpisode.teaser")}</Text>

        <Text style={styles.heading}>{t("lockedEpisode.title")}</Text>

        <Text style={styles.episodeInfo}>
          {t("lockedEpisode.episodeLabel", {
            number: episode.episode_number,
          })}{" "}
          — {episode.title}
        </Text>

        {/* Coin cost display */}
        <View style={styles.costBadge}>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>{t("lockedEpisode.cost")}</Text>
            <CoinDisplay amount={episode.coin_price} size="md" />
          </View>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>
              {t("lockedEpisode.yourBalance")}
            </Text>
            <CoinDisplay amount={balance} size="md" />
          </View>
          {!hasEnoughCoins && (
            <Text style={styles.deficitWarning}>
              {t("lockedEpisode.deficit", { amount: deficit })}
            </Text>
          )}
        </View>

        {/* Primary CTA */}
        <Button
          title={t("lockedEpisode.unlockEpisode")}
          onPress={() => onUnlock(episode.id)}
          variant="primary"
          size="md"
          fullWidth
          disabled={!hasEnoughCoins}
          style={styles.primaryCta}
        />

        {/* Divider with "or" */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t("lockedEpisode.or")}</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Subscription upsell card */}
        <View style={styles.subscriptionCard}>
          <Text style={styles.cardHeading}>
            {t("lockedEpisode.unlimitedAccess")}
          </Text>
          <Text style={styles.cardSubtext}>
            {t("lockedEpisode.subscriptionDescription")}
          </Text>
          <Button
            title={t("subscriptions.subscribe")}
            onPress={onNavigateSubscriptions}
            variant="gold"
            size="md"
            fullWidth
          />
        </View>

        {/* Earn free coins section */}
        <View style={styles.earnCard}>
          <Text style={styles.cardHeading}>
            {t("coins.earnFreeCoins")}
          </Text>

          <TouchableOpacity
            style={styles.earnRow}
            onPress={onNavigateDailyRewards}
            activeOpacity={0.7}
          >
            <Text style={styles.earnIcon}>🎁</Text>
            <Text style={styles.earnLabel}>
              {t("lockedEpisode.dailyReward")}
            </Text>
            <Text style={styles.earnArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.earnRow}
            onPress={onNavigateReferral}
            activeOpacity={0.7}
          >
            <Text style={styles.earnIcon}>👥</Text>
            <Text style={styles.earnLabel}>
              {t("lockedEpisode.referFriend")}
            </Text>
            <Text style={styles.earnArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom link */}
        <TouchableOpacity
          onPress={onNavigateCoinStore}
          style={styles.bottomLink}
          activeOpacity={0.7}
        >
          <Text style={styles.bottomLinkText}>
            {t("lockedEpisode.getMoreCoins")}
          </Text>
        </TouchableOpacity>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  background: {
    backgroundColor: "#1F1133",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  indicator: {
    backgroundColor: "#666666",
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    alignItems: "center",
  },

  // Lock icon
  lockIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(212, 168, 67, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  lockIcon: {
    fontSize: 24,
  },

  // Header text
  teaser: {
    fontSize: 14,
    color: "#A3A3A3",
    marginBottom: 4,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  episodeInfo: {
    fontSize: 14,
    color: "#A3A3A3",
    textAlign: "center",
    marginBottom: 20,
  },

  // Sign-in variant
  signInDescription: {
    fontSize: 14,
    color: "#A3A3A3",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 16,
  },

  // Cost badge
  costBadge: {
    width: "100%",
    backgroundColor: "#2A1845",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  costLabel: {
    fontSize: 14,
    color: "#A3A3A3",
  },
  deficitWarning: {
    fontSize: 13,
    color: "#EF4444",
    marginTop: 4,
  },

  // CTA buttons
  primaryCta: {
    marginBottom: 16,
  },
  secondaryCta: {
    marginBottom: 16,
  },

  // Divider
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#2A2A2A",
  },
  dividerText: {
    fontSize: 13,
    color: "#666666",
    marginHorizontal: 12,
  },

  // Subscription card
  subscriptionCard: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#D4A843",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  cardSubtext: {
    fontSize: 13,
    color: "#A3A3A3",
    marginBottom: 14,
    lineHeight: 18,
  },

  // Earn free coins card
  earnCard: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#00B856",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  earnRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  earnIcon: {
    fontSize: 18,
    marginEnd: 10,
  },
  earnLabel: {
    flex: 1,
    fontSize: 14,
    color: "#FFFFFF",
  },
  earnArrow: {
    fontSize: 20,
    color: "#666666",
  },

  // Bottom link
  bottomLink: {
    paddingVertical: 8,
  },
  bottomLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#D4A843",
  },
});
