import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {colors, fontSizes, fontWeights, spacing, radii} from '../theme';

export interface SeriesData {
  id: string;
  title: string;
  thumbnail: string | null;
  genreTags: string[];
  episodeCount: number;
  currentEp?: number;
  progress?: number;
  viewCount: string;
  isNew: boolean;
}

interface SeriesCardProps {
  series: SeriesData;
}

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CARD_WIDTH = 130;
const CARD_IMAGE_HEIGHT = CARD_WIDTH * 1.5; // 2:3 ratio

export default function SeriesCard({series}: SeriesCardProps) {
  const navigation = useNavigation<Nav>();

  const handlePress = () => {
    navigation.navigate('SeriesDetail', {seriesId: series.id});
  };

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      {/* Thumbnail placeholder */}
      <View style={styles.thumbnailContainer}>
        <View style={styles.thumbnail} />
        {series.isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>جديد</Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={1}>
        {series.title}
      </Text>

      {/* Episode count */}
      <Text style={styles.episodeCount}>
        {series.episodeCount} حلقة
      </Text>

      {/* View count */}
      <Text style={styles.viewCount}>
        {series.viewCount} مشاهدة
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginStart: spacing.md,
  },
  thumbnailContainer: {
    position: 'relative',
    width: CARD_WIDTH,
    height: CARD_IMAGE_HEIGHT,
    borderRadius: radii.thumbnail,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.cardElevated,
  },
  newBadge: {
    position: 'absolute',
    top: spacing.sm,
    end: spacing.sm,
    backgroundColor: colors.cta,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  newBadgeText: {
    color: colors.text,
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.semibold,
  },
  title: {
    color: colors.text,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    marginTop: spacing.sm,
    writingDirection: 'rtl',
  },
  episodeCount: {
    color: colors.textMuted,
    fontSize: fontSizes.caption,
    marginTop: spacing.xs,
    writingDirection: 'rtl',
  },
  viewCount: {
    color: colors.textDim,
    fontSize: fontSizes.tabLabel,
    marginTop: 2,
    writingDirection: 'rtl',
  },
});
