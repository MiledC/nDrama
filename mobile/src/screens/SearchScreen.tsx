import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import SearchBar from '../components/SearchBar';
import CategoryGrid, {Category} from '../components/CategoryGrid';
import TrendingList, {TrendingItem} from '../components/TrendingList';
import {colors, fontSizes, fontWeights, spacing, radii} from '../theme';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const RECENT_SEARCHES = ['Desert Rose', 'Riyadh Nights', 'صحراء'];

const TRENDING_ITEMS: TrendingItem[] = [
  {id: '1', rank: 1, title: 'وردة الصحراء'},
  {id: '2', rank: 2, title: 'ليالي الرياض'},
  {id: '3', rank: 3, title: 'القصر الأخير'},
  {id: '4', rank: 4, title: 'ظل الماضي'},
  {id: '5', rank: 5, title: 'نبض المدينة'},
  {id: '6', rank: 6, title: 'سراب'},
  {id: '7', rank: 7, title: 'عهد الوفاء'},
  {id: '8', rank: 8, title: 'غربة'},
  {id: '9', rank: 9, title: 'طريق النور'},
  {id: '10', rank: 10, title: 'الميراث'},
];

const CATEGORIES: Category[] = [
  {id: 'drama', name: 'دراما', bgColor: '#7F1D1D'},
  {id: 'romance', name: 'رومانسية', bgColor: '#831843'},
  {id: 'comedy', name: 'كوميدي', bgColor: '#713F12'},
  {id: 'thriller', name: 'إثارة', bgColor: '#6D28D9'},
  {id: 'action', name: 'أكشن', bgColor: '#1E3A5F'},
  {id: 'family', name: 'عائلي', bgColor: '#14532D'},
  {id: 'social', name: 'اجتماعي', bgColor: '#5C3D2E'},
  {id: 'historical', name: 'تاريخي', bgColor: '#78350F'},
];

interface MockSeries {
  id: string;
  title: string;
  genre: string;
  episodeCount: number;
}

const MOCK_SERIES: MockSeries[] = [
  {id: 's1', title: 'وردة الصحراء', genre: 'دراما', episodeCount: 24},
  {id: 's2', title: 'ليالي الرياض', genre: 'رومانسية', episodeCount: 16},
  {id: 's3', title: 'القصر الأخير', genre: 'إثارة', episodeCount: 20},
  {id: 's4', title: 'ظل الماضي', genre: 'دراما', episodeCount: 18},
  {id: 's5', title: 'نبض المدينة', genre: 'اجتماعي', episodeCount: 30},
  {id: 's6', title: 'سراب', genre: 'إثارة', episodeCount: 12},
  {id: 's7', title: 'عهد الوفاء', genre: 'عائلي', episodeCount: 22},
  {id: 's8', title: 'غربة', genre: 'دراما', episodeCount: 14},
  {id: 's9', title: 'طريق النور', genre: 'تاريخي', episodeCount: 26},
  {id: 's10', title: 'الميراث', genre: 'دراما', episodeCount: 20},
  {id: 's11', title: 'Desert Rose', genre: 'دراما', episodeCount: 24},
  {id: 's12', title: 'Riyadh Nights', genre: 'رومانسية', episodeCount: 16},
  {id: 's13', title: 'صحراء الأحلام', genre: 'أكشن', episodeCount: 10},
];

const DEBOUNCE_MS = 300;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Search & Explore screen with two states:
 * 1. Default — recent searches, trending list, browse categories
 * 2. Results — filtered series list while typing
 */
const SearchScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search query
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  // Filter mock data
  const searchResults = debouncedQuery.trim()
    ? MOCK_SERIES.filter(
        s =>
          s.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          s.genre.includes(debouncedQuery),
      )
    : [];

  const isShowingResults = query.trim().length > 0;

  const handleChipPress = useCallback((chip: string) => {
    setQuery(chip);
    setIsFocused(true);
  }, []);

  const handleCancel = useCallback(() => {
    setQuery('');
    setIsFocused(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Recent searches pills
  // ---------------------------------------------------------------------------
  const renderRecentSearches = () => (
    <View style={styles.recentSection}>
      <View style={styles.recentHeader}>
        <Text style={styles.recentLabel}>الأخيرة</Text>
        <Pressable hitSlop={8}>
          <Text style={styles.clearButton}>مسح</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}>
        {RECENT_SEARCHES.map((term, idx) => (
          <Pressable
            key={idx}
            style={styles.chip}
            onPress={() => handleChipPress(term)}>
            <Text style={styles.chipIcon}>&#x1F552;</Text>
            <Text style={styles.chipText}>{term}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  // ---------------------------------------------------------------------------
  // Search results
  // ---------------------------------------------------------------------------
  const renderResultItem = ({item}: {item: MockSeries}) => (
    <Pressable style={styles.resultRow}>
      {/* Thumbnail placeholder */}
      <View style={styles.resultThumbnail} />
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.resultGenre} numberOfLines={1}>
          {item.genre}
        </Text>
        <Text style={styles.resultEpisodes}>
          {item.episodeCount} حلقة
        </Text>
      </View>
    </Pressable>
  );

  const renderEmptyResults = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>لا توجد نتائج</Text>
    </View>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View style={[styles.root, {paddingTop: insets.top}]}>
      {/* Sticky search bar */}
      <SearchBar
        value={query}
        onChangeText={setQuery}
        onFocus={() => setIsFocused(true)}
        onCancel={handleCancel}
        isFocused={isFocused}
      />

      {isShowingResults ? (
        /* ---- Search results state ---- */
        <FlatList
          data={searchResults}
          renderItem={renderResultItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.resultsContent}
          ListEmptyComponent={debouncedQuery.trim() ? renderEmptyResults : null}
          keyboardShouldPersistTaps="handled"
        />
      ) : (
        /* ---- Default / browse state ---- */
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Recent searches */}
          {renderRecentSearches()}

          {/* Trending */}
          <View style={styles.sectionSpacing}>
            <TrendingList items={TRENDING_ITEMS} />
          </View>

          {/* Browse categories */}
          <View style={styles.sectionSpacing}>
            <CategoryGrid categories={CATEGORIES} />
          </View>

          {/* Bottom breathing room */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </View>
  );
};

export default SearchScreen;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const THUMBNAIL_WIDTH = 55;
const THUMBNAIL_HEIGHT = 82; // ~2:3 portrait

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  /* ---- Scroll content ---- */
  scrollContent: {
    paddingBottom: spacing.section,
  },
  sectionSpacing: {
    marginTop: spacing.section,
  },
  bottomSpacer: {
    height: spacing.section,
  },

  /* ---- Recent searches ---- */
  recentSection: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  recentLabel: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },
  clearButton: {
    fontSize: fontSizes.body,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    gap: spacing.xs,
  },
  chipIcon: {
    fontSize: fontSizes.caption,
    opacity: 0.6,
  },
  chipText: {
    fontSize: fontSizes.caption,
    color: colors.text,
  },

  /* ---- Search results ---- */
  resultsContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    height: 80,
  },
  resultThumbnail: {
    width: THUMBNAIL_WIDTH,
    height: THUMBNAIL_HEIGHT,
    borderRadius: radii.thumbnail,
    backgroundColor: colors.cardElevated,
    marginEnd: spacing.md,
  },
  resultInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: fontSizes.body,
    color: colors.text,
    fontWeight: fontWeights.medium,
    writingDirection: 'rtl',
  },
  resultGenre: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
    marginTop: 2,
    writingDirection: 'rtl',
  },
  resultEpisodes: {
    fontSize: fontSizes.caption,
    color: colors.textDim,
    marginTop: 2,
    writingDirection: 'rtl',
  },

  /* ---- Empty state ---- */
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
  },
  emptyText: {
    fontSize: fontSizes.cardTitle,
    color: colors.textDim,
    writingDirection: 'rtl',
  },
});
