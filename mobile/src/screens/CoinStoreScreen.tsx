import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {useBalance, usePackages, usePurchaseMutation, useTransactions} from '../hooks/useCoins';
import type {CoinPackageResponse, TransactionResponse} from '../types/api';
import {colors, fontSizes, fontWeights, spacing, radii, sizes} from '../theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = NativeStackScreenProps<RootStackParamList, 'CoinStore'>;

interface EarnOption {
  id: string;
  icon: string;
  title: string;
  description: string;
  target: 'DailyRewards' | 'Referral' | 'Achievements';
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

const TRANSACTION_TYPE_LABELS: Record<TransactionResponse['type'], string> = {
  purchase: '\u0634\u0631\u0627\u0621',
  spend: '\u0641\u062A\u062D \u062D\u0644\u0642\u0629',
  refund: '\u0627\u0633\u062A\u0631\u062F\u0627\u062F',
  promo: '\u0639\u0631\u0636 \u062A\u0631\u0648\u064A\u062C\u064A',
  adjustment: '\u062A\u0639\u062F\u064A\u0644',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Balance display with coin icon */
function BalanceDisplay({balance, isLoading}: {balance: number; isLoading: boolean}) {
  return (
    <View style={styles.balanceContainer}>
      <Text style={styles.balanceCoinIcon}>{'\uD83E\uDE99'}</Text>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.coin} />
      ) : (
        <Text style={styles.balanceAmount}>{balance}</Text>
      )}
      <Text style={styles.balanceLabel}>
        {'\u0639\u0645\u0644\u0629'}
      </Text>
    </View>
  );
}

