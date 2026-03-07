import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {colors, fontSizes, fontWeights, spacing, radii, sizes} from '../theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = NativeStackScreenProps<RootStackParamList, 'DailyRewards'>;

type DayState = 'claimed' | 'today' | 'future';

interface DayData {
  label: string;
  reward: number;
  state: DayState;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const {height: SCREEN_HEIGHT} = Dimensions.get('window');
const MODAL_MAX_HEIGHT = SCREEN_HEIGHT * 0.8;

/** Reward amounts for each day of the 7-day cycle */
const DAY_REWARDS = [3, 3, 5, 5, 8, 10, 20];

/** Arabic day abbreviations (Sat-Fri) */
const DAY_LABELS = [
  '\u0633', // Sat
  '\u0623', // Sun (Ahad)
  '\u0625', // Mon (Ithnayn)
  '\u062B', // Tue (Thulatha)
  '\u0623', // Wed (Arbi'a) — abbreviated same as Sun
  '\u062E', // Thu (Khamis)
  '\u062C', // Fri (Jum'a)
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildDays(currentDay: number): DayData[] {
  return DAY_REWARDS.map((reward, index) => {
    let state: DayState;
    if (index < currentDay) {
      state = 'claimed';
    } else if (index === currentDay) {
      state = 'today';
    } else {
      state = 'future';
    }
    return {label: DAY_LABELS[index], reward, state};
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Close button (X) in the top-left corner (RTL: visually top-right) */
function CloseButton({onPress}: {onPress: () => void}) {
  return (
    <Pressable style={styles.closeButton} onPress={onPress} hitSlop={12}>
      <Text style={styles.closeIcon}>{'\u2715'}</Text>
    </Pressable>
  );
}

/** Streak header with flame icon and purple glow */
function StreakHeader({streak}: {streak: number}) {
  return (
    <View style={styles.streakSection}>
      {/* Flame icon with glow */}
      <View style={styles.flameWrapper}>
        <View style={styles.flameGlow} />
        <Text style={styles.flameIcon}>{'\uD83D\uDD25'}</Text>
      </View>

      {/* Streak count */}
      <Text style={styles.streakCount}>
        {'\uD83D\uDD25'} {streak} {'\u064A\u0648\u0645'}
      </Text>

      {/* Streak label */}
      <Text style={styles.streakLabel}>
        {'\u0633\u0644\u0633\u0644\u0629 \u0645\u062A\u062A\u0627\u0644\u064A\u0629'}
      </Text>
    </View>
  );
}

/** Single day square in the 7-day grid */
function DaySquare({day, claimed}: {day: DayData; claimed: boolean}) {
  const isClaimed = day.state === 'claimed' || (day.state === 'today' && claimed);
  const isToday = day.state === 'today' && !claimed;
  const isFuture = day.state === 'future';

  return (
    <View style={styles.dayColumn}>
      {/* Day label above square */}
      <Text style={styles.dayLabel}>{day.label}</Text>

      <View
        style={[
          styles.daySquare,
          isClaimed && styles.daySquareClaimed,
          isToday && styles.daySquareToday,
          isFuture && styles.daySquareFuture,
        ]}>
        {isClaimed ? (
          <>
            <Text style={styles.dayCheckmark}>{'\u2713'}</Text>
            <Text style={styles.dayAmountClaimed}>{day.reward}</Text>
          </>
        ) : (
          <Text
            style={[
              styles.dayAmount,
              isToday && styles.dayAmountToday,
              isFuture && styles.dayAmountFuture,
            ]}>
            {day.reward}
          </Text>
        )}
      </View>
    </View>
  );
}

/** 7-day calendar grid */
function CalendarGrid({days, claimed}: {days: DayData[]; claimed: boolean}) {
  return (
    <View style={styles.calendarGrid}>
      {days.map((day, index) => (
        <DaySquare key={index} day={day} claimed={claimed} />
      ))}
    </View>
  );
}

/** Today's reward display with animated gold glow */
function TodayReward({amount}: {amount: number}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.todayReward}>
      <Animated.View
        style={[styles.todayGlow, {transform: [{scale: pulseAnim}]}]}>
        <Text style={styles.todayCoinIcon}>{'\uD83E\uDE99'}</Text>
      </Animated.View>
      <Text style={styles.todayAmount}>
        {amount} {'\u0639\u0645\u0644\u0627\u062A'}
      </Text>
    </View>
  );
}

/** Claim button with claimed state */
function ClaimButton({
  claimed,
  onClaim,
}: {
  claimed: boolean;
  onClaim: () => void;
}) {
  return (
    <Pressable
      style={[styles.claimButton, claimed && styles.claimButtonClaimed]}
      onPress={claimed ? undefined : onClaim}
      disabled={claimed}>
      <Text style={styles.claimButtonText}>
        {claimed
          ? '\u2713 \u062A\u0645!'
          : '\u0627\u062C\u0645\u0639 \u0627\u0644\u0645\u0643\u0627\u0641\u0623\u0629'}
      </Text>
    </Pressable>
  );
}

/** Streak multiplier badge (shown when streak >= 7) */
function MultiplierBadge() {
  return (
    <View style={styles.multiplierBadge}>
      <Text style={styles.multiplierText}>
        {'\u0645\u0636\u0627\u0639\u0641 1.5x'}
      </Text>
    </View>
  );
}

/** Monthly milestone progress bar */
function MonthlyMilestone({streak}: {streak: number}) {
  const goal = 30;
  const progress = Math.min(streak / goal, 1);

  return (
    <View style={styles.milestoneSection}>
      {/* Label */}
      <Text style={styles.milestoneLabel}>
        {'\u0647\u062F\u0641 \u0627\u0644\u0634\u0647\u0631: 30 \u064A\u0648\u0645'}
      </Text>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, {width: `${progress * 100}%`}]} />
      </View>

      {/* Progress text */}
      <Text style={styles.progressLabel}>
        {streak}/30
      </Text>

      {/* Reward description */}
      <Text style={styles.milestoneReward}>
        {'100 \u0639\u0645\u0644\u0629 \u0625\u0636\u0627\u0641\u064A\u0629 + \uD83C\uDFC6'}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function DailyRewardsScreen({navigation}: Props) {
  // Mock state: currentDay=5 (0-indexed), streak=12
  const [claimed, setClaimed] = useState(false);
  const currentDay = 5;
  const streak = 12;

  const days = buildDays(currentDay);
  const todayReward = DAY_REWARDS[currentDay];

  const dismiss = () => navigation.goBack();
  const handleClaim = () => setClaimed(true);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Dark overlay — tapping dismisses */}
      <Pressable style={styles.overlay} onPress={dismiss} />

      {/* Modal card centered */}
      <View style={[styles.modal, {maxHeight: MODAL_MAX_HEIGHT}]}>
        {/* Close button */}
        <CloseButton onPress={dismiss} />

        {/* Streak header */}
        <StreakHeader streak={streak} />

        {/* Multiplier badge (streak >= 7) */}
        {streak >= 7 && <MultiplierBadge />}

        {/* 7-day calendar grid */}
        <CalendarGrid days={days} claimed={claimed} />

        {/* Today's reward with gold glow pulse */}
        {!claimed && <TodayReward amount={todayReward} />}

        {/* Claim button */}
        <ClaimButton claimed={claimed} onClaim={handleClaim} />

        {/* Monthly milestone progress */}
        <MonthlyMilestone streak={streak} />

        {/* Rewards history link */}
        <Pressable style={styles.rewardsLink} hitSlop={8}>
          <Text style={styles.rewardsLinkText}>
            {'\u0627\u0644\u062C\u0648\u0627\u0626\u0632'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const DAY_SQUARE_SIZE = 40;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },

  /* ---- Modal card ---- */
  modal: {
    width: '85%',
    backgroundColor: colors.card,
    borderRadius: radii.sheet,
    padding: spacing.xxl,
    position: 'relative',
  },

  /* ---- Close button ---- */
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    start: spacing.md,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeIcon: {
    fontSize: 14,
    color: colors.text,
  },

  /* ---- Streak header ---- */
  streakSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  flameWrapper: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  flameGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    backgroundColor: colors.streakGlow,
  },
  flameIcon: {
    fontSize: 32,
  },
  streakCount: {
    fontSize: fontSizes.sectionTitle,
    fontWeight: fontWeights.bold,
    color: colors.streak,
    writingDirection: 'rtl',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  streakLabel: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'center',
  },

  /* ---- Multiplier badge ---- */
  multiplierBadge: {
    alignSelf: 'center',
    backgroundColor: colors.streak,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    marginBottom: spacing.lg,
  },
  multiplierText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    writingDirection: 'rtl',
  },

