import React, {useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {colors, fontSizes, fontWeights, spacing, radii} from '../theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = NativeStackScreenProps<RootStackParamList, 'Referral'>;

type ReferralStatus = 'joined' | 'pending';

interface ReferralEntry {
  id: string;
  name: string;
  initials: string;
  status: ReferralStatus;
  coinsEarned: number | null;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const REFERRAL_CODE = 'AHMED2024';
const MAX_REFERRALS = 20;

const REFERRAL_LIST: ReferralEntry[] = [
  {id: 'r1', name: 'سارة أحمد', initials: 'سأ', status: 'joined', coinsEarned: 50},
  {id: 'r2', name: 'محمد خالد', initials: 'مخ', status: 'joined', coinsEarned: 50},
  {id: 'r3', name: 'ريم عبدالله', initials: 'رع', status: 'pending', coinsEarned: null},
];

const completedCount = REFERRAL_LIST.filter(r => r.status === 'joined').length;
const totalCount = REFERRAL_LIST.length;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Hero illustration with phone emojis and coin */
function HeroSection() {
  return (
    <View style={styles.hero}>
      <Text style={styles.heroIllustration}>
        {'\uD83D\uDCF1 \uD83E\uDE99 \uD83D\uDCF1'}
      </Text>
      <Text style={styles.heroRewardText}>
        {'50 \u0639\u0645\u0644\u0629 \u0644\u0643 + 50 \u0639\u0645\u0644\u0629 \u0644\u0635\u062F\u064A\u0642\u0643'}
      </Text>
    </View>
  );
}

/** Referral code card with copy button */
function ReferralCodeCard() {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(() => {
    // In production, use Clipboard.setStringAsync(REFERRAL_CODE)
    setCopied(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setCopied(false);
    }, 2000);
  }, []);

  return (
    <View style={styles.codeCard}>
      <Text style={styles.codeLabel}>
        {'\u0631\u0645\u0632 \u0627\u0644\u062F\u0639\u0648\u0629'}
      </Text>
      <Text style={styles.codeText}>{REFERRAL_CODE}</Text>
      <Pressable
        style={styles.copyButton}
        onPress={handleCopy}
        accessibilityRole="button"
        accessibilityLabel="Copy referral code">
        <Text style={styles.copyButtonText}>
          {copied
            ? '\u062A\u0645 \u0627\u0644\u0646\u0633\u062E!'
            : '\u0627\u0646\u0633\u062E \u0627\u0644\u0631\u0645\u0632'}
        </Text>
      </Pressable>
    </View>
  );
}

/** Share method button */
function ShareButton({
  icon,
  label,
  tintColor,
  onPress,
}: {
  icon: string;
  label: string;
  tintColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.shareButton} onPress={onPress}>
      <View style={[styles.shareIconCircle, {backgroundColor: colors.cardElevated}]}>
        <Text style={[styles.shareIcon, {color: tintColor}]}>{icon}</Text>
      </View>
      <Text style={styles.shareLabel}>{label}</Text>
    </Pressable>
  );
}

/** Share methods row */
function ShareRow() {
  const handleShare = (method: string) => {
    console.log('Share via:', method);
  };

  return (
    <View style={styles.shareRow}>
      <ShareButton
        icon={'\uD83D\uDCAC'}
        label={'\u0648\u0627\u062A\u0633\u0627\u0628'}
        tintColor="#25D366"
        onPress={() => handleShare('whatsapp')}
      />
      <ShareButton
        icon={'\u2709\uFE0F'}
        label={'\u0631\u0633\u0627\u0644\u0629'}
        tintColor="#3B82F6"
        onPress={() => handleShare('sms')}
      />
      <ShareButton
        icon={'\uD83D\uDD17'}
        label={'\u0646\u0633\u062E \u0627\u0644\u0631\u0627\u0628\u0637'}
        tintColor={colors.textMuted}
        onPress={() => handleShare('copy')}
      />
    </View>
  );
}

/** Single referral list item */
function ReferralItem({
  entry,
  isLast,
}: {
  entry: ReferralEntry;
  isLast: boolean;
}) {
  const isJoined = entry.status === 'joined';

  return (
    <>
      <View style={styles.referralItem}>
        {/* Avatar */}
        <View style={styles.referralAvatar}>
          <Text style={styles.referralAvatarText}>{entry.initials}</Text>
        </View>

        {/* Name */}
        <Text style={styles.referralName}>{entry.name}</Text>

        {/* Status + coins */}
        <View style={styles.referralRight}>
          {isJoined && entry.coinsEarned != null && (
            <Text style={styles.referralCoins}>
              +{entry.coinsEarned} {'\u0639\u0645\u0644\u0629'}
            </Text>
          )}
          <View
            style={[
              styles.statusBadge,
              isJoined ? styles.statusBadgeJoined : styles.statusBadgePending,
            ]}>
            <Text
              style={[
                styles.statusBadgeText,
                isJoined ? styles.statusTextJoined : styles.statusTextPending,
              ]}>
              {isJoined
                ? '\u0627\u0646\u0636\u0645 \u2713'
                : '\u0628\u0627\u0646\u062A\u0638\u0627\u0631...'}
            </Text>
          </View>
        </View>
      </View>
      {!isLast && <View style={styles.referralDivider} />}
    </>
  );
}