/** Single coin package card */
function PackageCard({
  pkg,
  isPurchasing,
  onPress,
}: {
  pkg: CoinPackageResponse;
  isPurchasing: boolean;
  onPress: () => void;
}) {
  return (
    <View style={styles.packageCard}>
      <View style={styles.packageContent}>
        <View style={styles.packageLeft}>
          <Text style={styles.packageCoinIcon}>{'\uD83E\uDE99'}</Text>
          <View>
            <Text style={styles.packageAmount}>
              {pkg.coin_amount} {'\u0639\u0645\u0644\u0629'}
            </Text>
            {pkg.description && (
              <Text style={styles.packageBonus}>{pkg.description}</Text>
            )}
          </View>
        </View>

        <Pressable
          style={[styles.priceButton, isPurchasing && styles.priceButtonDisabled]}
          onPress={onPress}
          disabled={isPurchasing}>
          {isPurchasing ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Text style={styles.priceButtonText}>
              {pkg.price_sar} {'\u0631.\u0633'}
            </Text>
          )}
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

/** Single transaction row */
function TransactionRow({tx}: {tx: TransactionResponse}) {
  const isPositive = tx.amount > 0;
  const date = new Date(tx.created_at);
  const dateStr = date.toLocaleDateString('ar-SA', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <View style={styles.txRow}>
      <View style={styles.txLeft}>
        <Text style={styles.txType}>
          {TRANSACTION_TYPE_LABELS[tx.type] ?? tx.type}
        </Text>
        <Text style={styles.txDate}>{dateStr}</Text>
      </View>
      <Text style={[styles.txAmount, isPositive ? styles.txPositive : styles.txNegative]}>
        {isPositive ? '+' : ''}{tx.amount}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function CoinStoreScreen({navigation}: Props) {
  const insets = useSafeAreaInsets();

  const {data: balanceData, isLoading: balanceLoading} = useBalance();
  const {data: packages, isLoading: packagesLoading} = usePackages();
  const purchaseMutation = usePurchaseMutation();

  const [showHistory, setShowHistory] = useState(false);
  const [txOffset, setTxOffset] = useState(0);
  const {data: txData, isLoading: txLoading} = useTransactions(txOffset, 20);

  const balance = balanceData?.balance ?? 0;

  const handlePackagePurchase = useCallback(
    (pkg: CoinPackageResponse) => {
      purchaseMutation.mutate(
        {packageId: pkg.id, coinAmount: pkg.coin_amount},
        {
          onSuccess: () => {
            Alert.alert(
              '\u062A\u0645 \u0627\u0644\u0634\u0631\u0627\u0621',
              `\u062A\u0645\u062A \u0625\u0636\u0627\u0641\u0629 ${pkg.coin_amount} \u0639\u0645\u0644\u0629 \u0625\u0644\u0649 \u0631\u0635\u064A\u062F\u0643`,
            );
          },
          onError: () => {
            Alert.alert(
              '\u062E\u0637\u0623',
              '\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u0634\u0631\u0627\u0621',
            );
          },
        },
      );
    },
    [purchaseMutation],
  );

  const handleEarnOptionPress = useCallback(
    (option: EarnOption) => {
      if (option.target === 'DailyRewards') {
        navigation.navigate('DailyRewards');
      } else if (option.target === 'Referral') {
        navigation.navigate('Referral');
      } else {
        console.log('Navigate to Achievements (not yet implemented)');
      }
    },
    [navigation],
  );

  const hasMoreTx = txData ? txOffset + 20 < txData.total : false;

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

        {/* Balance Display */}
        <BalanceDisplay balance={balance} isLoading={balanceLoading} />

        {/* Coin Packages */}
        <View style={styles.packagesSection}>
          {packagesLoading ? (
            <ActivityIndicator size="large" color={colors.cta} style={styles.loadingCenter} />
          ) : (
            (packages ?? []).map(pkg => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                isPurchasing={
                  purchaseMutation.isPending &&
                  purchaseMutation.variables?.packageId === pkg.id
                }
                onPress={() => handlePackagePurchase(pkg)}
              />
            ))
          )}
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

        {/* Transaction History */}
        <Pressable
          style={styles.historyToggle}
          onPress={() => setShowHistory(prev => !prev)}>
          <Text style={styles.historyToggleText}>
            {'\u0633\u062C\u0644 \u0627\u0644\u0645\u0639\u0627\u0645\u0644\u0627\u062A'}
          </Text>
          <Text style={styles.historyToggleIcon}>
            {showHistory ? '\u25B2' : '\u25BC'}
          </Text>
        </Pressable>

        {showHistory && (
          <View style={styles.historySection}>
            {txLoading ? (
              <ActivityIndicator size="small" color={colors.cta} style={styles.loadingCenter} />
            ) : (txData?.items ?? []).length === 0 ? (
              <Text style={styles.historyEmpty}>
                {'\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0639\u0627\u0645\u0644\u0627\u062A \u0628\u0639\u062F'}
              </Text>
            ) : (
              <>
                {(txData?.items ?? []).map(tx => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))}
                {hasMoreTx && (
                  <Pressable
                    style={styles.loadMoreButton}
                    onPress={() => setTxOffset(prev => prev + 20)}>
                    <Text style={styles.loadMoreText}>
                      {'\u0639\u0631\u0636 \u0627\u0644\u0645\u0632\u064A\u062F'}
                    </Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        )}

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
  loadingCenter: {
    paddingVertical: spacing.xl,
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
  priceButtonDisabled: {
    opacity: 0.6,
  },
  priceButtonText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.text,
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

  /* ---- Transaction History ---- */
  historyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  historyToggleText: {
    fontSize: fontSizes.cardTitle,
    fontWeight: fontWeights.bold,
    color: colors.text,
    writingDirection: 'rtl',
  },
  historyToggleIcon: {
    fontSize: 12,
    color: colors.textMuted,
  },
  historySection: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: spacing.lg,
    marginBottom: spacing.section,
  },
  historyEmpty: {
    fontSize: fontSizes.body,
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
    paddingVertical: spacing.lg,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  txLeft: {
    flex: 1,
  },
  txType: {
    fontSize: fontSizes.body,
    color: colors.text,
    writingDirection: 'rtl',
  },
  txDate: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
    writingDirection: 'rtl',
    marginTop: 2,
  },
  txAmount: {
    fontSize: fontSizes.cardTitle,
    fontWeight: fontWeights.bold,
    fontVariant: ['tabular-nums'],
  },
  txPositive: {
    color: colors.cta,
  },
  txNegative: {
    color: colors.error,
  },
  loadMoreButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  loadMoreText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.cta,
    writingDirection: 'rtl',
  },

  /* ---- Bottom spacer ---- */
  bottomSpacer: {
    height: spacing.section,
  },
});
