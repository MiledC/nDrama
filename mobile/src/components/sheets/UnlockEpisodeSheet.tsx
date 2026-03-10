import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useBalance, useSpendMutation} from '../../hooks/useCoins';
import {colors, fontSizes, fontWeights, spacing, radii, sizes} from '../../theme';
import type {AxiosError} from 'axios';
import CoinPackSheet from './CoinPackSheet';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UnlockEpisodeSheetProps {
  episodeId: string;
  episodeNumber: number;
  episodeTitle: string;
  coinCost: number;
  /** Called after successful unlock — parent should start playing the episode */
  onUnlocked: () => void;
  /** Called when user dismisses the sheet */
  onDismiss: () => void;
}

const {height: SCREEN_HEIGHT} = Dimensions.get('window');
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.65;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function UnlockEpisodeSheet({
  episodeId,
  episodeNumber,
  episodeTitle,
  coinCost,
  onUnlocked,
  onDismiss,
}: UnlockEpisodeSheetProps) {
  const insets = useSafeAreaInsets();
  const {data: balanceData, isLoading: balanceLoading} = useBalance();
  const spendMutation = useSpendMutation();
  const [showCoinPacks, setShowCoinPacks] = useState(false);

  const balance = balanceData?.balance ?? 0;
  const canAfford = balance >= coinCost;

  const handleUnlock = useCallback(() => {
    spendMutation.mutate(
      {episodeId, cost: coinCost},
      {
        onSuccess: () => onUnlocked(),
        onError: (error) => {
          const status = (error as AxiosError)?.response?.status;
          if (status === 409) {
            // Already unlocked
            onUnlocked();
          } else {
            Alert.alert(
              '\u062E\u0637\u0623',
              '\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0641\u062A\u062D \u0627\u0644\u062D\u0644\u0642\u0629',
            );
          }
        },
      },
    );
  }, [episodeId, coinCost, spendMutation, onUnlocked]);

  // When coin packs are visible, show that sheet instead
  if (showCoinPacks) {
    return (
      <CoinPackSheet
        onDismiss={() => setShowCoinPacks(false)}
        onPurchased={() => setShowCoinPacks(false)}
      />
    );
  }

  return (
    <View style={styles.root}>
      {/* Overlay — tapping dismisses */}
      <Pressable style={styles.overlay} onPress={onDismiss} />

      {/* Sheet */}
      <View
        style={[
          styles.sheet,
          {maxHeight: SHEET_MAX_HEIGHT, paddingBottom: insets.bottom + spacing.lg},
        ]}>
        {/* Drag handle */}
        <View style={styles.dragHandleWrapper}>
          <View style={styles.dragHandle} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}>
          {/* Lock icon */}
          <View style={styles.lockIconWrapper}>
            <View style={styles.lockGlow} />
            <Text style={styles.lockIcon}>{'\uD83D\uDD12'}</Text>
          </View>

          {/* Episode info */}
          <Text style={styles.episodeInfo}>
            {'\u062D'} {episodeNumber} — {episodeTitle}
          </Text>

          {/* Locked heading */}
          <Text style={styles.lockedHeading}>
            {'\u0647\u0630\u0647 \u0627\u0644\u062D\u0644\u0642\u0629 \u0645\u0642\u0641\u0644\u0629'}
          </Text>

          {/* Unlock button */}
          <Pressable
            style={[
              styles.unlockButton,
              (!canAfford || spendMutation.isPending) && styles.unlockButtonDisabled,
            ]}
            onPress={handleUnlock}
            disabled={!canAfford || spendMutation.isPending}>
            {spendMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <>
                <Text style={styles.unlockCoinIcon}>{'\uD83E\uDE99'}</Text>
                <Text style={styles.unlockButtonText}>
                  {'\u0627\u0641\u062A\u062D \u0628\u0640'} {coinCost}{' '}
                  {'\u0639\u0645\u0644\u0627\u062A'}
                </Text>
              </>
            )}
          </Pressable>

          {/* Balance display */}
          {balanceLoading ? (
            <ActivityIndicator size="small" color={colors.coin} style={styles.balanceLoading} />
          ) : (
            <Text style={[styles.balanceText, !canAfford && styles.balanceInsufficient]}>
              {'\u0631\u0635\u064A\u062F\u0643:'} {balance} {'\u0639\u0645\u0644\u0629'}
            </Text>
          )}

          {/* Get more coins link when insufficient */}
          {!canAfford && !balanceLoading && (
            <Pressable onPress={() => setShowCoinPacks(true)} hitSlop={8}>
              <Text style={styles.getMoreCoins}>
                {'\u0627\u062D\u0635\u0644 \u0639\u0644\u0649 \u0639\u0645\u0644\u0627\u062A'}
              </Text>
            </Pressable>
          )}

          {/* Dismiss */}
          <Pressable style={styles.dismissButton} onPress={onDismiss} hitSlop={12}>
            <Text style={styles.dismissText}>
              {'\u0644\u064A\u0633 \u0627\u0644\u0622\u0646'}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    overflow: 'hidden',
  },
  dragHandleWrapper: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  lockIconWrapper: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  lockGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    backgroundColor: 'rgba(212, 168, 67, 0.15)',
  },
  lockIcon: {
    fontSize: 32,
  },
  episodeInfo: {
    fontSize: fontSizes.body,
    color: colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  lockedHeading: {
    fontSize: fontSizes.sectionTitle,
    fontWeight: fontWeights.bold,
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: spacing.xl,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cta,
    height: sizes.buttonHeight,
    borderRadius: radii.pill,
    gap: spacing.sm,
    width: '100%',
  },
  unlockButtonDisabled: {
    opacity: 0.5,
  },
  unlockCoinIcon: {
    fontSize: 18,
  },
  unlockButtonText: {
    fontSize: fontSizes.button,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    writingDirection: 'rtl',
  },
  balanceText: {
    fontSize: fontSizes.caption,
    color: colors.coin,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  balanceInsufficient: {
    color: colors.error,
  },
  balanceLoading: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  getMoreCoins: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.cta,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: spacing.lg,
  },
  dismissButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  dismissText: {
    fontSize: fontSizes.body,
    color: colors.textDim,
    writingDirection: 'rtl',
  },
});