/** Referral list section */
function ReferralList() {
  return (
    <View style={styles.referralListSection}>
      {/* Section header */}
      <View style={styles.referralListHeader}>
        <Text style={styles.referralListTitle}>
          {'\u062F\u0639\u0648\u0627\u062A\u0643'}
        </Text>
        <Text style={styles.referralListCount}>
          {totalCount} {'\u0645\u0646'} {MAX_REFERRALS}
        </Text>
      </View>

      {/* List items */}
      {REFERRAL_LIST.map((entry, index) => (
        <ReferralItem
          key={entry.id}
          entry={entry}
          isLast={index === REFERRAL_LIST.length - 1}
        />
      ))}
    </View>
  );
}

/** Progress bar toward max referrals */
function ProgressSection() {
  const progress = completedCount / MAX_REFERRALS;

  return (
    <View style={styles.progressSection}>
      <Text style={styles.progressLabel}>
        {completedCount}/{MAX_REFERRALS} {'\u062F\u0639\u0648\u0627\u062A'}
      </Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, {width: `${progress * 100}%`}]} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function ReferralScreen({navigation}: Props) {
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}>
          <Text style={styles.backIcon}>{'\u276F'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {'\u0627\u062F\u0639\u064F \u0623\u0635\u062F\u0642\u0627\u0621\u0643'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Hero section */}
        <HeroSection />

        {/* Referral code card */}
        <ReferralCodeCard />

        {/* Share row */}
        <ShareRow />

        {/* Referral list */}
        <ReferralList />

        {/* Progress bar */}
        <ProgressSection />

        {/* Program terms */}
        <Pressable style={styles.termsLink}>
          <Text style={styles.termsText}>
            {'\u0634\u0631\u0648\u0637 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C'}
          </Text>
        </Pressable>

        {/* Bottom spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 16,
    color: colors.text,
  },
  headerTitle: {
    fontSize: fontSizes.sectionTitle,
    fontWeight: fontWeights.bold,
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  headerSpacer: {
    width: 36,
  },

  /* ---- Hero ---- */
  hero: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.section,
  },
  heroIllustration: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  heroRewardText: {
    fontSize: 20,
    fontWeight: fontWeights.bold,
    color: colors.coin,
    textAlign: 'center',
    writingDirection: 'rtl',
  },

  /* ---- Referral Code Card ---- */
  codeCard: {
    backgroundColor: colors.cardElevated,
    borderRadius: radii.card,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.section,
  },
  codeLabel: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
  },
  codeText: {
    fontSize: 24,
    fontWeight: fontWeights.bold,
    color: colors.text,
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  copyButton: {
    backgroundColor: colors.cta,
    height: 44,
    borderRadius: radii.card,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  copyButtonText: {
    fontSize: fontSizes.button,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    writingDirection: 'rtl',
  },

  /* ---- Share Row ---- */
  shareRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.section,
  },
  shareButton: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  shareIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareIcon: {
    fontSize: 24,
  },
  shareLabel: {
    fontSize: fontSizes.tabLabel,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },

  /* ---- Referral List ---- */
  referralListSection: {
    marginBottom: spacing.section,
  },
  referralListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  referralListTitle: {
    fontSize: fontSizes.cardTitle,
    fontWeight: fontWeights.bold,
    color: colors.text,
    writingDirection: 'rtl',
  },
  referralListCount: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
  },
  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  referralAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: spacing.md,
  },
  referralAvatarText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.text,
  },
  referralName: {
    flex: 1,
    fontSize: fontSizes.body,
    color: colors.text,
    writingDirection: 'rtl',
  },
  referralRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginStart: spacing.sm,
  },
  referralCoins: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    color: colors.coin,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  statusBadgeJoined: {
    backgroundColor: 'rgba(0, 184, 86, 0.15)',
  },
  statusBadgePending: {
    backgroundColor: colors.cardElevated,
  },
  statusBadgeText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
    writingDirection: 'rtl',
  },
  statusTextJoined: {
    color: colors.cta,
  },
  statusTextPending: {
    color: colors.textMuted,
  },
  referralDivider: {
    height: 1,
    backgroundColor: colors.border,
  },

  /* ---- Progress ---- */
  progressSection: {
    marginBottom: spacing.section,
  },
  progressLabel: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.cta,
    borderRadius: 2,
  },

  /* ---- Terms ---- */
  termsLink: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  termsText: {
    fontSize: fontSizes.caption,
    color: colors.textDim,
    writingDirection: 'rtl',
  },

  /* ---- Bottom spacer ---- */
  bottomSpacer: {
    height: spacing.section,
  },
});
