import React, {useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {usePackages, useBalance, usePurchaseMutation} from '../../hooks/useCoins';
import {colors, fontSizes, fontWeights, spacing, radii} from '../../theme';
import type {CoinPackageResponse} from '../../types/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CoinPackSheetProps {
  /** Called when user taps overlay or back to dismiss this sheet */
  onDismiss: () => void;
  /** Called after a successful purchase — parent can update balance display */
  onPurchased: () => void;
}

const {height: SCREEN_HEIGHT, width: SCREEN_WIDTH} = Dimensions.get('window');
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.6;
const CARD_GAP = spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - CARD_GAP) / 2;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CoinPackSheet({onDismiss, onPurchased}: CoinPackSheetProps) {
  const insets = useSafeAreaInsets();
  const {data: packages, isLoading: packagesLoading} = usePackages();
  const {data: balanceData} = useBalance();
  const purchaseMutation = usePurchaseMutation();

  const balance = balanceData?.balance ?? 0;

  const handlePurchase = useCallback(
    (pkg: CoinPackageResponse) => {
      Alert.alert(
        '\u0634\u0631\u0627\u0621 \u0639\u0645\u0644\u0627\u062A',
        `${pkg.coin_amount} \u0639\u0645\u0644\u0629 \u0628\u0640 ${pkg.price_sar} \u0631.\u0633`,
        [
          {text: '\u0625\u0644\u063A\u0627\u0621', style: 'cancel'},
          {
            text: '\u0634\u0631\u0627\u0621',
            onPress: () => {
              purchaseMutation.mutate(
                {packageId: pkg.id, coinAmount: pkg.coin_amount},
                {onSuccess: () => onPurchased()},
              );
            },
          },
        ],
      );
    },
    [purchaseMutation, onPurchased],
  );

  const renderItem = useCallback(
    ({item}: {item: CoinPackageResponse}) => (
      <Pressable
        style={({pressed}) => [styles.packCard, pressed && styles.packCardPressed]}
        onPress={() => handlePurchase(item)}>
        <Text style={styles.packCoins}>{'\uD83E\uDE99'} {item.coin_amount}</Text>
        {item.description && (
          <Text style={styles.packBonus}>{item.description}</Text>
        )}
        <Text style={styles.packPrice}>{item.price_sar} {'\u0631.\u0633'}</Text>
      </Pressable>
    ),
    [handlePurchase],
  );

  const keyExtractor = useCallback((item: CoinPackageResponse) => item.id, []);

  return (
    <View style={styles.root}>
      <Pressable style={styles.overlay} onPress={onDismiss} />

      <View
        style={[
          styles.sheet,
          {maxHeight: SHEET_MAX_HEIGHT, paddingBottom: insets.bottom + spacing.lg},
        ]}>
        {/* Drag handle */}
        <View style={styles.dragHandleWrapper}>
          <View style={styles.dragHandle} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onDismiss} hitSlop={8}>
            <Text style={styles.backArrow}>{'\u276F'}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>
            {'\u0634\u0631\u0627\u0621 \u0639\u0645\u0644\u0627\u062A'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Current balance */}
        <Text style={styles.currentBalance}>
          {'\u0631\u0635\u064A\u062F\u0643:'} {balance} {'\uD83E\uDE99'}
        </Text>

        {/* Packages grid */}
        {packagesLoading ? (
          <ActivityIndicator size="large" color={colors.cta} style={styles.loading} />
        ) : (
          <FlatList
            data={packages}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
          />
        )}
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
    zIndex: 200,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backArrow: {
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
    width: 16,
  },
  currentBalance: {
    fontSize: fontSizes.body,
    color: colors.coin,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: spacing.lg,
  },
  loading: {
    marginTop: spacing.xl,
  },
  gridContent: {
    paddingHorizontal: spacing.lg,
  },
  gridRow: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  packCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.cardElevated,
    borderRadius: radii.card,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  packCardPressed: {
    opacity: 0.7,
  },
  packCoins: {
    fontSize: fontSizes.sectionTitle,
    fontWeight: fontWeights.bold,
    color: colors.text,
  },
  packBonus: {
    fontSize: fontSizes.caption,
    color: colors.cta,
    writingDirection: 'rtl',
  },
  packPrice: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.coin,
    marginTop: spacing.sm,
  },
});
