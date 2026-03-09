import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {colors, fontSizes, fontWeights, spacing, radii, sizes} from '../theme';
import {useProfile, useUpdateProfile} from '../hooks/useProfile';
import {useBalance} from '../hooks/useCoins';
import {useWatchHistory} from '../hooks/useHistory';
import {useAuthStore} from '../stores/authStore';
import {deleteAccount} from '../api/profile';

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
// Menu data
// ---------------------------------------------------------------------------

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
        id: 'delete-account',
        icon: '\uD83D\uDDD1\uFE0F',
        label: '\u062D\u0630\u0641 \u0627\u0644\u062D\u0633\u0627\u0628',
        textColor: colors.error,
        showChevron: false,
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

const ACHIEVEMENT_BADGES = [
  {id: 'a1', initials: '\uD83C\uDFAC', borderColor: colors.achievement},
  {id: 'a2', initials: '\u2B50', borderColor: colors.achievement},
  {id: 'a3', initials: '\uD83E\uDD1D', borderColor: colors.achievementRare},
];

// ---------------------------------------------------------------------------
// Edit Profile Modal
// ---------------------------------------------------------------------------

function EditProfileModal({
  visible,
  currentName,
  onClose,
  onSave,
  isSaving,
}: {
  visible: boolean;
  currentName: string;
  onClose: () => void;
  onSave: (name: string) => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(currentName);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onShow={() => setName(currentName)}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={() => {}}>
          <Text style={styles.modalTitle}>
            {'\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u0644\u0641'}
          </Text>

          <Text style={styles.modalLabel}>
            {'\u0627\u0644\u0627\u0633\u0645'}
          </Text>
          <TextInput
            style={styles.modalInput}
            value={name}
            onChangeText={setName}
            placeholder={'\u0623\u062F\u062E\u0644 \u0627\u0633\u0645\u0643'}
            placeholderTextColor={colors.textDim}
            autoFocus
          />

          <View style={styles.modalButtons}>
            <Pressable
              style={styles.modalCancelButton}
              onPress={onClose}
              disabled={isSaving}>
              <Text style={styles.modalCancelText}>
                {'\u0625\u0644\u063A\u0627\u0621'}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.modalSaveButton,
                (isSaving || !name.trim()) && styles.modalButtonDisabled,
              ]}
              onPress={() => onSave(name.trim())}
              disabled={isSaving || !name.trim()}>
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Text style={styles.modalSaveText}>
                  {'\u062D\u0641\u0638'}
                </Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function UserInfoSection({
  name,
  phone,
  initials,
  onEditPress,
}: {
  name: string;
  phone: string;
  initials: string;
  onEditPress: () => void;
}) {
  return (
    <View style={styles.userSection}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <Text style={styles.userName}>{name}</Text>
      <Text style={styles.userPhone}>{phone}</Text>
      <Pressable onPress={onEditPress}>
        <Text style={styles.editProfileLink}>
          {'\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u0644\u0641'}
        </Text>
      </Pressable>
    </View>
  );
}

function BalanceCardsRow({
  coinBalance,
  navigation,
}: {
  coinBalance: number;
  navigation: ProfileNavigation;
}) {
  return (
    <View style={styles.balanceRow}>
      <Pressable
        style={styles.balanceCard}
        onPress={() => navigation.navigate('CoinStore')}>
        <Text style={styles.balanceCardIcon}>{'\uD83E\uDE99'}</Text>
        <Text style={styles.balanceCardAmount}>
          {coinBalance} {'\u0639\u0645\u0644\u0629'}
        </Text>
        <Pressable
          style={styles.miniPillGreen}
          onPress={() => navigation.navigate('CoinStore')}>
          <Text style={styles.miniPillGreenText}>
            {'\u0634\u062D\u0646'}
          </Text>
        </Pressable>
      </Pressable>

      <Pressable
        style={styles.balanceCard}
        onPress={() => navigation.navigate('Subscriptions')}>
        <Text style={styles.balanceCardIcon}>{'\uD83D\uDC51'}</Text>
        <Text style={styles.balanceCardPlan}>
          {'\u0645\u062C\u0627\u0646\u064A'}
        </Text>
        <Pressable
          style={styles.miniPillGold}
          onPress={() => navigation.navigate('Subscriptions')}>
          <Text style={styles.miniPillGoldText}>
            {'\u0627\u0634\u062A\u0631\u0643'}
          </Text>
        </Pressable>
      </Pressable>
    </View>
  );
}

