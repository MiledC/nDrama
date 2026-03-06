import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {colors, fontSizes, fontWeights, spacing, radii} from '../theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MyListNavigation = NativeStackNavigationProp<RootStackParamList>;

interface SavedSeries {
  id: string;
  seriesId: string;
  title: string;
  episodeCount: number;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const INITIAL_SAVED_SERIES: SavedSeries[] = [
  {id: 'sl-1', seriesId: 'series-1', title: 'ظلال الصحراء', episodeCount: 78},
  {id: 'sl-2', seriesId: 'series-2', title: 'ليالي الرياض', episodeCount: 52},
  {id: 'sl-3', seriesId: 'series-3', title: 'أسرار العائلة', episodeCount: 65},
  {id: 'sl-4', seriesId: 'series-4', title: 'وعد الأمل', episodeCount: 40},
  {id: 'sl-5', seriesId: 'series-5', title: 'صراع القمة', episodeCount: 30},
  {id: 'sl-6', seriesId: 'series-6', title: 'حكايات الزمن', episodeCount: 45},
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const GRID_GAP = spacing.md;
const GRID_HORIZONTAL_PADDING = spacing.lg;
const CARD_WIDTH =
  (SCREEN_WIDTH - GRID_HORIZONTAL_PADDING * 2 - GRID_GAP) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.5; // 2:3 ratio

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Single saved series card in the grid */
function SeriesCard({
  item,
  onPress,
  onLongPress,
}: {
  item: SavedSeries;
  onPress: () => void;
  onLongPress: () => void;
}) {
  return (
    <Pressable
      style={({pressed}) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      onLongPress={onLongPress}>
      {/* Thumbnail placeholder */}
      <View style={styles.cardThumbnail}>
        <Text style={styles.cardThumbnailIcon}>{'\uD83C\uDFAC'}</Text>
      </View>

      {/* Title */}
      <Text style={styles.cardTitle} numberOfLines={1}>
        {item.title}
      </Text>

      {/* Episode count */}
      <Text style={styles.cardEpisodeCount}>
        {item.episodeCount} {'\u062D\u0644\u0642\u0629'}
      </Text>
    </Pressable>
  );
}

/** Empty state when user has no saved series */
function EmptyState({onBrowse}: {onBrowse: () => void}) {
  return (
    <View style={styles.emptyContainer}>
      {/* Bookmark icon */}
      <Text style={styles.emptyIcon}>{'\uD83D\uDD16'}</Text>

      {/* Title */}
      <Text style={styles.emptyTitle}>
        {'\u0642\u0627\u0626\u0645\u062A\u0643 \u0641\u0627\u0631\u063A\u0629'}
      </Text>

      {/* Subtitle */}
      <Text style={styles.emptySubtitle}>
        {'\u0623\u0636\u0641 \u0645\u0633\u0644\u0633\u0644\u0627\u062A \u0644\u0645\u0634\u0627\u0647\u062F\u062A\u0647\u0627 \u0644\u0627\u062D\u0642\u0627\u064B'}
      </Text>

      {/* Browse button — green outline */}
      <Pressable
        style={({pressed}) => [
          styles.browseButton,
          pressed && styles.browseButtonPressed,
        ]}
        onPress={onBrowse}>
        <Text style={styles.browseButtonText}>
          {'\u062A\u0635\u0641\u062D \u0627\u0644\u0645\u0633\u0644\u0633\u0644\u0627\u062A'}
        </Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function MyListScreen() {
  const navigation = useNavigation<MyListNavigation>();
  const [savedSeries, setSavedSeries] =
    useState<SavedSeries[]>(INITIAL_SAVED_SERIES);

  const handleSeriesPress = useCallback(
    (seriesId: string) => {
      navigation.navigate('SeriesDetail', {seriesId});
    },
    [navigation],
  );

  const handleSeriesLongPress = useCallback(
    (item: SavedSeries) => {
      Alert.alert(
        item.title,
        '',
        [
          {
            text: '\u0625\u0632\u0627\u0644\u0629 \u0645\u0646 \u0627\u0644\u0642\u0627\u0626\u0645\u0629', // إزالة من القائمة
            style: 'destructive',
            onPress: () => {
              setSavedSeries(prev => prev.filter(s => s.id !== item.id));
            },
          },
          {
            text: '\u0625\u0644\u063A\u0627\u0621', // إلغاء
            style: 'cancel',
          },
        ],
      );
    },
    [],
  );

  const handleBrowse = useCallback(() => {
    // Navigate to Home tab
    navigation.getParent()?.navigate('Home');
  }, [navigation]);

  const renderItem = useCallback(
    ({item}: {item: SavedSeries}) => (
      <SeriesCard
        item={item}
        onPress={() => handleSeriesPress(item.seriesId)}
        onLongPress={() => handleSeriesLongPress(item)}
      />
    ),
    [handleSeriesPress, handleSeriesLongPress],
  );

  const keyExtractor = useCallback((item: SavedSeries) => item.id, []);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {'\u0642\u0627\u0626\u0645\u062A\u064A'}
        </Text>
      </View>

      {/* Content */}
      {savedSeries.length === 0 ? (
        <EmptyState onBrowse={handleBrowse} />
      ) : (
        <FlatList
          data={savedSeries}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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

  /* ---- Header ---- */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: fontSizes.sectionTitle,
    fontWeight: fontWeights.bold,
    color: colors.text,
    writingDirection: 'rtl',
  },

  /* ---- Grid ---- */
  gridContent: {
    paddingHorizontal: GRID_HORIZONTAL_PADDING,
    paddingBottom: spacing.section * 2,
  },
  gridRow: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },

  /* ---- Card ---- */
  card: {
    width: CARD_WIDTH,
  },
  cardPressed: {
    opacity: 0.7,
  },
  cardThumbnail: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radii.thumbnail,
    backgroundColor: colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardThumbnailIcon: {
    fontSize: 32,
    opacity: 0.3,
  },
  cardTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
    color: colors.text,
    writingDirection: 'rtl',
    marginBottom: spacing.xs,
  },
  cardEpisodeCount: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
    writingDirection: 'rtl',
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
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSizes.body,
    color: colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  browseButton: {
    borderWidth: 1,
    borderColor: colors.cta,
    height: 44,
    paddingHorizontal: spacing.xxl,
    borderRadius: radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  browseButtonPressed: {
    opacity: 0.7,
    backgroundColor: colors.ctaGlow,
  },
  browseButtonText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.cta,
    writingDirection: 'rtl',
  },
});
