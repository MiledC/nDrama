import React, {useState, useRef, useCallback, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  StatusBar,
  Dimensions,
  Animated,
  ViewToken,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {colors, fontSizes, fontWeights, spacing, radii} from '../theme';
import {useSeriesList} from '../hooks';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface DiscoverItem {
  id: string;
  title: string;
  episode: string;
  genres: string;
  likes: string;
  comments: string;
  bgColor: string;
  seriesId: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Dark color palette for rotating backgrounds
const BG_COLORS = [
  '#1a0a0a', // Dark red-tinted
  '#0a0a1a', // Dark blue-tinted
  '#0a1a0a', // Dark green-tinted
  '#1a0a1a', // Dark purple-tinted
  '#1a1a0a', // Dark yellow-tinted
  '#0a1a1a', // Dark cyan-tinted
];

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const ICON_SIZE = 28;
const SIDEBAR_GAP = spacing.xl;
const DOT_SIZE = 4;
const DOT_GAP = 8;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Single action button in the social sidebar */
function SidebarAction({
  icon,
  count,
  onPress,
}: {
  icon: string;
  count?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [
        styles.sidebarAction,
        pressed && styles.sidebarActionPressed,
      ]}>
      <Text style={styles.sidebarIcon}>{icon}</Text>
      {count != null && <Text style={styles.sidebarCount}>{count}</Text>}
    </Pressable>
  );
}

/** Progress dots indicating current position in the feed */
function ProgressDots({
  total,
  activeIndex,
}: {
  total: number;
  activeIndex: number;
}) {
  // Show at most 4 dots centered around the active index
  const maxVisible = 4;
  const half = Math.floor(maxVisible / 2);
  let start = Math.max(0, activeIndex - half);
  const end = Math.min(total, start + maxVisible);
  if (end - start < maxVisible) {
    start = Math.max(0, end - maxVisible);
  }

  const dots = [];
  for (let i = start; i < end; i++) {
    dots.push(
      <View
        key={i}
        style={[
          styles.dot,
          i === activeIndex ? styles.dotActive : styles.dotInactive,
        ]}
      />,
    );
  }

  return <View style={styles.dotsContainer}>{dots}</View>;
}

/** Swipe-up hint shown on first load */
function SwipeHint({visible}: {visible: boolean}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      return;
    }

    // Pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -12,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    pulse.start();

    return () => pulse.stop();
  }, [visible, opacity, translateY]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.swipeHint, {opacity, transform: [{translateY}]}]}>
      <Text style={styles.swipeArrow}>{'\u25B2'}</Text>
      <Text style={styles.swipeText}>{'اسحب للأعلى'}</Text>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Feed Item
// ---------------------------------------------------------------------------

