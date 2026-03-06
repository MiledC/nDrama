import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  SectionList,
  Pressable,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {colors, fontSizes, fontWeights, spacing, radii} from '../theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = NativeStackScreenProps<RootStackParamList, 'WatchHistory'>;

interface HistoryItem {
  id: string;
  seriesId: string;
  episodeId: string;
  seriesTitle: string;
  episodeNumber: number;
  episodeTitle: string;
  duration: string;
  progress: number; // 0-1
}

interface HistorySection {
  title: string;
  data: HistoryItem[];
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const INITIAL_HISTORY: HistorySection[] = [
  {
    title: '\u0627\u0644\u064A\u0648\u0645', // اليوم
    data: [
      {
        id: 'h1',
        seriesId: 'series-1',
        episodeId: 'ep-31',
        seriesTitle: '\u0638\u0644\u0627\u0644 \u0627\u0644\u0635\u062D\u0631\u0627\u0621',
        episodeNumber: 31,
        episodeTitle: '\u0627\u0644\u0639\u0627\u0635\u0641\u0629',
        duration: '04:23',
        progress: 0.65,
      },
      {
        id: 'h2',
        seriesId: 'series-2',
        episodeId: 'ep-12',
        seriesTitle: '\u0644\u064A\u0627\u0644\u064A \u0627\u0644\u0631\u064A\u0627\u0636',
        episodeNumber: 12,
        episodeTitle: '\u0627\u0644\u0644\u0642\u0627\u0621',
        duration: '03:45',
        progress: 1,
      },
      {
        id: 'h3',
        seriesId: 'series-1',
        episodeId: 'ep-30',
        seriesTitle: '\u0638\u0644\u0627\u0644 \u0627\u0644\u0635\u062D\u0631\u0627\u0621',
        episodeNumber: 30,
        episodeTitle: '\u0627\u0644\u0628\u062F\u0627\u064A\u0629',
        duration: '05:10',
        progress: 1,
      },
    ],
  },
  {
    title: '\u0623\u0645\u0633', // أمس
    data: [
      {
        id: 'h4',
        seriesId: 'series-3',
        episodeId: 'ep-7',
        seriesTitle: '\u0623\u0633\u0631\u0627\u0631 \u0627\u0644\u0639\u0627\u0626\u0644\u0629',
        episodeNumber: 7,
        episodeTitle: '\u0627\u0644\u062D\u0642\u064A\u0642\u0629',
        duration: '04:50',
        progress: 0.45,
      },
      {
        id: 'h5',
        seriesId: 'series-4',
        episodeId: 'ep-2',
        seriesTitle: '\u0648\u0639\u062F \u0627\u0644\u0623\u0645\u0644',
        episodeNumber: 2,
        episodeTitle: '\u0627\u0644\u0648\u0639\u062F',
        duration: '03:20',
        progress: 1,
      },
    ],
  },
  {
    title: '15 \u0641\u0628\u0631\u0627\u064A\u0631', // 15 فبراير
    data: [
      {
        id: 'h6',
        seriesId: 'series-5',
        episodeId: 'ep-5',
        seriesTitle: '\u0635\u0631\u0627\u0639 \u0627\u0644\u0642\u0645\u0629',
        episodeNumber: 5,
        episodeTitle: '\u0627\u0644\u0645\u0648\u0627\u062C\u0647\u0629',
        duration: '04:00',
        progress: 0.8,
      },
      {
        id: 'h7',
        seriesId: 'series-6',
        episodeId: 'ep-4',
        seriesTitle: '\u062D\u0643\u0627\u064A\u0627\u062A \u0627\u0644\u0632\u0645\u0646',
        episodeNumber: 4,
        episodeTitle: '\u0627\u0644\u0630\u0643\u0631\u064A\u0627\u062A',
        duration: '03:55',
        progress: 1,
      },
      {
        id: 'h8',
        seriesId: 'series-5',
        episodeId: 'ep-4',
        seriesTitle: '\u0635\u0631\u0627\u0639 \u0627\u0644\u0642\u0645\u0629',
        episodeNumber: 4,
        episodeTitle: '\u0627\u0644\u062A\u062D\u062F\u064A',
        duration: '04:15',
        progress: 1,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const THUMBNAIL_WIDTH = 55;
const THUMBNAIL_HEIGHT = 82; // ~2:3 portrait

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Thumbnail with progress bar and play overlay */
function Thumbnail({progress}: {progress: number}) {
  return (
    <View style={styles.thumbnail}>
      {/* Placeholder background */}
      <View style={styles.thumbnailBg}>
        <Text style={styles.thumbnailPlayIcon}>{'\u25B6'}</Text>
      </View>

      {/* Progress bar at bottom */}
      <View style={styles.thumbnailProgressTrack}>
        <View
          style={[
            styles.thumbnailProgressFill,
            {width: `${Math.min(progress * 100, 100)}%`},
          ]}
        />
      </View>
    </View>
  );
}

/** Single history item row */
function HistoryItemRow({
  item,
  onPress,
}: {
  item: HistoryItem;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({pressed}) => [
        styles.historyItem,
        pressed && styles.historyItemPressed,
      ]}
      onPress={onPress}>
      {/* Thumbnail */}
      <Thumbnail progress={item.progress} />

      {/* Info */}
      <View style={styles.historyInfo}>
        {/* Series title */}
        <Text style={styles.historySeriesTitle} numberOfLines={1}>
          {item.seriesTitle}
        </Text>

        {/* Episode info */}
        <Text style={styles.historyEpisode} numberOfLines={1}>
          {'\u062D'} {item.episodeNumber} {'\u2014'} {item.episodeTitle}
        </Text>

        {/* Duration */}
        <Text style={styles.historyDuration}>{item.duration}</Text>
      </View>
    </Pressable>
  );
}

/** Empty state when history is empty */
function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      {/* Clock icon */}
      <Text style={styles.emptyIcon}>{'\uD83D\uDD52'}</Text>

      {/* Title */}
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
  const [history, setHistory] = useState<HistorySection[]>(INITIAL_HISTORY);

  const handleItemPress = useCallback(
    (item: HistoryItem) => {
      navigation.navigate('VideoPlayer', {
        episodeId: item.episodeId,
        seriesId: item.seriesId,
      });
    },
    [navigation],
  );

  const handleClearHistory = useCallback(() => {
    Alert.alert(
      '\u0645\u0633\u062D \u0627\u0644\u0633\u062C\u0644', // مسح السجل
      '\u0647\u0644 \u062A\u0631\u064A\u062F \u0645\u0633\u062D \u0633\u062C\u0644 \u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0629 \u0628\u0627\u0644\u0643\u0627\u0645\u0644\u061F', // هل تريد مسح سجل المشاهدة بالكامل؟
      [
        {
          text: '\u0625\u0644\u063A\u0627\u0621', // إلغاء
          style: 'cancel',
        },
        {
          text: '\u0645\u0633\u062D', // مسح
          style: 'destructive',
          onPress: () => setHistory([]),
        },
      ],
    );
  }, []);

  const hasHistory = history.length > 0 && history.some(s => s.data.length > 0);

  const renderItem = useCallback(
    ({item}: {item: HistoryItem}) => (
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

  const keyExtractor = useCallback((item: HistoryItem) => item.id, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={[styles.header, {paddingTop: insets.top + spacing.sm}]}>
        {/* Back button */}
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}>
          <Text style={styles.backIcon}>{'\u276F'}</Text>
        </Pressable>

        {/* Title */}
        <Text style={styles.headerTitle}>
          {'\u0633\u062C\u0644 \u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0629'}
        </Text>

        {/* Clear history / spacer */}
        {hasHistory ? (
          <Pressable onPress={handleClearHistory} hitSlop={8}>
            <Text style={styles.clearButton}>
              {'\u0645\u0633\u062D \u0627\u0644\u0633\u062C\u0644'}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {/* Content */}
      {!hasHistory ? (
        <EmptyState />
      ) : (
        <SectionList
          sections={history}
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
  clearButton: {
    fontSize: fontSizes.body,
    color: colors.error,
    writingDirection: 'rtl',
  },
  headerSpacer: {
    width: 36,
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
