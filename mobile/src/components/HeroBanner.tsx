import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Image,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {colors, fontSizes, fontWeights, spacing, radii, sizes} from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.65;
const AUTO_SCROLL_INTERVAL = 5000; // 5 seconds

interface FeaturedSeries {
  id: string;
  title: string;
  thumbnail_url: string | null;
  genreTags: string[];
}

interface HeroBannerProps {
  featured: FeaturedSeries[];
}

export default function HeroBanner({featured}: HeroBannerProps) {
  const navigation = useNavigation<Nav>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const flatListRef = useRef<FlatList<FeaturedSeries>>(null);
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Handle watch button press
  const handleWatch = (seriesId: string) => {
    navigation.navigate('SeriesDetail', {seriesId});
  };

  // Calculate active index from scroll position
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / SCREEN_WIDTH);
    setActiveIndex(currentIndex);
  }, []);

  // Handle scroll start (user interaction)
  const handleScrollBeginDrag = useCallback(() => {
    setIsUserInteracting(true);
    // Clear auto-scroll timer when user interacts
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
  }, []);

  // Handle scroll end (resume auto-scroll)
  const handleScrollEndDrag = useCallback(() => {
    setIsUserInteracting(false);
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    if (!isUserInteracting && featured.length > 1) {
      autoScrollTimer.current = setInterval(() => {
        if (flatListRef.current) {
          const nextIndex = (activeIndex + 1) % featured.length;
          flatListRef.current.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
        }
      }, AUTO_SCROLL_INTERVAL);

      return () => {
        if (autoScrollTimer.current) {
          clearInterval(autoScrollTimer.current);
        }
      };
    }
  }, [activeIndex, isUserInteracting, featured.length]);

  // Render each featured item
  const renderItem = useCallback(({item}: {item: FeaturedSeries}) => {
    return (
      <View style={styles.heroItem}>
        {/* Background artwork or placeholder */}
        {item.thumbnail_url ? (
          <Image
            source={{uri: item.thumbnail_url}}
            style={styles.artwork}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.artworkPlaceholder} />
        )}

        {/* Top gradient (subtle dark fade from top) */}
        <View style={styles.topGradient} />

        {/* Bottom gradient overlay (transparent top to solid #0D0D0D bottom) */}
        <View style={styles.bottomGradient} />
        <View style={styles.bottomGradientDark} />

        {/* Content overlay at bottom */}
        <View style={styles.contentOverlay}>
          {/* Series title */}
          <Text style={styles.title}>{item.title}</Text>

          {/* Genre pills */}
          {item.genreTags.length > 0 && (
            <View style={styles.genreRow}>
              {item.genreTags.map((tag, index) => (
                <View key={index} style={styles.genrePill}>
                  <Text style={styles.genreText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionRow}>
            {/* Watch now button */}
            <Pressable
              style={styles.watchButton}
              onPress={() => handleWatch(item.id)}>
              <Text style={styles.watchButtonText}>شاهد الآن</Text>
            </Pressable>

            {/* My list circle button */}
            <Pressable style={styles.myListButton}>
              <Text style={styles.myListIcon}>+</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }, []);

  if (!featured || featured.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={featured}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Pagination dots - positioned absolutely over the content */}
      {featured.length > 1 && (
        <View style={styles.dotsContainer}>
          <View style={styles.dotsRow}>
            {featured.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === activeIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroItem: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    position: 'relative',
  },
  artwork: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
  },
  artworkPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1A1A1A',
    // Simulating a subtle gradient with a slightly lighter area
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(13, 13, 13, 0.4)',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT * 0.5,
    backgroundColor: 'rgba(13, 13, 13, 0.6)',
  },
  bottomGradientDark: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT * 0.25,
    backgroundColor: 'rgba(13, 13, 13, 0.85)',
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: fontSizes.hero,
    fontWeight: fontWeights.bold,
    writingDirection: 'rtl',
    marginBottom: spacing.md,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  genrePill: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  genreText: {
    color: colors.text,
    fontSize: fontSizes.tabLabel,
    fontWeight: fontWeights.medium,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  watchButton: {
    backgroundColor: '#00B856',
    height: 40,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  watchButtonText: {
    color: colors.text,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
  },
  myListButton: {
    width: sizes.buttonHeightXs,
    height: sizes.buttonHeightXs,
    borderRadius: sizes.buttonHeightXs / 2,
    backgroundColor: colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myListIcon: {
    color: colors.text,
    fontSize: 20,
    fontWeight: fontWeights.medium,
    lineHeight: 22,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: spacing.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    backgroundColor: colors.text,
  },
});