function WatchStatsRow({stats}: {stats: WatchStat[]}) {
  return (
    <View style={styles.statsRow}>
      {stats.map(stat => (
        <View key={stat.id} style={styles.statCard}>
          <Text
            style={[
              styles.statValue,
              stat.valueColor ? {color: stat.valueColor} : undefined,
            ]}>
            {stat.prefix ?? ''}
            {stat.value}
          </Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

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
    }
  };

  return (
    <>
      <Pressable style={styles.menuItem} onPress={handlePress}>
        {item.icon !== '' && (
          <Text
            style={[
              styles.menuIcon,
              item.iconColor ? {color: item.iconColor} : undefined,
            ]}>
            {item.icon}
          </Text>
        )}

        <Text
          style={[
            styles.menuLabel,
            item.textColor ? {color: item.textColor} : undefined,
            item.icon === '' && styles.menuLabelCentered,
          ]}>
          {item.label}
        </Text>

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

      {!isLast && <View style={styles.menuDivider} />}
    </>
  );
}

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
  const logout = useAuthStore(s => s.logout);
  const isAnonymous = useAuthStore(s => s.isAnonymous);

  const {data: profile, isLoading: profileLoading} = useProfile();
  const {data: balanceData} = useBalance();
  const {data: historyData} = useWatchHistory();
  const updateProfileMutation = useUpdateProfile();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Derive watch stats from history
  const watchStats: WatchStat[] = useMemo(() => {
    const items = historyData?.items ?? [];
    const uniqueSeries = new Set(items.map(i => i.series_id));
    const episodeCount = items.length;

    return [
      {
        id: 'series',
        value: String(uniqueSeries.size),
        label: '\u0645\u0633\u0644\u0633\u0644',
      },
      {
        id: 'episodes',
        value: String(episodeCount),
        label: '\u062D\u0644\u0642\u0629',
      },
      {
        id: 'streak',
        value: '0',
        label: '\u064A\u0648\u0645',
        valueColor: colors.streak,
        prefix: '\uD83D\uDD25 ',
      },
    ];
  }, [historyData]);

  // Build coin balance from React Query or profile fallback
  const coinBalance = balanceData?.balance ?? profile?.coin_balance ?? 0;

  // Derive user display info
  const userName = profile?.name ?? '\u0645\u0633\u062A\u062E\u062F\u0645';
  const userPhone = profile?.phone ?? '';
  const userInitials = userName.slice(0, 2);

  const handleEditProfile = () => {
    setEditModalVisible(true);
  };

  const handleSaveProfile = (name: string) => {
    updateProfileMutation.mutate(
      {name},
      {
        onSuccess: () => {
          setEditModalVisible(false);
        },
        onError: () => {
          Alert.alert(
            '\u062E\u0637\u0623',
            '\u0641\u0634\u0644 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A',
          );
        },
      },
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      '\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C',
      '\u0647\u0644 \u062A\u0631\u064A\u062F \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C\u061F',
      [
        {text: '\u0625\u0644\u063A\u0627\u0621', style: 'cancel'},
        {
          text: '\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({index: 0, routes: [{name: 'Splash'}]});
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    setDeleteConfirmText('');
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmText !== 'DELETE') {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteAccount();
      await logout();
      setDeleteModalVisible(false);
      navigation.reset({index: 0, routes: [{name: 'Splash'}]});
    } catch {
      Alert.alert(
        '\u062E\u0637\u0623',
        '\u0641\u0634\u0644 \u062D\u0630\u0641 \u0627\u0644\u062D\u0633\u0627\u0628',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Build menu groups with real handlers for signout and delete
  const menuGroups = useMemo(() => {
    return MENU_GROUPS.map(group => ({
      ...group,
      items: group.items.map(item => {
        if (item.id === 'signout') {
          return {...item, onPress: () => handleSignOut()};
        }
        if (item.id === 'delete-account') {
          return {...item, onPress: () => handleDeleteAccount()};
        }
        return item;
      }),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.cta} />
        </View>
      </SafeAreaView>
    );
  }

  // Anonymous users see a login prompt instead of profile
  if (isAnonymous) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
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
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptText}>
            {'\u0633\u062C\u0644 \u062F\u062E\u0648\u0644\u0643 \u0644\u0639\u0631\u0636 \u0645\u0644\u0641\u0643 \u0627\u0644\u0634\u062E\u0635\u064A'}
          </Text>
          <Pressable
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginButtonText}>
              {'\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

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
        <UserInfoSection
          name={userName}
          phone={userPhone}
          initials={userInitials}
          onEditPress={handleEditProfile}
        />

        <BalanceCardsRow coinBalance={coinBalance} navigation={navigation} />

        <WatchStatsRow stats={watchStats} />

        {menuGroups.map(group => (
          <MenuGroupSection
            key={group.id}
            group={group}
            navigation={navigation}
          />
        ))}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <EditProfileModal
        visible={editModalVisible}
        currentName={userName}
        onClose={() => setEditModalVisible(false)}
        onSave={handleSaveProfile}
        isSaving={updateProfileMutation.isPending}
      />

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDeleteModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.deleteModalTitle}>
              {'\u062D\u0630\u0641 \u0627\u0644\u062D\u0633\u0627\u0628'}
            </Text>
            <Text style={styles.deleteModalDescription}>
              {'\u0647\u0630\u0627 \u0627\u0644\u0625\u062C\u0631\u0627\u0621 \u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0644\u062A\u0631\u0627\u062C\u0639 \u0639\u0646\u0647. \u0633\u064A\u062A\u0645 \u062D\u0630\u0641 \u062C\u0645\u064A\u0639 \u0628\u064A\u0627\u0646\u0627\u062A\u0643 \u0648\u0639\u0645\u0644\u0627\u062A\u0643.'}
            </Text>
            <Text style={styles.deleteModalHint}>
              {'\u0627\u0643\u062A\u0628 DELETE \u0644\u0644\u062A\u0623\u0643\u064A\u062F'}
            </Text>
            <TextInput
              style={styles.deleteModalInput}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="DELETE"
              placeholderTextColor={colors.textDim}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setDeleteModalVisible(false)}
                disabled={isDeleting}>
                <Text style={styles.modalCancelText}>
                  {'\u0625\u0644\u063A\u0627\u0621'}
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.deleteConfirmButton,
                  (deleteConfirmText !== 'DELETE' || isDeleting) &&
                    styles.modalButtonDisabled,
                ]}
                onPress={handleConfirmDelete}
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}>
                {isDeleting ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Text style={styles.deleteConfirmText}>
                    {'\u062D\u0630\u0641'}
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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

  /* ---- Login Prompt (anonymous) ---- */
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  loginPromptText: {
    fontSize: fontSizes.body,
    color: colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  loginButton: {
    backgroundColor: colors.cta,
    height: sizes.buttonHeight,
    paddingHorizontal: spacing.xl * 2,
    borderRadius: radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    color: colors.text,
    writingDirection: 'rtl',
  },

  /* ---- Edit Profile Modal ---- */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: spacing.xl,
  },
  modalTitle: {
    fontSize: fontSizes.sectionTitle,
    fontWeight: fontWeights.bold,
    color: colors.text,
    writingDirection: 'rtl',
    marginBottom: spacing.xl,
  },
  modalLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
  },
  modalInput: {
    backgroundColor: colors.cardElevated,
    borderRadius: radii.thumbnail,
    height: sizes.buttonHeight,
    paddingHorizontal: spacing.lg,
    fontSize: fontSizes.body,
    color: colors.text,
    writingDirection: 'rtl',
    marginBottom: spacing.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    height: sizes.buttonHeight,
    borderRadius: radii.pill,
    backgroundColor: colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },
  modalSaveButton: {
    flex: 1,
    height: sizes.buttonHeight,
    borderRadius: radii.pill,
    backgroundColor: colors.cta,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalSaveText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    color: colors.text,
    writingDirection: 'rtl',
  },

  /* ---- Delete Modal ---- */
  deleteModalTitle: {
    fontSize: fontSizes.sectionTitle,
    fontWeight: fontWeights.bold,
    color: colors.error,
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
  },
  deleteModalDescription: {
    fontSize: fontSizes.body,
    color: colors.textMuted,
    writingDirection: 'rtl',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  deleteModalHint: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  deleteModalInput: {
    backgroundColor: colors.cardElevated,
    borderRadius: radii.thumbnail,
    height: sizes.buttonHeight,
    paddingHorizontal: spacing.lg,
    fontSize: fontSizes.body,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: spacing.xl,
  },
  deleteConfirmButton: {
    flex: 1,
    height: sizes.buttonHeight,
    borderRadius: radii.pill,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteConfirmText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    color: colors.text,
    writingDirection: 'rtl',
  },

  /* ---- Bottom spacer ---- */
  bottomSpacer: {
    height: spacing.section,
  },
});
