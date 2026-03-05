import React, { useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Share,
  ScrollView,
} from "react-native";
import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";

interface ShareSheetProps {
  visible: boolean;
  onClose: () => void;
  series: { title: string; thumbnail_url: string | null };
  episode?: { title: string; episode_number: number };
}

interface ShareTarget {
  id: string;
  labelKey: string;
  icon: string;
  color: string;
}

const SHARE_TARGETS: ShareTarget[] = [
  { id: "whatsapp", labelKey: "share.whatsapp", icon: "W", color: "#25D366" },
  { id: "x", labelKey: "share.x", icon: "X", color: "#1DA1F2" },
  { id: "instagram", labelKey: "share.instagram", icon: "I", color: "#E4405F" },
  { id: "telegram", labelKey: "share.telegram", icon: "T", color: "#0088CC" },
  { id: "sms", labelKey: "share.sms", icon: "S", color: "#8B5CF6" },
  { id: "copyLink", labelKey: "share.copyLink", icon: "\u{1F517}", color: "#666666" },
  { id: "more", labelKey: "share.more", icon: "\u2022\u2022\u2022", color: "#A3A3A3" },
];

export function ShareSheet({
  visible,
  onClose,
  series,
  episode,
}: ShareSheetProps) {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => ["40%"], []);

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
      />
    ),
    []
  );

  const handleShare = useCallback(async () => {
    const message = episode
      ? t("share.messageWithEpisode", {
          series: series.title,
          episode: episode.episode_number,
        })
      : t("share.message", { series: series.title });

    try {
      await Share.share({ message });
    } catch {
      // User cancelled or share failed
    }
  }, [series.title, episode, t]);

  if (!visible) {
    return null;
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onChange={handleSheetChange}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.indicator}
    >
      <View style={styles.container}>
        {/* Share preview card */}
        <View style={styles.previewCard}>
          {series.thumbnail_url ? (
            <Image
              source={{ uri: series.thumbnail_url }}
              style={styles.thumbnail}
            />
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
              <Text style={styles.thumbnailPlaceholderText}>
                {series.title.charAt(0)}
              </Text>
            </View>
          )}
          <View style={styles.previewInfo}>
            <Text style={styles.previewTitle} numberOfLines={1}>
              {series.title}
            </Text>
            {episode && (
              <Text style={styles.previewEpisode} numberOfLines={1}>
                {t("share.episodeLabel", {
                  number: episode.episode_number,
                  title: episode.title,
                })}
              </Text>
            )}
          </View>
        </View>

        {/* Share targets */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.targetsRow}
        >
          {SHARE_TARGETS.map((target) => (
            <TouchableOpacity
              key={target.id}
              style={styles.targetItem}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.targetCircle,
                  { backgroundColor: target.color },
                ]}
              >
                <Text style={styles.targetIcon}>{target.icon}</Text>
              </View>
              <Text style={styles.targetLabel} numberOfLines={1}>
                {t(target.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Coin incentive */}
        <View style={styles.coinRow}>
          <Text style={styles.coinIcon}>{"\u{1FA99}"}</Text>
          <Text style={styles.coinText}>{t("share.earnCoins")}</Text>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: "#1F1133",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  indicator: {
    backgroundColor: "#666666",
    width: 36,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  previewCard: {
    flexDirection: "row",
    backgroundColor: "#2A1845",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  thumbnail: {
    width: 56,
    height: 78,
    borderRadius: 8,
  },
  thumbnailPlaceholder: {
    backgroundColor: "#3A2855",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailPlaceholderText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  previewInfo: {
    flex: 1,
    marginStart: 12,
    justifyContent: "center",
  },
  previewTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  previewEpisode: {
    color: "#A3A3A3",
    fontSize: 13,
    marginTop: 4,
  },
  targetsRow: {
    paddingHorizontal: 4,
    gap: 16,
  },
  targetItem: {
    alignItems: "center",
    width: 64,
  },
  targetCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  targetIcon: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  targetLabel: {
    color: "#A3A3A3",
    fontSize: 11,
    textAlign: "center",
  },
  coinRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    paddingVertical: 10,
    backgroundColor: "rgba(212, 168, 67, 0.1)",
    borderRadius: 8,
  },
  coinIcon: {
    fontSize: 16,
    marginEnd: 6,
  },
  coinText: {
    color: "#D4A843",
    fontSize: 14,
    fontWeight: "600",
  },
});