function FeedItem({
  item,
  onWatchSeries,
}: {
  item: DiscoverItem;
  onWatchSeries: (seriesId: string) => void;
}) {
  return (
    <View style={[styles.feedItem, {backgroundColor: item.bgColor}]}>
      {/* Cinematic gradient background placeholder */}
      <View style={styles.bgGradientBottom} />
      <View style={styles.bgGradientTop} />

      {/* Top overlay — Watermark */}
      <View style={styles.topOverlay}>
        <Text style={styles.watermark}>{'Draama'}</Text>
      </View>

      {/* Social sidebar (left for RTL) */}
      <View style={styles.sidebar}>
        <SidebarAction icon={'\u2661'} count={item.likes || undefined} />
        <SidebarAction icon={'\uD83D\uDCAC'} count={item.comments || undefined} />
        <SidebarAction icon={'\u2197'} />
        <SidebarAction icon={'\u2606'} />
      </View>

      {/* Bottom overlay — series info + CTA */}
      <View style={styles.bottomOverlay}>
        <Text style={styles.seriesTitle}>{item.title}</Text>
        <Text style={styles.metadata}>
          {item.episode} {'\u2022'} {item.genres}
        </Text>
        <Pressable
          style={({pressed}) => [
            styles.watchButton,
            pressed && styles.watchButtonPressed,
          ]}
          onPress={() => onWatchSeries(item.seriesId)}>
          <Text style={styles.watchButtonText}>{'شاهد المسلسل'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function DiscoverScreen() {
  const navigation = useNavigation<Nav>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Fetch series list from API
  const {data, isLoading, isError} = useSeriesList({limit: 20});

  // Transform API data to DiscoverItem format
  const discoverItems = useMemo<DiscoverItem[]>(() => {
    if (!data?.items) return [];

    return data.items.map((series, index) => ({
      id: series.id,
      title: series.title,
      episode: 'ح 1', // Default since we don't have the latest episode info
      genres: series.tags.map(tag => tag.name).join('، ') || 'عام',
      likes: '', // Not available from API
      comments: '', // Not available from API
      bgColor: BG_COLORS[index % BG_COLORS.length],
      seriesId: series.id,
    }));
  }, [data]);

  const onViewableItemsChanged = useRef(
    ({viewableItems}: {viewableItems: ViewToken[]}) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
        setHasScrolled(true);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const handleWatchSeries = useCallback(
    (seriesId: string) => {
      navigation.navigate('SeriesDetail', {seriesId});
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({item}: {item: DiscoverItem}) => (
      <FeedItem item={item} onWatchSeries={handleWatchSeries} />
    ),
    [handleWatchSeries],
  );

  const keyExtractor = useCallback((item: DiscoverItem) => item.id, []);

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.cta} />
      </View>
    );
  }

  // Error or empty state
  if (isError || discoverItems.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>
          {isError ? 'حدث خطأ في تحميل المحتوى' : 'لا يوجد محتوى متاح'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <FlatList
        data={discoverItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_data, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />

      {/* Progress dots — left edge for RTL */}
      <ProgressDots total={discoverItems.length} activeIndex={activeIndex} />

      {/* Swipe up hint — first load only */}
      <SwipeHint visible={!hasScrolled} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // Center container for loading/empty states
  centerContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: fontSizes.body,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },

  // Feed item — full screen
  feedItem: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'flex-end',
  },

  // Background gradients (simulated with solid overlays)
  bgGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.40)',
  },
  bgGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.60)',
  },

  // Top overlay
  topOverlay: {
    position: 'absolute',
    top: spacing.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  watermark: {
    fontSize: fontSizes.tiny,
    color: 'rgba(255, 255, 255, 0.30)',
    fontWeight: fontWeights.medium,
    letterSpacing: 2,
  },

  // Social sidebar — positioned on left for RTL layout
  sidebar: {
    position: 'absolute',
    end: spacing.lg,
    bottom: 200,
    alignItems: 'center',
    gap: SIDEBAR_GAP,
    zIndex: 10,
  },
  sidebarAction: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  sidebarActionPressed: {
    opacity: 0.6,
  },
  sidebarIcon: {
    fontSize: ICON_SIZE,
    color: colors.text,
    textShadowColor: 'rgba(0, 0, 0, 0.60)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 4,
  },
  sidebarCount: {
    fontSize: fontSizes.caption,
    color: colors.text,
    fontWeight: fontWeights.medium,
    textShadowColor: 'rgba(0, 0, 0, 0.60)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },

  // Bottom overlay
  bottomOverlay: {
    position: 'absolute',
    bottom: 60,
    start: spacing.lg,
    end: 80,
    zIndex: 10,
    writingDirection: 'rtl',
  },
  seriesTitle: {
    fontSize: 18,
    fontWeight: fontWeights.bold,
    color: colors.text,
    writingDirection: 'rtl',
    textShadowColor: 'rgba(0, 0, 0, 0.60)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 4,
    marginBottom: spacing.xs,
  },
  metadata: {
    fontSize: 13,
    color: colors.textMuted,
    writingDirection: 'rtl',
    marginBottom: spacing.md,
  },

  // Watch series button
  watchButton: {
    backgroundColor: colors.cta,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xl,
  },
  watchButtonPressed: {
    opacity: 0.8,
  },
  watchButtonText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.text,
  },

  // Progress dots
  dotsContainer: {
    position: 'absolute',
    start: spacing.sm,
    top: '50%',
    transform: [{translateY: -((DOT_SIZE + DOT_GAP) * 2)}],
    alignItems: 'center',
    gap: DOT_GAP,
    zIndex: 20,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  dotActive: {
    backgroundColor: colors.text,
  },
  dotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.30)',
  },

  // Swipe hint
  swipeHint: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  swipeArrow: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.40)',
    marginBottom: spacing.xs,
  },
  swipeText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.40)',
    fontWeight: fontWeights.medium,
  },
});
