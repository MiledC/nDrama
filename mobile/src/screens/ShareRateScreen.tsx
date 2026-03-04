import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
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

type Props = NativeStackScreenProps<RootStackParamList, 'ShareRate'>;

type ActiveTab = 'share' | 'rate';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.75;

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

/** Tab switcher with pill design */
function TabSwitcher({
  activeTab,
  onTabChange,
}: {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}) {
  return (
    <View style={styles.tabRow}>
      <Pressable
        style={[styles.tab, activeTab === 'rate' && styles.tabActive]}
        onPress={() => onTabChange('rate')}>
        <Text
          style={[styles.tabText, activeTab === 'rate' && styles.tabTextActive]}>
          {'\u062A\u0642\u064A\u064A\u0645'}
        </Text>
      </Pressable>
      <Pressable
        style={[styles.tab, activeTab === 'share' && styles.tabActive]}
        onPress={() => onTabChange('share')}>
        <Text
          style={[
            styles.tabText,
            activeTab === 'share' && styles.tabTextActive,
          ]}>
          {'\u0645\u0634\u0627\u0631\u0643\u0629'}
        </Text>
      </Pressable>
    </View>
  );
}

/** Share preview card showing series info */
function SharePreviewCard() {
  return (
    <View style={styles.previewCard}>
      {/* Thumbnail placeholder */}
      <View style={styles.previewThumbnail} />
      <View style={styles.previewInfo}>
        <Text style={styles.previewTitle}>
          {'\u0638\u0644\u0627\u0644 \u0627\u0644\u0635\u062D\u0631\u0627\u0621'}
        </Text>
        <Text style={styles.previewSubtitle}>
          {'\u0634\u0627\u0647\u062F \u0639\u0644\u0649 Draama'}
        </Text>
      </View>
    </View>
  );
}

/** Clip share option card */
function ClipShareOption() {
  return (
    <Pressable style={styles.clipCard}>
      <Text style={styles.clipChevron}>{'\u276E'}</Text>
      <View style={styles.clipInfo}>
        <Text style={styles.clipTitle}>
          {'\u0634\u0627\u0631\u0643 \u0645\u0642\u0637\u0639\u0627\u064B'}
        </Text>
        <Text style={styles.clipSubtitle}>
          {'\u0627\u062E\u062A\u0631 \u0644\u062D\u0638\u0629 15-30 \u062B\u0627\u0646\u064A\u0629'}
        </Text>
      </View>
      <View style={styles.clipPlayIcon}>
        <Text style={styles.clipPlayText}>{'\u25B6'}</Text>
      </View>
    </Pressable>
  );
}

/** Share target button (circular) */
function ShareTarget({label, icon}: {label: string; icon: string}) {
  return (
    <Pressable style={styles.shareTargetWrapper}>
      <View style={styles.shareTargetCircle}>
        <Text style={styles.shareTargetIcon}>{icon}</Text>
      </View>
      <Text style={styles.shareTargetLabel}>{label}</Text>
    </Pressable>
  );
}

/** Row of share target buttons */
function ShareTargetsRow() {
  return (
    <View style={styles.shareTargetsRow}>
      <ShareTarget
        label={'\u062A\u064A\u0644\u064A\u062C\u0631\u0627\u0645'}
        icon={'\u2708'}
      />
      <ShareTarget
        label={'\u0627\u0646\u0633\u062A\u0627\u063A\u0631\u0627\u0645'}
        icon={'\uD83D\uDCF7'}
      />
      <ShareTarget label={'X'} icon={'\uD835\uDD4F'} />
      <ShareTarget
        label={'\u0648\u0627\u062A\u0633\u0627\u0628'}
        icon={'\uD83D\uDCAC'}
      />
    </View>
  );
}

/** Coin incentive line */
function CoinIncentive() {
  return (
    <View style={styles.coinIncentive}>
      <Text style={styles.coinIncentiveText}>
        {'\uD83E\uDE99'}{' '}
        {'\u0634\u0627\u0631\u0643 \u0648\u0627\u062D\u0635\u0644 \u0639\u0644\u0649 3 \u0639\u0645\u0644\u0627\u062A'}
      </Text>
      <Text style={styles.coinIncentiveSub}>
        {'3 \u0645\u0634\u0627\u0631\u0643\u0627\u062A \u0645\u062A\u0628\u0642\u064A\u0629 \u0627\u0644\u064A\u0648\u0645'}
      </Text>
    </View>
  );
}

/** Share tab content */
function ShareTabContent() {
  return (
    <View style={styles.tabContent}>
      <SharePreviewCard />
      <ClipShareOption />
      <ShareTargetsRow />
      <CoinIncentive />

      {/* Copy link button */}
      <Pressable style={styles.copyLinkButton}>
        <Text style={styles.copyLinkText}>
          {'\u0646\u0633\u062E \u0627\u0644\u0631\u0627\u0628\u0637'}
        </Text>
      </Pressable>
    </View>
  );
}

