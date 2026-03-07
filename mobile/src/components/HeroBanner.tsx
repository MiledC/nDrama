import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {colors, fontSizes, fontWeights, spacing, radii, sizes} from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const {height: SCREEN_HEIGHT} = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.65;

interface FeaturedSeries {
  id: string;
  title: string;
  genreTags: string[];
}

interface HeroBannerProps {
  featured: FeaturedSeries;
}

export default function HeroBanner({featured}: HeroBannerProps) {
  const navigation = useNavigation<Nav>();

  const handleWatch = () => {
    navigation.navigate('SeriesDetail', {seriesId: featured.id});
  };

  return (
    <View style={styles.container}>
      {/* Background artwork placeholder — dark gradient simulation */}
      <View style={styles.artworkPlaceholder} />

      {/* Top gradient (subtle dark fade from top) */}
      <View style={styles.topGradient} />

      {/* Bottom gradient overlay (transparent top to solid #0D0D0D bottom) */}
      <View style={styles.bottomGradient} />
      <View style={styles.bottomGradientDark} />

      {/* Content overlay at bottom */}
      <View style={styles.contentOverlay}>
        {/* Series title */}
        <Text style={styles.title}>{featured.title}</Text>

        {/* Genre pills */}
        <View style={styles.genreRow}>
          {featured.genreTags.map((tag, index) => (
            <View key={index} style={styles.genrePill}>
              <Text style={styles.genreText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          {/* Watch now button */}
          <Pressable style={styles.watchButton} onPress={handleWatch}>
            <Text style={styles.watchButtonText}>شاهد الآن</Text>
          </Pressable>

          {/* My list circle button */}
          <Pressable style={styles.myListButton}>
            <Text style={styles.myListIcon}>+</Text>
          </Pressable>
        </View>

        {/* Pagination dots */}
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: HERO_HEIGHT,
    position: 'relative',
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
    marginBottom: spacing.lg,
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
