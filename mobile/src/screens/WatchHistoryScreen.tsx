import React, {useCallback, useMemo} from 'react';
import {
  View,
  Text,
  SectionList,
  Pressable,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {colors, fontSizes, fontWeights, spacing, radii} from '../theme';
import {useWatchHistory} from '../hooks/useHistory';
import type {WatchHistoryItem} from '../types/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = NativeStackScreenProps<RootStackParamList, 'WatchHistory'>;

interface HistorySection {
  title: string;
  data: WatchHistoryItem[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function groupByDate(items: WatchHistoryItem[]): HistorySection[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);

  const groups: Record<string, WatchHistoryItem[]> = {};
  const groupOrder: string[] = [];

  for (const item of items) {
    const d = new Date(item.last_watched_at);
    const itemDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    let label: string;
    if (itemDate.getTime() === today.getTime()) {
      label = '\u0627\u0644\u064A\u0648\u0645';
    } else if (itemDate.getTime() === yesterday.getTime()) {
      label = '\u0623\u0645\u0633';
    } else {
      label = `${d.getDate()} ${getArabicMonth(d.getMonth())}`;
    }

    if (!groups[label]) {
      groups[label] = [];
      groupOrder.push(label);
    }
    groups[label].push(item);
  }

  return groupOrder.map(title => ({title, data: groups[title]}));
}

function getArabicMonth(month: number): string {
  const months = [
    '\u064A\u0646\u0627\u064A\u0631',
    '\u0641\u0628\u0631\u0627\u064A\u0631',
    '\u0645\u0627\u0631\u0633',
    '\u0623\u0628\u0631\u064A\u0644',
    '\u0645\u0627\u064A\u0648',
    '\u064A\u0648\u0646\u064A\u0648',
    '\u064A\u0648\u0644\u064A\u0648',
    '\u0623\u063A\u0633\u0637\u0633',
    '\u0633\u0628\u062A\u0645\u0628\u0631',
    '\u0623\u0643\u062A\u0648\u0628\u0631',
    '\u0646\u0648\u0641\u0645\u0628\u0631',
    '\u062F\u064A\u0633\u0645\u0628\u0631',
  ];
  return months[month];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const THUMBNAIL_WIDTH = 55;
const THUMBNAIL_HEIGHT = 82;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Thumbnail({progress, duration}: {progress: number; duration: number | null}) {
  const ratio = duration && duration > 0 ? Math.min(progress / duration, 1) : 0;

  return (
    <View style={styles.thumbnail}>
      <View style={styles.thumbnailBg}>
        <Text style={styles.thumbnailPlayIcon}>{'\u25B6'}</Text>
      </View>
      <View style={styles.thumbnailProgressTrack}>
        <View
          style={[
            styles.thumbnailProgressFill,
            {width: `${Math.min(ratio * 100, 100)}%`},
          ]}
        />
      </View>
    </View>
  );
}

function HistoryItemRow({
  item,
  onPress,
}: {
  item: WatchHistoryItem;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({pressed}) => [
        styles.historyItem,
        pressed && styles.historyItemPressed,
      ]}
      onPress={onPress}>
      <Thumbnail progress={item.progress_seconds} duration={item.duration_seconds} />
      <View style={styles.historyInfo}>
        <Text style={styles.historySeriesTitle} numberOfLines={1}>
          {item.series_title}
        </Text>
        <Text style={styles.historyEpisode} numberOfLines={1}>
          {'\u062D'} {item.episode_title}
        </Text>
        {item.duration_seconds != null && (
          <Text style={styles.historyDuration}>
            {formatDuration(item.duration_seconds)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>{'\uD83D\uDD52'}</Text>
      <Text style={styles.emptyTitle}>
        {'\u0644\u0627 \u064A\u0648\u062C\u062F \u0633\u062C\u0644 \u0645\u0634\u0627\u0647\u062F\u0629'}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function WatchHistoryScreen({navigation}: Props) {
  const insets = useSafeAreaInsets();
  const {data: historyData, isLoading} = useWatchHistory();

  const sections = useMemo(() => {
    const items = historyData?.items ?? [];
    if (items.length === 0) return [];
    return groupByDate(items);
  }, [historyData]);

  const hasHistory = sections.length > 0;

  const handleItemPress = useCallback(
    (item: WatchHistoryItem) => {
      navigation.navigate('VideoPlayer', {
        episodeId: item.episode_id,
        seriesId: item.series_id,
      });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({item}: {item: WatchHistoryItem}) => (
      <HistoryItemRow item={item} onPress={() => handleItemPress(item)} />
    ),
    [handleItemPress],
  );

  const renderSectionHeader = useCallback(
    ({section}: {section: HistorySection}) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{section.title}</Text>
      </View>
    ),
    [],
  );

  const renderSeparator = useCallback(
    () => <View style={styles.itemSeparator} />,
    [],
  );

  const keyExtractor = useCallback(
    (item: WatchHistoryItem) => item.episode_id,
    [],
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={[styles.header, {paddingTop: insets.top + spacing.sm}]}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}>
          <Text style={styles.backIcon}>{'\u276F'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {'\u0633\u062C\u0644 \u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0629'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.cta} />
        </View>
      ) : !hasHistory ? (
        <EmptyState />
      ) : (
        <SectionList
          sections={sections}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ItemSeparatorComponent={renderSeparator}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}
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

  /* ---- Loading ---- */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ---- Section Headers ---- */
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  sectionHeaderText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },

  /* ---- List ---- */
  listContent: {
    paddingBottom: spacing.section * 2,
  },

  /* ---- History Item ---- */
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  historyItemPressed: {
    backgroundColor: colors.card,
  },

  /* ---- Thumbnail ---- */
  thumbnail: {
    width: THUMBNAIL_WIDTH,
    height: THUMBNAIL_HEIGHT,
    borderRadius: radii.thumbnail,
    overflow: 'hidden',
  },
  thumbnailBg: {
    flex: 1,
    backgroundColor: colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailPlayIcon: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  thumbnailProgressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  thumbnailProgressFill: {
    height: 3,
    backgroundColor: colors.cta,
  },

  /* ---- History Info ---- */
  historyInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  historySeriesTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    writingDirection: 'rtl',
  },
  historyEpisode: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },
  historyDuration: {
    fontSize: fontSizes.caption,
    color: colors.textDim,
    writingDirection: 'rtl',
  },

  /* ---- Separator ---- */
  itemSeparator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },

  /* ---- Empty State ---- */
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    color: colors.textDim,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSizes.cardTitle,
    fontWeight: fontWeights.semibold,
    color: colors.textDim,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
});
