import React from 'react';
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
import {colors, fontSizes, fontWeights, spacing, radii, sizes} from '../theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = NativeStackScreenProps<RootStackParamList, 'Subscriptions'>;

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: 'monthly' | 'annual';
  label: string;
  price: string;
  recommended: boolean;
  savingsBadge?: string;
  features: PlanFeature[];
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

/** Toggle to preview the "currently subscribed" state */
const isSubscribed = false;
const activePlanId: 'monthly' | 'annual' | null = null;

const MONTHLY_FEATURES: PlanFeature[] = [
  {text: 'جميع الحلقات بلا حدود', included: true},
  {text: 'بدون إعلانات', included: true},
  {text: 'مشاهدة بدون انترنت', included: true},
];

const ANNUAL_FEATURES: PlanFeature[] = [
  {text: 'جميع الحلقات بلا حدود', included: true},
  {text: 'بدون إعلانات', included: true},
  {text: 'مشاهدة بدون انترنت', included: true},
  {text: 'أولوية المحتوى الجديد', included: true},
];

const FREE_FEATURES: PlanFeature[] = [
  {text: '3 حلقات مجانية فقط', included: false},
  {text: 'مشاهدة محدودة', included: false},
];

const PLANS: Plan[] = [
  {
    id: 'monthly',
    label: 'شهري',
    price: '29.99 ر.س/شهر',
    recommended: false,
    features: MONTHLY_FEATURES,
  },
  {
    id: 'annual',
    label: 'سنوي',
    price: '199.99 ر.س/سنة',
    recommended: true,
    savingsBadge: 'وفر 40%',
    features: ANNUAL_FEATURES,
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Checkmark or X icon for feature list */
function FeatureIcon({included}: {included: boolean}) {
  return (
    <Text
      style={[
        styles.featureIcon,
        included ? styles.featureIconIncluded : styles.featureIconExcluded,
      ]}>
      {included ? '\u2713' : '\u2717'}
    </Text>
  );
}

/** Single feature list item */
function FeatureRow({feature}: {feature: PlanFeature}) {
  return (
    <View style={styles.featureRow}>
      <FeatureIcon included={feature.included} />
      <Text
        style={[
          styles.featureText,
          !feature.included && styles.featureTextExcluded,
        ]}>
        {feature.text}
      </Text>
    </View>
  );
}

/** Plan card */
function PlanCard({
  plan,
  isActive,
}: {
  plan: Plan;
  isActive: boolean;
}) {
  const isAnnual = plan.id === 'annual';

  return (
    <View
      style={[
        styles.planCard,
        isAnnual && styles.planCardAnnual,
      ]}>
      {/* Active plan indicator */}
      {isActive && (
        <View style={styles.activePlanRow}>
          <Text style={styles.activePlanIcon}>{'\u2713'}</Text>
          <Text style={styles.activePlanText}>{'أنت مشترك حالياً'}</Text>
        </View>
      )}

      {/* Best Value badge (annual only) */}
      {plan.recommended && (
        <View style={styles.bestValueBadge}>
          <Text style={styles.bestValueText}>{'الأفضل قيمة'}</Text>
        </View>
      )}

      {/* Plan name + price row */}
      <View style={styles.planHeaderRow}>
        <Text style={styles.planLabel}>{plan.label}</Text>
        <Text style={styles.planPrice}>{plan.price}</Text>
      </View>

      {/* Savings badge */}
      {plan.savingsBadge && (
        <View style={styles.savingsBadge}>
          <Text style={styles.savingsBadgeText}>{plan.savingsBadge}</Text>
        </View>
      )}

      {/* Features */}
      <View style={styles.featuresList}>
        {plan.features.map((feature, idx) => (
          <FeatureRow key={idx} feature={feature} />
        ))}
      </View>

      {/* Subscribe button */}
      <Pressable style={styles.subscribeButton}>
        <Text style={styles.subscribeButtonText}>{'اشترك'}</Text>
      </Pressable>
    </View>
  );
}

/** Free tier comparison card */
function FreeTierCard() {
  return (
    <View style={styles.freeTierCard}>
      <Text style={styles.freeTierLabel}>{'المجاني'}</Text>
      <View style={styles.featuresList}>
        {FREE_FEATURES.map((feature, idx) => (
          <FeatureRow key={idx} feature={feature} />
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function SubscriptionsScreen({navigation}: Props) {
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* ---- Header ---- */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}>
          <Text style={styles.backIcon}>{'\u276E'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{'الاشتراكات'}</Text>
        {/* Spacer to balance the back button for centering */}
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* ---- Hero section ---- */}
        <View style={styles.hero}>
          {/* Crown icon */}
          <Text style={styles.crownIcon}>{'\u{1F451}'}</Text>

          <Text style={styles.heroTitle}>
            {'استمتع بمشاهدة غير محدودة'}
          </Text>
          <Text style={styles.heroSubtitle}>
            {'اشترك واحصل على وصول كامل لجميع المسلسلات'}
          </Text>
        </View>

        {/* ---- Plan cards ---- */}
        <View style={styles.plansSection}>
          {PLANS.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isActive={isSubscribed && activePlanId === plan.id}
            />
          ))}
        </View>

        {/* ---- Free tier comparison ---- */}
        <View style={styles.freeTierSection}>
          <FreeTierCard />
        </View>

        {/* ---- Bottom footer ---- */}
        <View style={styles.footer}>
          <Pressable>
            <Text style={styles.termsLink}>{'شروط الاشتراك'}</Text>
          </Pressable>
          <Text style={styles.cancelText}>
            {'يمكنك الإلغاء في أي وقت'}
          </Text>
        </View>
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
  },
  headerSpacer: {
    width: 36,
  },

  /* ---- Hero ---- */
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.section,
  },
  crownIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: fontSizes.sectionTitle,
    fontWeight: fontWeights.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
    writingDirection: 'rtl',
  },
  heroSubtitle: {
    fontSize: fontSizes.body,
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },

  /* ---- Plans section ---- */
  plansSection: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },

  /* ---- Plan card ---- */
  planCard: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: spacing.lg,
  },
  planCardAnnual: {
    borderWidth: 1,
    borderColor: 'rgba(212, 168, 67, 0.4)',
  },

  /* Active plan indicator */
  activePlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  activePlanIcon: {
    fontSize: fontSizes.body,
    color: colors.cta,
    fontWeight: fontWeights.bold,
  },
  activePlanText: {
    fontSize: fontSizes.body,
    color: colors.cta,
    fontWeight: fontWeights.semibold,
    writingDirection: 'rtl',
  },

  /* Best value badge */
  bestValueBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(212, 168, 67, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    marginBottom: spacing.md,
  },
  bestValueText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    color: colors.coin,
    writingDirection: 'rtl',
  },

  /* Plan header row */
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  planLabel: {
    fontSize: fontSizes.cardTitle,
    fontWeight: fontWeights.bold,
    color: colors.text,
    writingDirection: 'rtl',
  },
  planPrice: {
    fontSize: fontSizes.cardTitle,
    fontWeight: fontWeights.bold,
    color: colors.coin,
    writingDirection: 'rtl',
  },

  /* Savings badge */
  savingsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.ctaGlow,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    marginBottom: spacing.md,
  },
  savingsBadgeText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    color: colors.cta,
    writingDirection: 'rtl',
  },

  /* Features list */
  featuresList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureIcon: {
    fontSize: fontSizes.body,
    width: 20,
    textAlign: 'center',
  },
  featureIconIncluded: {
    color: colors.cta,
  },
  featureIconExcluded: {
    color: colors.error,
  },
  featureText: {
    fontSize: fontSizes.body,
    color: colors.textMuted,
    flex: 1,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  featureTextExcluded: {
    color: colors.textDim,
  },

  /* Subscribe button */
  subscribeButton: {
    backgroundColor: colors.cta,
    height: sizes.buttonHeightSm,
    borderRadius: radii.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscribeButtonText: {
    fontSize: fontSizes.button,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    writingDirection: 'rtl',
  },

  /* ---- Free tier ---- */
  freeTierSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  freeTierCard: {
    backgroundColor: colors.cardElevated,
    borderRadius: radii.card,
    padding: spacing.lg,
  },
  freeTierLabel: {
    fontSize: fontSizes.cardTitle,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    marginBottom: spacing.md,
    writingDirection: 'rtl',
    textAlign: 'right',
  },

  /* ---- Footer ---- */
  footer: {
    alignItems: 'center',
    paddingTop: spacing.section,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  termsLink: {
    fontSize: fontSizes.caption,
    color: colors.textDim,
    writingDirection: 'rtl',
  },
  cancelText: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },
});