/** Star rating row */
function StarRating({
  rating,
  onRate,
}: {
  rating: number;
  onRate: (star: number) => void;
}) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map(star => (
        <Pressable key={star} onPress={() => onRate(star)} hitSlop={8}>
          <Text
            style={[
              styles.starIcon,
              star <= rating ? styles.starFilled : styles.starEmpty,
            ]}>
            {star <= rating ? '\u2605' : '\u2606'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Rate tab content */
function RateTabContent({
  rating,
  onRate,
  review,
  onReviewChange,
  onSubmit,
}: {
  rating: number;
  onRate: (star: number) => void;
  review: string;
  onReviewChange: (text: string) => void;
  onSubmit: () => void;
}) {
  return (
    <View style={styles.tabContent}>
      <StarRating rating={rating} onRate={onRate} />

      {/* Review input (shown after selecting stars) */}
      {rating > 0 && (
        <TextInput
          style={styles.reviewInput}
          placeholder={'\u0627\u0643\u062A\u0628 \u0631\u0623\u064A\u0643...'}
          placeholderTextColor={colors.textDim}
          multiline
          textAlignVertical="top"
          textAlign="right"
          value={review}
          onChangeText={onReviewChange}
        />
      )}

      {/* Submit button */}
      <Pressable
        style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
        onPress={onSubmit}
        disabled={rating === 0}>
        <Text style={styles.submitButtonText}>
          {'\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062A\u0642\u064A\u064A\u0645'}
        </Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function ShareRateScreen({navigation}: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<ActiveTab>('share');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  const dismiss = () => navigation.goBack();

  const handleSubmitRating = () => {
    // In a real app, this would send the rating + review to the API
    dismiss();
  };

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

        {/* Tabs */}
        <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab content */}
        {activeTab === 'share' ? (
          <ShareTabContent />
        ) : (
          <RateTabContent
            rating={rating}
            onRate={setRating}
            review={review}
            onReviewChange={setReview}
            onSubmit={handleSubmitRating}
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

  /* ---- Tab switcher ---- */
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  tab: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: colors.cardElevated,
  },
  tabText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
    color: colors.textDim,
    writingDirection: 'rtl',
  },
  tabTextActive: {
    color: colors.text,
    fontWeight: fontWeights.semibold,
  },

  /* ---- Tab content ---- */
  tabContent: {
    paddingHorizontal: spacing.lg,
  },

  /* ---- Share preview card ---- */
  previewCard: {
    flexDirection: 'row',
    backgroundColor: colors.cardElevated,
    borderRadius: radii.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  previewThumbnail: {
    width: 60,
    height: 90,
    borderRadius: spacing.sm,
    backgroundColor: colors.border,
    marginLeft: spacing.md,
  },
  previewInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  previewTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    writingDirection: 'rtl',
    marginBottom: spacing.xs,
  },
  previewSubtitle: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },

  /* ---- Clip share option ---- */
  clipCard: {
    flexDirection: 'row',
    backgroundColor: colors.cardElevated,
    borderRadius: radii.card,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  clipChevron: {
    fontSize: 12,
    color: colors.textMuted,
  },
  clipInfo: {
    flex: 1,
    alignItems: 'flex-end',
    marginHorizontal: spacing.md,
  },
  clipTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    writingDirection: 'rtl',
    marginBottom: 2,
  },
  clipSubtitle: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },
  clipPlayIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cta,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clipPlayText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 2,
  },

  /* ---- Share targets ---- */
  shareTargetsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginBottom: spacing.lg,
  },
  shareTargetWrapper: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  shareTargetCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareTargetIcon: {
    fontSize: 20,
  },
  shareTargetLabel: {
    fontSize: fontSizes.tabLabel,
    color: colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'center',
  },

  /* ---- Coin incentive ---- */
  coinIncentive: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  coinIncentiveText: {
    fontSize: fontSizes.caption,
    color: colors.coin,
    writingDirection: 'rtl',
    marginBottom: spacing.xs,
  },
  coinIncentiveSub: {
    fontSize: fontSizes.tabLabel,
    color: colors.textDim,
    writingDirection: 'rtl',
  },

  /* ---- Copy link button ---- */
  copyLinkButton: {
    height: sizes.buttonHeightSm,
    backgroundColor: colors.cardElevated,
    borderRadius: radii.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyLinkText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    writingDirection: 'rtl',
  },

  /* ---- Star rating ---- */
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  starIcon: {
    fontSize: 32,
  },
  starFilled: {
    color: colors.coin,
  },
  starEmpty: {
    color: colors.textDim,
  },

  /* ---- Review input ---- */
  reviewInput: {
    backgroundColor: colors.cardElevated,
    borderRadius: radii.card,
    height: 100,
    padding: spacing.md,
    fontSize: fontSizes.body,
    color: colors.text,
    writingDirection: 'rtl',
    marginBottom: spacing.lg,
  },

  /* ---- Submit button ---- */
  submitButton: {
    height: sizes.buttonHeightSm,
    backgroundColor: colors.cta,
    borderRadius: radii.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    writingDirection: 'rtl',
  },
});
