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
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {colors, fontSizes, fontWeights, spacing, radii, sizes} from '../theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProfileNavigation = NativeStackNavigationProp<RootStackParamList>;

interface MenuItemData {
  id: string;
  icon: string;
  iconColor?: string;
  label: string;
  rightText?: string;
  rightBadge?: string;
  rightBadgeColor?: string;
  showChevron?: boolean;
  textColor?: string;
  onPress?: (nav: ProfileNavigation) => void;
}

interface MenuGroup {
  id: string;
  title: string;
  items: MenuItemData[];
}

interface WatchStat {
  id: string;
  value: string;
  label: string;
  valueColor?: string;
  prefix?: string;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const USER = {
  initials: '\u0623\u0645',
  name: '\u0623\u062D\u0645\u062F \u0645\u062D\u0645\u062F',
  phone: '+966 5XX XXX XXX',
  coinBalance: 23,
  subscriptionPlan: '\u0645\u062C\u0627\u0646\u064A',
  isSubscribed: false,
};

const WATCH_STATS: WatchStat[] = [
  {id: 'series', value: '12', label: '\u0645\u0633\u0644\u0633\u0644'},
  {id: 'episodes', value: '342', label: '\u062D\u0644\u0642\u0629'},
  {
    id: 'streak',
    value: '15',
    label: '\u064A\u0648\u0645',
    valueColor: colors.streak,
    prefix: '\uD83D\uDD25 ',
  },
];

const MENU_GROUPS: MenuGroup[] = [
  {
    id: 'activity',
    title: '\u0627\u0644\u0646\u0634\u0627\u0637',
    items: [
      {
        id: 'watch-history',
        icon: '\uD83D\uDD52',
        label: '\u0633\u062C\u0644 \u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0629',
        showChevron: true,
        onPress: nav => nav.navigate('WatchHistory'),
      },
      {
        id: 'transactions',
        icon: '\uD83E\uDDFE',
        label: '\u0633\u062C\u0644 \u0627\u0644\u0645\u0639\u0627\u0645\u0644\u0627\u062A',
        showChevron: true,
      },
    ],
  },
  {
    id: 'achievements',
    title: '\u0627\u0644\u0625\u0646\u062C\u0627\u0632\u0627\u062A',
    items: [
      {
        id: 'achievements',
        icon: '\uD83C\uDFC6',
        iconColor: colors.achievement,
        label: '\u0627\u0644\u0625\u0646\u062C\u0627\u0632\u0627\u062A',
        rightBadge: '5/12',
        showChevron: true,
      },
    ],
  },
  {
    id: 'account',
    title: '\u0627\u0644\u062D\u0633\u0627\u0628',
    items: [
      {
        id: 'subscription',
        icon: '\uD83D\uDC51',
        iconColor: colors.coin,
        label: '\u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643',
        showChevron: true,
        onPress: nav => nav.navigate('Subscriptions'),
      },
      {
        id: 'redeem',
        icon: '\uD83C\uDF81',
        label: '\u0627\u0633\u062A\u0631\u062F\u0627\u062F \u0631\u0645\u0632',
        showChevron: true,
      },
      {
        id: 'invite',
        icon: '\uD83C\uDF81',
        iconColor: colors.cta,
        label: '\u0627\u062F\u0639\u064F \u0623\u0635\u062F\u0642\u0627\u0621\u0643',
        rightBadge: '50 \u0639\u0645\u0644\u0629 \u0644\u0643\u0644 \u062F\u0639\u0648\u0629',
        rightBadgeColor: colors.coin,
        showChevron: true,
        onPress: nav => nav.navigate('Referral'),
      },
    ],
  },
  {
    id: 'app',
    title: '\u0627\u0644\u062A\u0637\u0628\u064A\u0642',
    items: [
      {
        id: 'settings',
        icon: '\u2699\uFE0F',
        label: '\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A',
        showChevron: true,
        onPress: nav => nav.navigate('Settings'),
      },
      {
        id: 'help',
        icon: '\u2753',
        label: '\u0627\u0644\u0645\u0633\u0627\u0639\u062F\u0629',
        showChevron: true,
      },
      {
        id: 'signout',
        icon: '',
        label: '\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C',
        textColor: colors.error,
        showChevron: false,
      },
    ],
  },
];

// Achievement badge mock data for preview row
const ACHIEVEMENT_BADGES = [
  {id: 'a1', initials: '\uD83C\uDFAC', borderColor: colors.achievement},
  {id: 'a2', initials: '\u2B50', borderColor: colors.achievement},
  {id: 'a3', initials: '\uD83E\uDD1D', borderColor: colors.achievementRare},
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** User avatar, name, phone, and edit link */
function UserInfoSection({onEditPress}: {onEditPress: () => void}) {
  return (
    <View style={styles.userSection}>
      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{USER.initials}</Text>
      </View>

      {/* Name */}
      <Text style={styles.userName}>{USER.name}</Text>

      {/* Phone */}
      <Text style={styles.userPhone}>{USER.phone}</Text>

      {/* Edit profile link */}
      <Pressable onPress={onEditPress}>
        <Text style={styles.editProfileLink}>
          {'\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u0644\u0641'}
        </Text>
      </Pressable>
    </View>
  );
}

/** Balance and subscription cards row */
function BalanceCardsRow({navigation}: {navigation: ProfileNavigation}) {
  return (
    <View style={styles.balanceRow}>
      {/* Coin balance card */}
      <Pressable
        style={styles.balanceCard}
        onPress={() => navigation.navigate('CoinStore')}>
        <Text style={styles.balanceCardIcon}>{'\uD83E\uDE99'}</Text>
        <Text style={styles.balanceCardAmount}>
          {USER.coinBalance} {'\u0639\u0645\u0644\u0629'}
        </Text>
        <Pressable
          style={styles.miniPillGreen}
          onPress={() => navigation.navigate('CoinStore')}>
          <Text style={styles.miniPillGreenText}>
            {'\u0634\u062D\u0646'}
          </Text>
        </Pressable>
      </Pressable>

      {/* Subscription card */}
      <Pressable
        style={styles.balanceCard}
        onPress={() => navigation.navigate('Subscriptions')}>
        <Text style={styles.balanceCardIcon}>{'\uD83D\uDC51'}</Text>
        <Text style={styles.balanceCardPlan}>{USER.subscriptionPlan}</Text>
        {!USER.isSubscribed && (
          <Pressable
            style={styles.miniPillGold}
            onPress={() => navigation.navigate('Subscriptions')}>
            <Text style={styles.miniPillGoldText}>
              {'\u0627\u0634\u062A\u0631\u0643'}
            </Text>
          </Pressable>
        )}
      </Pressable>
    </View>
  );
}

/** Watch stats row (3 mini cards) */
function WatchStatsRow() {
  return (
    <View style={styles.statsRow}>
      {WATCH_STATS.map(stat => (
        <View key={stat.id} style={styles.statCard}>
          <Text
            style={[
              styles.statValue,
              stat.valueColor ? {color: stat.valueColor} : undefined,
            ]}>
            {stat.prefix ?? ''}{stat.value}
          </Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

/** Single menu item row */
function MenuItem({
  item,
  isLast,
  navigation,
}: {
  item: MenuItemData;
  isLast: boolean;
  navigation: ProfileNavigation;
}) {
  const handlePress = () => {
    if (item.onPress) {
      item.onPress(navigation);
    } else if (item.id === 'signout') {
      console.log('Sign out');
    } else {
      console.log('Navigate to:', item.id);
    }
  };

  return (
    <>
      <Pressable style={styles.menuItem} onPress={handlePress}>
        {/* Icon */}
        {item.icon !== '' && (
          <Text
            style={[
              styles.menuIcon,
              item.iconColor ? {color: item.iconColor} : undefined,
            ]}>
            {item.icon}
          </Text>
        )}

        {/* Label */}
        <Text
          style={[
            styles.menuLabel,
            item.textColor ? {color: item.textColor} : undefined,
            item.icon === '' && styles.menuLabelCentered,
          ]}>
          {item.label}
        </Text>

        {/* Right side: badge, text, or chevron */}
        <View style={styles.menuRight}>
          {item.rightBadge && (
            <View
              style={[
                styles.menuBadge,
                item.rightBadgeColor
                  ? {backgroundColor: `${item.rightBadgeColor}20`}
                  : undefined,
              ]}>
              <Text
                style={[
                  styles.menuBadgeText,
                  item.rightBadgeColor
                    ? {color: item.rightBadgeColor}
                    : undefined,
                ]}>
                {item.rightBadge}
              </Text>
            </View>
          )}
          {item.rightText && (
            <Text style={styles.menuRightText}>{item.rightText}</Text>
          )}
          {item.showChevron && (
            <Text style={styles.menuChevron}>{'\u276E'}</Text>
          )}
        </View>
      </Pressable>

      {/* Achievement badges preview row */}
      {item.id === 'achievements' && (
        <View style={styles.achievementPreview}>
          {ACHIEVEMENT_BADGES.map(badge => (
            <View
              key={badge.id}
              style={[
                styles.achievementBadge,
                {borderColor: badge.borderColor},
              ]}>
              <Text style={styles.achievementBadgeIcon}>{badge.initials}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Divider within group */}
      {!isLast && <View style={styles.menuDivider} />}
    </>
  );
}

/** A group of menu items with title */
function MenuGroupSection({
  group,
  navigation,
}: {
  group: MenuGroup;
  navigation: ProfileNavigation;
}) {
  return (
    <View style={styles.menuGroup}>
      <View style={styles.menuGroupCard}>
        {group.items.map((item, index) => (
          <MenuItem
            key={item.id}
            item={item}
            isLast={index === group.items.length - 1}
            navigation={navigation}
          />
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileNavigation>();

  const handleEditProfile = () => {
    console.log('Edit profile');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {'\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A'}
        </Text>
        <Pressable
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
          hitSlop={8}>
          <Text style={styles.settingsIcon}>{'\u2699\uFE0F'}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* User info */}
        <UserInfoSection onEditPress={handleEditProfile} />

        {/* Balance cards */}
        <BalanceCardsRow navigation={navigation} />

        {/* Watch stats */}
        <WatchStatsRow />

        {/* Menu groups */}
        {MENU_GROUPS.map(group => (
          <MenuGroupSection
            key={group.id}
            group={group}
            navigation={navigation}
          />
        ))}

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
  headerTitle: {
    fontSize: fontSizes.sectionTitle,
    fontWeight: fontWeights.bold,
    color: colors.text,
    writingDirection: 'rtl',
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 18,
  },

  /* ---- User Info ---- */
  userSection: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.section,
  },
  avatar: {
    width: sizes.avatar,
    height: sizes.avatar,
    borderRadius: sizes.avatar / 2,
    backgroundColor: colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: fontWeights.bold,
    color: colors.text,
  },
  userName: {
    fontSize: 18,
    fontWeight: fontWeights.bold,
    color: colors.text,
    writingDirection: 'rtl',
    marginBottom: spacing.xs,
  },
  userPhone: {
    fontSize: fontSizes.body,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  editProfileLink: {
    fontSize: fontSizes.body,
    color: colors.cta,
    writingDirection: 'rtl',
  },

  /* ---- Balance Cards ---- */
  balanceRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  balanceCardIcon: {
    fontSize: 20,
  },
  balanceCardAmount: {
    fontSize: fontSizes.cardTitle,
    fontWeight: fontWeights.bold,
    color: colors.coin,
    writingDirection: 'rtl',
  },
  balanceCardPlan: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },
  miniPillGreen: {
    backgroundColor: colors.cta,
    height: sizes.buttonHeightMini,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniPillGreenText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    writingDirection: 'rtl',
  },
  miniPillGold: {
    borderColor: colors.coin,
    borderWidth: 1,
    height: sizes.buttonHeightMini,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniPillGoldText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    color: colors.coin,
    writingDirection: 'rtl',
  },

  /* ---- Watch Stats ---- */
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.section,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.thumbnail,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSizes.sectionTitle,
    fontWeight: fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fontSizes.tabLabel,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },

  /* ---- Menu Groups ---- */
  menuGroup: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  menuGroupCard: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    overflow: 'hidden',
  },

  /* ---- Menu Item ---- */
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: spacing.lg,
  },
  menuIcon: {
    fontSize: 18,
    width: 28,
    textAlign: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: fontSizes.body,
    color: colors.text,
    writingDirection: 'rtl',
    textAlign: 'right',
    marginStart: spacing.sm,
  },
  menuLabelCentered: {
    textAlign: 'center',
    marginStart: 0,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginStart: spacing.sm,
  },
  menuBadge: {
    backgroundColor: colors.cardElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  menuBadgeText: {
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.medium,
    color: colors.textMuted,
  },
  menuRightText: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
  },
  menuChevron: {
    fontSize: 14,
    color: colors.textDim,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },

  /* ---- Achievement Preview ---- */
  achievementPreview: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  achievementBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementBadgeIcon: {
    fontSize: 12,
  },

  /* ---- Bottom spacer ---- */
  bottomSpacer: {
    height: spacing.section,
  },
});