  /* ---- Calendar grid ---- */
  calendarGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  dayColumn: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  dayLabel: {
    fontSize: fontSizes.tiny,
    color: colors.textDim,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  daySquare: {
    width: DAY_SQUARE_SIZE,
    height: DAY_SQUARE_SIZE,
    borderRadius: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  daySquareClaimed: {
    backgroundColor: 'rgba(0, 184, 86, 0.80)',
  },
  daySquareToday: {
    borderWidth: 2,
    borderColor: colors.cta,
    backgroundColor: 'transparent',
  },
  daySquareFuture: {
    backgroundColor: colors.cardElevated,
  },

  /* Day square content */
  dayCheckmark: {
    fontSize: 10,
    color: colors.text,
    fontWeight: fontWeights.bold,
  },
  dayAmountClaimed: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    color: colors.text,
    opacity: 0.8,
  },
  dayAmount: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    color: colors.text,
  },
  dayAmountToday: {
    color: colors.coin,
    fontSize: fontSizes.cardTitle,
  },
  dayAmountFuture: {
    color: colors.textDim,
  },

  /* ---- Today's reward ---- */
  todayReward: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  todayGlow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.coinGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  todayCoinIcon: {
    fontSize: 36,
  },
  todayAmount: {
    fontSize: 24,
    fontWeight: fontWeights.bold,
    color: colors.coin,
    writingDirection: 'rtl',
    textAlign: 'center',
  },

  /* ---- Claim button ---- */
  claimButton: {
    width: '100%',
    height: sizes.buttonHeight,
    borderRadius: radii.pill,
    backgroundColor: colors.cta,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  claimButtonClaimed: {
    opacity: 0.5,
  },
  claimButtonText: {
    fontSize: fontSizes.button,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    writingDirection: 'rtl',
  },

  /* ---- Monthly milestone ---- */
  milestoneSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  milestoneLabel: {
    fontSize: fontSizes.body,
    color: colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.streak,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  milestoneReward: {
    fontSize: fontSizes.caption,
    color: colors.coin,
    writingDirection: 'rtl',
    textAlign: 'center',
  },

  /* ---- Rewards link ---- */
  rewardsLink: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
  },
  rewardsLinkText: {
    fontSize: fontSizes.body,
    color: colors.streak,
    writingDirection: 'rtl',
  },
});
