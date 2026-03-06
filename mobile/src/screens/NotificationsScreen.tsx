import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {colors, fontSizes, fontWeights, spacing, sizes} from '../theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

interface NotificationItem {
  id: string;
  iconEmoji: string;
  iconBgColor: string;
  title: string;
  subtitle: string;
  timestamp: string;
  isRead: boolean;
  onPress?: () => void;
}

interface NotificationSection {
  id: string;
  title: string;
  data: NotificationItem[];
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function buildSections(nav: Props['navigation']): NotificationSection[] {
  return [
    {
      id: 'today',
      title: '\u0627\u0644\u064A\u0648\u0645',
      data: [
        {
          id: 'n1',
          iconEmoji: '\u25B6',
          iconBgColor: colors.cta,
          title: '\u062D\u0644\u0642\u0629 \u062C\u062F\u064A\u062F\u0629 \u0645\u0646 \u0638\u0644\u0627\u0644 \u0627\u0644\u0635\u062D\u0631\u0627\u0621',
          subtitle: '\u062D 32 \u0645\u062A\u0627\u062D\u0629 \u0627\u0644\u0622\u0646',
          timestamp: '\u0645\u0646\u0630 \u0633\u0627\u0639\u062A\u064A\u0646',
          isRead: false,
          onPress: () => nav.navigate('SeriesDetail', {seriesId: 'desert-shadows'}),
        },
        {
          id: 'n2',
          iconEmoji: '\uD83E\uDE99',
          iconBgColor: colors.coin,
          title: '\uD83C\uDF81 \u062D\u0635\u0644\u062A \u0639\u0644\u0649 10 \u0639\u0645\u0644\u0627\u062A \u0645\u062C\u0627\u0646\u064A\u0629!',
          subtitle: '\u0645\u0643\u0627\u0641\u0623\u0629 \u064A\u0648\u0645\u064A\u0629',
          timestamp: '\u0645\u0646\u0630 3 \u0633\u0627\u0639\u0627\u062A',
          isRead: false,
          onPress: () => nav.navigate('DailyRewards'),
        },
      ],
    },
    {
      id: 'this-week',
      title: '\u0647\u0630\u0627 \u0627\u0644\u0623\u0633\u0628\u0648\u0639',
      data: [
        {
          id: 'n3',
          iconEmoji: '\u2B50',
          iconBgColor: '#3B82F6',
          title: '\u0642\u062F \u064A\u0639\u062C\u0628\u0643: \u0644\u064A\u0627\u0644\u064A \u0627\u0644\u0631\u064A\u0627\u0636',
          subtitle: '\u0645\u0633\u0644\u0633\u0644 \u062C\u062F\u064A\u062F \u064A\u0646\u0627\u0633\u0628 \u0630\u0648\u0642\u0643',
          timestamp: '\u0642\u0628\u0644 \u064A\u0648\u0645',
          isRead: true,
          onPress: () => nav.navigate('SeriesDetail', {seriesId: 'riyadh-nights'}),
        },
        {
          id: 'n4',
          iconEmoji: '\uD83D\uDC51',
          iconBgColor: colors.coin,
          title: '\u062C\u0631\u0628 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643',
          subtitle: '\u0634\u0627\u0647\u062F \u0628\u0644\u0627 \u062D\u062F\u0648\u062F \u0645\u0642\u0627\u0628\u0644 29.99 \u0631.\u0633/\u0634\u0647\u0631',
          timestamp: '\u0642\u0628\u0644 \u064A\u0648\u0645\u064A\u0646',
          isRead: true,
          onPress: () => nav.navigate('Subscriptions'),
        },
        {
          id: 'n5',
          iconEmoji: '\u25B6',
          iconBgColor: colors.cta,
          title: '\u0647\u0644 \u0633\u062A\u0643\u062A\u0634\u0641 \u0633\u0627\u0631\u0629 \u0627\u0644\u062D\u0642\u064A\u0642\u0629\u061F \uD83D\uDE31',
          subtitle: '\u0623\u0643\u0645\u0644 \u0638\u0644\u0627\u0644 \u0627\u0644\u0635\u062D\u0631\u0627\u0621 \u0627\u0644\u0622\u0646',
          timestamp: '\u0642\u0628\u0644 \u064A\u0648\u0645\u064A\u0646',
          isRead: false,
          onPress: () => nav.navigate('SeriesDetail', {seriesId: 'desert-shadows'}),
        },
        {
          id: 'n6',
          iconEmoji: '\uD83D\uDD25',
          iconBgColor: colors.coin,
          title: '\uD83D\uDD25 \u0645\u0643\u0627\u0641\u0623\u062A\u0643 \u0627\u0644\u064A\u0648\u0645\u064A\u0629 \u0628\u0627\u0646\u062A\u0638\u0627\u0631\u0643!',
          subtitle: '\u0644\u0627 \u062A\u0641\u0642\u062F \u0633\u0644\u0633\u0644\u062A\u0643 \u0627\u0644\u0628\u0627\u0644\u063A\u0629 12 \u064A\u0648\u0645\u0627\u064B',
          timestamp: '\u0642\u0628\u0644 3 \u0623\u064A\u0627\u0645',
          isRead: false,
          onPress: () => nav.navigate('DailyRewards'),
        },
        {
          id: 'n7',
          iconEmoji: '\u26A0\uFE0F',
          iconBgColor: colors.warning,
          title: '\u26A0\uFE0F \u0633\u0644\u0633\u0644\u062A\u0643 \u0639\u0644\u0649 \u0648\u0634\u0643 \u0627\u0644\u0627\u0646\u062A\u0647\u0627\u0621!',
          subtitle: '\u0633\u062C\u0644 \u062F\u062E\u0648\u0644\u0643 \u0642\u0628\u0644 \u0645\u0646\u062A\u0635\u0641 \u0627\u0644\u0644\u064A\u0644',
          timestamp: '\u0642\u0628\u0644 4 \u0623\u064A\u0627\u0645',
          isRead: false,
        },
        {
          id: 'n8',
          iconEmoji: '\uD83C\uDF81',
          iconBgColor: colors.coin,
          title: '\uD83C\uDF89 \u0635\u062F\u064A\u0642\u0643 \u0627\u0646\u0636\u0645!',
          subtitle: '\u062D\u0635\u0644\u062A \u0639\u0644\u0649 50 \u0639\u0645\u0644\u0629',
          timestamp: '\u0642\u0628\u0644 5 \u0623\u064A\u0627\u0645',
          isRead: true,
          onPress: () => nav.navigate('Referral'),
        },
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Section header (e.g. "Today", "This Week") */
function SectionHeader({title}: {title: string}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

/** Single notification row */
function NotificationRow({
  item,
  onPress,
}: {
  item: NotificationItem;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.notificationRow} onPress={onPress}>
      {/* Icon circle */}
      <View style={[styles.iconCircle, {backgroundColor: item.iconBgColor}]}>
        <Text style={styles.iconEmoji}>{item.iconEmoji}</Text>
      </View>

      {/* Text stack */}
      <View style={styles.textStack}>
        <Text
          style={[
            styles.notificationTitle,
            item.isRead && styles.notificationTitleRead,
          ]}
          numberOfLines={1}>
          {item.title}
        </Text>
        <Text
          style={[
            styles.notificationSubtitle,
            item.isRead && styles.notificationSubtitleRead,
          ]}
          numberOfLines={1}>
          {item.subtitle}
        </Text>
        <Text style={styles.notificationTimestamp}>{item.timestamp}</Text>
      </View>

      {/* Unread dot */}
      {!item.isRead && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

/** Divider between notification rows */
function ListDivider() {
  return <View style={styles.divider} />;
}

/** Empty state when no notifications */
function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{'\uD83D\uDD14'}</Text>
      <Text style={styles.emptyText}>
        {'\u0644\u0627 \u062A\u0648\u062C\u062F \u0625\u0634\u0639\u0627\u0631\u0627\u062A'}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function NotificationsScreen({navigation}: Props) {
  const insets = useSafeAreaInsets();
  const [sections, setSections] = useState(() => buildSections(navigation));

  // Flatten sections into a list with section headers for FlatList
  const flatData = useCallback(() => {
    const result: Array<
      | {type: 'header'; id: string; title: string}
      | {type: 'item'; id: string; item: NotificationItem}
    > = [];
    for (const section of sections) {
      result.push({type: 'header', id: `header-${section.id}`, title: section.title});
      for (const item of section.data) {
        result.push({type: 'item', id: item.id, item});
      }
    }
    return result;
  }, [sections]);

  const isEmpty = sections.every(s => s.data.length === 0);

  const handleClearAll = () => {
    Alert.alert(
      '\u0645\u0633\u062D \u0627\u0644\u0643\u0644',
      '\u0647\u0644 \u062A\u0631\u064A\u062F \u0645\u0633\u062D \u062C\u0645\u064A\u0639 \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A\u061F',
      [
        {
          text: '\u0625\u0644\u063A\u0627\u0621',
          style: 'cancel',
        },
        {
          text: '\u0645\u0633\u062D',
          style: 'destructive',
          onPress: () => setSections(prev => prev.map(s => ({...s, data: []}))),
        },
      ],
    );
  };

  const handleNotificationPress = (item: NotificationItem) => {
    // Mark as read
    setSections(prev =>
      prev.map(section => ({
        ...section,
        data: section.data.map(n =>
          n.id === item.id ? {...n, isRead: true} : n,
        ),
      })),
    );
    // Navigate if handler exists
    item.onPress?.();
  };

  const data = flatData();

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
          {'\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A'}
        </Text>
        <Pressable onPress={handleClearAll} hitSlop={8}>
          <Text style={styles.clearAllText}>
            {'\u0645\u0633\u062D \u0627\u0644\u0643\u0644'}
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      {isEmpty ? (
        <EmptyState />
      ) : (
        <FlatList
          data={data}
          keyExtractor={row => row.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({item: row}) => {
            if (row.type === 'header') {
              return <SectionHeader title={row.title} />;
            }
            return (
              <NotificationRow
                item={row.item}
                onPress={() => handleNotificationPress(row.item)}
              />
            );
          }}
          ItemSeparatorComponent={ListDivider}
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const UNREAD_DOT_SIZE = 8;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
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
  clearAllText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
    color: colors.textMuted,
  },

  /* ---- List ---- */
  listContent: {
    paddingBottom: spacing.section * 2,
  },

  /* ---- Section header ---- */
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  sectionHeaderText: {
    fontSize: fontSizes.cardTitle,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },

  /* ---- Notification row ---- */
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  iconCircle: {
    width: sizes.notificationIcon,
    height: sizes.notificationIcon,
    borderRadius: sizes.notificationIcon / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 18,
    color: colors.text,
  },
  textStack: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  notificationTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    writingDirection: 'rtl',
    marginBottom: 2,
  },
  notificationTitleRead: {
    color: colors.textMuted,
  },
  notificationSubtitle: {
    fontSize: 13,
    fontWeight: fontWeights.regular,
    color: colors.textMuted,
    writingDirection: 'rtl',
    marginBottom: 2,
  },
  notificationSubtitleRead: {
    color: colors.textDim,
  },
  notificationTimestamp: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.regular,
    color: colors.textDim,
    writingDirection: 'rtl',
  },
  unreadDot: {
    width: UNREAD_DOT_SIZE,
    height: UNREAD_DOT_SIZE,
    borderRadius: UNREAD_DOT_SIZE / 2,
    backgroundColor: colors.cta,
  },

  /* ---- Divider ---- */
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },

  /* ---- Empty state ---- */
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyIcon: {
    fontSize: 48,
    color: colors.textDim,
  },
  emptyText: {
    fontSize: fontSizes.cardTitle,
    fontWeight: fontWeights.medium,
    color: colors.textDim,
    writingDirection: 'rtl',
  },
});
