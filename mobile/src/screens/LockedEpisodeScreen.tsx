import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {colors, fontSizes, fontWeights, spacing, radii, sizes} from '../theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = NativeStackScreenProps<RootStackParamList, 'LockedEpisode'>;

const {height: SCREEN_HEIGHT} = Dimensions.get('window');
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.7;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Drag handle indicator at the top of the sheet */
function DragHandle() {
  return (
    <View style={styles.dragHandleWrapper}>
      <View style={styles.dragHandle} />
    </View>
  );
}

/** Balance helper shown when user cannot afford the episode */
function BalanceHelper({
  deficit,
  onBuyCoins,
  onEarnFree,
}: {
  deficit: number;
  onBuyCoins: () => void;
  onEarnFree: () => void;
}) {
  return (
    <View style={styles.balanceHelper}>
      <Text style={styles.balanceHelperText}>
        {'\u064A\u0646\u0642\u0635\u0643'} {deficit}{' '}
        {'\u0639\u0645\u0644\u0627\u062A'}
      </Text>
      <View style={styles.balanceHelperLinks}>
        <Pressable onPress={onBuyCoins} hitSlop={8}>
          <Text style={styles.balanceHelperBuy}>
            {'\u0634\u0631\u0627\u0621 \u0639\u0645\u0644\u0627\u062A'}
          </Text>
        </Pressable>
        <Text style={styles.balanceHelperSep}>{'\u00B7'}</Text>
        <Pressable onPress={onEarnFree} hitSlop={8}>
          <Text style={styles.balanceHelperEarn}>
            {'\u0627\u0643\u0633\u0628 \u0645\u062C\u0627\u0646\u0627\u064B'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Subscription upsell card */
function SubscriptionUpsell({onSubscribe}: {onSubscribe: () => void}) {
  return (
    <View style={styles.subsCard}>
      <View style={styles.subsHeader}>
        <Text style={styles.subsCrown}>{'\uD83D\uDC51'}</Text>
        <Text style={styles.subsTitle}>
          {'\u0627\u0634\u062A\u0631\u0643 \u0648\u0648\u0641\u0631'}
        </Text>
      </View>
      <Text style={styles.subsDescription}>
        {'\u0634\u0627\u0647\u062F \u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u0644\u0642\u0627\u062A \u0628\u0644\u0627 \u062D\u062F\u0648\u062F'}
      </Text>
      <Pressable style={styles.subsButton} onPress={onSubscribe}>
        <Text style={styles.subsButtonText}>
          {'\u0627\u0634\u062A\u0631\u0643 \u0627\u0644\u0622\u0646'}
        </Text>
      </Pressable>
    </View>
  );
}

/** Earn free coins card */
function EarnFreeCoins({
  onDailyRewards,
  onReferral,
}: {
  onDailyRewards: () => void;
  onReferral: () => void;
}) {
  return (
    <View style={styles.earnCard}>
      <Text style={styles.earnTitle}>
        {'\u0627\u0643\u0633\u0628 \u0639\u0645\u0644\u0627\u062A \u0645\u062C\u0627\u0646\u064A\u0629'}
      </Text>

      {/* Daily reward row */}
      <Pressable style={styles.earnRow} onPress={onDailyRewards}>
        <Text style={styles.earnChevron}>{'\u276E'}</Text>
        <View style={styles.earnRowContent}>
          <Text style={styles.earnRowText}>
            {'\u0627\u062C\u0645\u0639 \u0645\u0643\u0627\u0641\u0623\u062A\u0643 \u0627\u0644\u064A\u0648\u0645\u064A\u0629'}
          </Text>
        </View>
        <Text style={styles.earnRowIcon}>{'\uD83D\uDD25'}</Text>
      </Pressable>

      {/* Divider */}
      <View style={styles.earnDivider} />

      {/* Referral row */}
      <Pressable style={styles.earnRow} onPress={onReferral}>
        <Text style={styles.earnChevron}>{'\u276E'}</Text>
        <View style={styles.earnRowContent}>
          <Text style={styles.earnRowText}>
            {'\u0627\u062F\u0639\u064F \u0635\u062F\u064A\u0642\u0627\u064B \u0648\u0627\u062D\u0635\u0644 \u0639\u0644\u0649 50 \u0639\u0645\u0644\u0629'}
          </Text>
        </View>
        <Text style={styles.earnRowIcon}>{'\uD83C\uDF81'}</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function LockedEpisodeScreen({navigation, route}: Props) {
  const insets = useSafeAreaInsets();
  const {episodeId, coinCost} = route.params;
  const [balance] = useState(23);

  const canAfford = balance >= coinCost;
  const deficit = coinCost - balance;

  const dismiss = () => navigation.goBack();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Semi-transparent overlay — tapping dismisses */}
      <Pressable style={styles.overlay} onPress={dismiss} />

      {/* Bottom sheet */}
      <View
        style={[
          styles.sheet,
          {maxHeight: SHEET_MAX_HEIGHT, paddingBottom: insets.bottom + spacing.lg},
        ]}>
        <DragHandle />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}>
          {/* ---- Emotional context header ---- */}
          <Text style={styles.emotionalTeaser}>
            {'\u0645\u0627\u0630\u0627 \u0633\u064A\u062D\u062F\u062B \u0628\u0639\u062F \u0630\u0644\u0643\u061F'}
          </Text>

          {/* ---- Lock icon ---- */}
          <View style={styles.lockIconWrapper}>
            <View style={styles.lockGlow} />
            <Text style={styles.lockIcon}>{'\uD83D\uDD12'}</Text>
          </View>

          {/* ---- Locked message ---- */}
          <Text style={styles.lockedHeading}>
            {'\u0647\u0630\u0647 \u0627\u0644\u062D\u0644\u0642\u0629 \u0645\u0642\u0641\u0644\u0629'}
          </Text>
          <Text style={styles.episodeInfo}>
            {'\u062D'} {episodeId.replace(/\D/g, '') || '32'}{' '}
            {'\u2014 \u0627\u0644\u0643\u0634\u0641'}
          </Text>

          {/* ---- Primary CTA: Coin unlock ---- */}
          <Pressable
            style={[styles.unlockButton, !canAfford && styles.unlockButtonDisabled]}
            onPress={dismiss}>
            <Text style={styles.unlockCoinIcon}>{'\uD83E\uDE99'}</Text>
            <Text style={styles.unlockButtonText}>
              {'\u0627\u0641\u062A\u062D \u0628\u0640'} {coinCost}{' '}
              {'\u0639\u0645\u0644\u0627\u062A'}
            </Text>
          </Pressable>

          {/* Balance display */}
          <Text style={[styles.balanceText, !canAfford && styles.balanceTextInsufficient]}>
            {'\u0631\u0635\u064A\u062F\u0643:'} {balance}{' '}
            {'\u0639\u0645\u0644\u0629'}
          </Text>

          {/* Balance helper when insufficient */}
          {!canAfford && (
            <BalanceHelper
              deficit={deficit}
              onBuyCoins={() => navigation.navigate('CoinStore')}
              onEarnFree={() => navigation.navigate('DailyRewards')}
            />
          )}

          {/* ---- Subscription upsell ---- */}
          <SubscriptionUpsell
            onSubscribe={() => navigation.navigate('Subscriptions')}
          />

          {/* ---- Earn Free Coins section ---- */}
          <EarnFreeCoins
            onDailyRewards={() => navigation.navigate('DailyRewards')}
            onReferral={() => navigation.navigate('Referral')}
          />

          {/* ---- Dismiss button ---- */}
          <Pressable style={styles.dismissButton} onPress={dismiss} hitSlop={12}>
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
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },

  /* ---- Sheet container ---- */
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },

  /* ---- Drag handle ---- */
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

  /* ---- Emotional teaser ---- */
  emotionalTeaser: {
    fontSize: fontSizes.button,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },

  /* ---- Lock icon ---- */
  lockIconWrapper: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
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

  /* ---- Locked heading ---- */
  lockedHeading: {
    fontSize: fontSizes.sectionTitle,
    fontWeight: fontWeights.bold,
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: spacing.xs,
  },
  episodeInfo: {
    fontSize: fontSizes.body,
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: spacing.xl,
  },

  /* ---- Unlock button ---- */
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cta,
    height: sizes.buttonHeight,
    borderRadius: radii.pill,
    gap: spacing.sm,
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

  /* ---- Balance display ---- */
  balanceText: {
    fontSize: fontSizes.caption,
    color: colors.coin,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  balanceTextInsufficient: {
    color: colors.error,
  },

  /* ---- Balance helper ---- */
  balanceHelper: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  balanceHelperText: {
    fontSize: fontSizes.body,
    color: colors.coin,
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
  },
  balanceHelperLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  balanceHelperBuy: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.cta,
  },
  balanceHelperSep: {
    fontSize: fontSizes.body,
    color: colors.textDim,
  },
  balanceHelperEarn: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.cta,
  },

  /* ---- Subscription upsell ---- */
  subsCard: {
    backgroundColor: colors.cardElevated,
    borderRadius: radii.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  subsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  subsCrown: {
    fontSize: 18,
  },
  subsTitle: {
    fontSize: fontSizes.button,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    writingDirection: 'rtl',
  },
  subsDescription: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.md,
  },
  subsButton: {
    height: sizes.buttonHeightSm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.coin,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subsButtonText: {
    fontSize: fontSizes.button,
    fontWeight: fontWeights.semibold,
    color: colors.coin,
    writingDirection: 'rtl',
  },

  /* ---- Earn free coins ---- */
  earnCard: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: 'rgba(0, 184, 86, 0.30)',
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  earnTitle: {
    fontSize: fontSizes.button,
    fontWeight: fontWeights.bold,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.md,
  },
  earnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  earnRowIcon: {
    fontSize: 18,
    marginLeft: spacing.md,
  },
  earnRowContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  earnRowText: {
    fontSize: fontSizes.body,
    color: colors.text,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  earnChevron: {
    fontSize: 12,
    color: colors.textMuted,
  },
  earnDivider: {
    height: 1,
    backgroundColor: colors.border,
  },

  /* ---- Dismiss button ---- */
  dismissButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
  dismissText: {
    fontSize: fontSizes.body,
    color: colors.textDim,
    writingDirection: 'rtl',
  },
});
