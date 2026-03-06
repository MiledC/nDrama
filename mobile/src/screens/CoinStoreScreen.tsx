import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {colors, fontSizes, fontWeights, spacing, radii, sizes} from '../theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = NativeStackScreenProps<RootStackParamList, 'CoinStore'>;

interface CoinPackage {
  id: string;
  amount: number;
  bonus: number | null;
  price: string;
  badge: 'popular' | 'bestValue' | null;
}

interface EarnOption {
  id: string;
  icon: string;
  title: string;
  description: string;
  target: 'DailyRewards' | 'Referral' | 'Achievements';
}

// ---------------------------------------------------------------------------
// Mock data & flags
// ---------------------------------------------------------------------------

const isPromoActive = true;
const isFirstPurchase = true;
const userBalance = 23;

const COIN_PACKAGES: CoinPackage[] = [
  {id: 'pkg-50', amount: 50, bonus: null, price: '9.99 ر.س', badge: null},
  {id: 'pkg-120', amount: 120, bonus: 10, price: '19.99 ر.س', badge: 'popular'},
  {id: 'pkg-300', amount: 300, bonus: 10, price: '39.99 ر.س', badge: 'bestValue'},
];

const EARN_OPTIONS: EarnOption[] = [
  {
    id: 'daily',
    icon: '\uD83D\uDD25',
    title: '\u0627\u0644\u0645\u0643\u0627\u0641\u0623\u0629 \u0627\u0644\u064A\u0648\u0645\u064A\u0629',
    description: '\u0627\u062C\u0645\u0639 \u062D\u062A\u0649 20 \u0639\u0645\u0644\u0629 \u064A\u0648\u0645\u064A\u0627\u064B',
    target: 'DailyRewards',
  },
  {
    id: 'referral',
    icon: '\uD83C\uDF81',
    title: '\u0627\u062F\u0639\u064F \u0623\u0635\u062F\u0642\u0627\u0621\u0643',
    description: '50 \u0639\u0645\u0644\u0629 \u0644\u0643\u0644 \u0635\u062F\u064A\u0642',
    target: 'Referral',
  },
  {
    id: 'achievements',
    icon: '\uD83C\uDFC6',
    title: '\u0627\u0644\u0625\u0646\u062C\u0627\u0632\u0627\u062A',
    description: '\u0627\u0643\u0633\u0628 \u0639\u0645\u0644\u0627\u062A \u0628\u0625\u0643\u0645\u0627\u0644 \u0627\u0644\u062A\u062D\u062F\u064A\u0627\u062A',
    target: 'Achievements',
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Promotional banner with countdown */
function PromoBanner() {
  if (!isPromoActive) {
    return null;
  }

  return (
    <View style={styles.promoBanner}>
      <Text style={styles.promoTitle}>
        {'\u0639\u0631\u0636 \u062E\u0627\u0635! \u0636\u0639\u0641 \u0627\u0644\u0639\u0645\u0644\u0627\u062A'}
      </Text>
      <View style={styles.promoTimerRow}>
        <Text style={styles.promoTimerPrefix}>
          {'\u064A\u0646\u062A\u0647\u064A \u062E\u0644\u0627\u0644'}
        </Text>
        <Text style={styles.promoTimer}>23:45:12</Text>
      </View>
    </View>
  );
}

/** Balance display with coin icon */
function BalanceDisplay() {
  return (
    <View style={styles.balanceContainer}>
      <Text style={styles.balanceCoinIcon}>{'\uD83E\uDE99'}</Text>
      <Text style={styles.balanceAmount}>{userBalance}</Text>
      <Text style={styles.balanceLabel}>
        {'\u0639\u0645\u0644\u0629'}
      </Text>
    </View>
  );
}

/** Single coin package card */
function PackageCard({
  pkg,
  index,
  onPress,
}: {
  pkg: CoinPackage;
  index: number;
  onPress: () => void;
}) {
  return (
    <View style={styles.packageCard}>
      {/* First purchase badge — top-left (RTL: visually top-right) */}
      {isFirstPurchase && index === 0 && (
        <View style={styles.firstPurchaseBadge}>
          <Text style={styles.firstPurchaseBadgeText}>
            {'\u0645\u0643\u0627\u0641\u0623\u0629 \u0623\u0648\u0644 \u0634\u0631\u0627\u0621: 2x!'}
          </Text>
        </View>
      )}

      {/* Popular / Best Value badge — top-right (RTL: visually top-left) */}
      {pkg.badge === 'popular' && (
        <View style={styles.badgePopular}>
          <Text style={styles.badgeText}>
            {'\u0627\u0644\u0623\u0643\u062B\u0631 \u0634\u0639\u0628\u064A\u0629'}
          </Text>
        </View>
      )}
      {pkg.badge === 'bestValue' && (
        <View style={styles.badgeBestValue}>
          <Text style={styles.badgeText}>
            {'\u0623\u0641\u0636\u0644 \u0642\u064A\u0645\u0629'}
          </Text>
        </View>
      )}

      <View style={styles.packageContent}>
        {/* Left side: coin icon + amount */}
        <View style={styles.packageLeft}>
          <Text style={styles.packageCoinIcon}>{'\uD83E\uDE99'}</Text>
          <View>
            <Text style={styles.packageAmount}>
              {pkg.amount} {'\u0639\u0645\u0644\u0629'}
            </Text>
            {pkg.bonus != null && pkg.bonus > 0 && (
              <Text style={styles.packageBonus}>
                +{pkg.bonus} {'\u0645\u062C\u0627\u0646\u0627\u064B'}
              </Text>
            )}
          </View>
        </View>

        {/* Right side: price button */}
        <Pressable style={styles.priceButton} onPress={onPress}>
          <Text style={styles.priceButtonText}>{pkg.price}</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Earn free coins row item */
function EarnRow({
  option,
  isLast,
  onPress,
}: {
  option: EarnOption;
  isLast: boolean;
  onPress: () => void;
}) {
  return (
    <>
      <Pressable style={styles.earnRow} onPress={onPress}>
        <Text style={styles.earnIcon}>{option.icon}</Text>
        <View style={styles.earnTextContainer}>
          <Text style={styles.earnTitle}>{option.title}</Text>
          <Text style={styles.earnDescription}>{option.description}</Text>
        </View>
        <Text style={styles.earnChevron}>{'\u276E'}</Text>
      </Pressable>
      {!isLast && <View style={styles.earnDivider} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function CoinStoreScreen({navigation}: Props) {
  const insets = useSafeAreaInsets();

  const handlePackagePurchase = (pkg: CoinPackage) => {
    // IAP flow placeholder
    console.log('Purchase package:', pkg.id);
  };

  const handleEarnOptionPress = (option: EarnOption) => {
    if (option.target === 'DailyRewards') {
      navigation.navigate('DailyRewards');
    } else if (option.target === 'Referral') {
      navigation.navigate('Referral');
    } else {
      // Achievements — no screen yet, just log
      console.log('Navigate to Achievements (not yet implemented)');
    }
  };

  const handlePromoCode = () => {
    // Promo code flow placeholder
    console.log('Open promo code input');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={[styles.header, {paddingTop: insets.top + spacing.sm}]}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}>
          <Text style={styles.backIcon}>{'\u276F'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {'\u0645\u062A\u062C\u0631 \u0627\u0644\u0639\u0645\u0644\u0627\u062A'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Promotional Banner */}
        <PromoBanner />

        {/* Balance Display */}
        <BalanceDisplay />

        {/* Coin Packages */}
        <View style={styles.packagesSection}>
          {COIN_PACKAGES.map((pkg, index) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              index={index}
              onPress={() => handlePackagePurchase(pkg)}
            />
          ))}
        </View>

        {/* Earn Free Coins */}
        <View style={styles.earnCard}>
          <Text style={styles.earnHeader}>
            {'\u0627\u0643\u0633\u0628 \u0639\u0645\u0644\u0627\u062A \u0645\u062C\u0627\u0646\u064A\u0629'}
          </Text>
          {EARN_OPTIONS.map((option, index) => (
            <EarnRow
              key={option.id}
              option={option}
              isLast={index === EARN_OPTIONS.length - 1}
              onPress={() => handleEarnOptionPress(option)}
            />
          ))}
        </View>

        {/* Subscription Upsell */}
        <Pressable
          style={styles.subscriptionCard}
          onPress={() => navigation.navigate('Subscriptions')}>
          <View style={styles.subscriptionContent}>
            <Text style={styles.subscriptionIcon}>{'\uD83D\uDC51'}</Text>
            <View style={styles.subscriptionTextContainer}>
              <Text style={styles.subscriptionTitle}>
                {'\u0648\u0641\u0631 \u0623\u0643\u062B\u0631 \u0645\u0639 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643'}
              </Text>
              <Text style={styles.subscriptionDescription}>
                {'\u0634\u0627\u0647\u062F \u0643\u0644 \u0627\u0644\u062D\u0644\u0642\u0627\u062A \u0628\u0644\u0627 \u062D\u062F\u0648\u062F'}
              </Text>
            </View>
          </View>
          <Pressable
            style={styles.viewPlansButton}
            onPress={() => navigation.navigate('Subscriptions')}>
            <Text style={styles.viewPlansText}>
              {'\u0639\u0631\u0636 \u0627\u0644\u062E\u0637\u0637'}
            </Text>
          </Pressable>
        </Pressable>

        {/* Promo Code Link */}
        <Pressable style={styles.promoCodeLink} onPress={handlePromoCode}>
          <Text style={styles.promoCodeText}>
            {'\u0644\u062F\u064A\u0643 \u0631\u0645\u0632 \u062A\u0631\u0648\u064A\u062C\u064A\u061F'}
          </Text>
        </Pressable>

        {/* Bottom spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.section * 2,
  },

  /* ---- Header ---- */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.bg,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 16,
    color: colors.text,
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSizes.sectionTitle,
    fontWeight: fontWeights.bold,
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  headerSpacer: {
    width: 36,
  },

  /* ---- Promotional Banner ---- */
  promoBanner: {
    backgroundColor: 'rgba(212, 168, 67, 0.10)',
    borderColor: 'rgba(212, 168, 67, 0.40)',
    borderWidth: 1,
    borderRadius: radii.card,
    padding: spacing.lg,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  promoTitle: {
    fontSize: fontSizes.cardTitle,
    fontWeight: fontWeights.bold,
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
  },
  promoTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  promoTimerPrefix: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },
  promoTimer: {
    fontSize: fontSizes.coinAmount,
    fontWeight: fontWeights.bold,
    color: colors.coin,
    fontVariant: ['tabular-nums'],
  },

  /* ---- Balance Display ---- */
  balanceContainer: {
    alignItems: 'center',
    marginTop: spacing.section,
    marginBottom: spacing.section,
    gap: spacing.sm,
  },
  balanceCoinIcon: {
    fontSize: 48,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: fontWeights.bold,
    color: colors.coin,
  },
  balanceLabel: {
    fontSize: fontSizes.body,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },

  /* ---- Coin Packages ---- */
  packagesSection: {
    gap: spacing.md,
    marginBottom: spacing.section,
  },
  packageCard: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: spacing.lg,
    position: 'relative',
    overflow: 'visible',
  },
  packageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  packageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  packageCoinIcon: {
    fontSize: 28,
  },
  packageAmount: {
    fontSize: fontSizes.cardTitle,
    fontWeight: fontWeights.bold,
    color: colors.text,
    writingDirection: 'rtl',
  },
  packageBonus: {
    fontSize: fontSizes.caption,
    color: colors.coin,
    writingDirection: 'rtl',
    marginTop: 2,
  },
  priceButton: {
    backgroundColor: colors.cta,
    height: sizes.buttonHeightXs,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceButtonText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.text,
  },

  /* ---- Package badges ---- */
  firstPurchaseBadge: {
    position: 'absolute',
    top: -spacing.sm,
    start: spacing.md,
    backgroundColor: colors.cta,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    zIndex: 10,
  },
  firstPurchaseBadgeText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    color: colors.text,
    writingDirection: 'rtl',
  },
  badgePopular: {
    position: 'absolute',
    top: -spacing.sm,
    end: spacing.md,
    backgroundColor: colors.cta,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    zIndex: 10,
  },
  badgeBestValue: {
    position: 'absolute',
    top: -spacing.sm,
    end: spacing.md,
    backgroundColor: colors.cta,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    zIndex: 10,
  },
  badgeText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    color: colors.text,
    writingDirection: 'rtl',
  },

  /* ---- Earn Free Coins ---- */
  earnCard: {
    backgroundColor: colors.card,
    borderColor: 'rgba(0, 184, 86, 0.30)',
    borderWidth: 1,
    borderRadius: radii.card,
    padding: spacing.lg,
    marginBottom: spacing.section,
  },
  earnHeader: {
    fontSize: fontSizes.cardTitle,
    fontWeight: fontWeights.bold,
    color: colors.text,
    writingDirection: 'rtl',
    marginBottom: spacing.lg,
  },
  earnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  earnIcon: {
    fontSize: 20,
    marginEnd: spacing.md,
  },
  earnTextContainer: {
    flex: 1,
  },
  earnTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
    color: colors.text,
    writingDirection: 'rtl',
  },
  earnDescription: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
    writingDirection: 'rtl',
    marginTop: 2,
  },
  earnChevron: {
    fontSize: 14,
    color: colors.textDim,
    marginStart: spacing.sm,
  },
  earnDivider: {
    height: 1,
    backgroundColor: colors.border,
  },

  /* ---- Subscription Upsell ---- */
  subscriptionCard: {
    backgroundColor: colors.cardElevated,
    borderColor: 'rgba(212, 168, 67, 0.30)',
    borderWidth: 1,
    borderRadius: radii.card,
    padding: spacing.lg,
    marginBottom: spacing.section,
    alignItems: 'center',
  },
  subscriptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  subscriptionIcon: {
    fontSize: 24,
  },
  subscriptionTextContainer: {
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: fontSizes.cardTitle,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    writingDirection: 'rtl',
  },
  subscriptionDescription: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
    writingDirection: 'rtl',
    marginTop: 2,
  },
  viewPlansButton: {
    borderColor: colors.coin,
    borderWidth: 1,
    height: sizes.buttonHeightXs,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewPlansText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.coin,
    writingDirection: 'rtl',
  },

  /* ---- Promo Code ---- */
  promoCodeLink: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  promoCodeText: {
    fontSize: fontSizes.body,
    color: colors.textMuted,
    writingDirection: 'rtl',
    textDecorationLine: 'underline',
  },

  /* ---- Bottom spacer ---- */
  bottomSpacer: {
    height: spacing.section,
  },
});
