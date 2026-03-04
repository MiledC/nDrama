import React from 'react';
import {View, Text, FlatList, Pressable, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {colors, fontSizes, fontWeights, spacing, radii} from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export interface ContinueWatchingItem {
  id: string;
  seriesId: string;
  title: string;
  thumbnail: string | null;
  currentEp: number;
  totalEps: number;
  /** Progress as a decimal 0..1 */
  progress: number;
}

interface ContinueWatchingRowProps {
  items: ContinueWatchingItem[];
}

const CARD_WIDTH = 160;
const CARD_HEIGHT = CARD_WIDTH * (9 / 16); // 16:9 ratio

export default function ContinueWatchingRow({items}: ContinueWatchingRowProps) {
  const navigation = useNavigation<Nav>();

  if (items.length === 0) {
    return null;
  }

  const handlePress = (item: ContinueWatchingItem) => {
    navigation.navigate('SeriesDetail', {seriesId: item.seriesId});
  };

  const renderItem = ({item}: {item: ContinueWatchingItem}) => (
    <Pressable
      style={styles.card}
      onPress={() => handlePress(item)}>
      {/* Thumbnail placeholder */}
      <View style={styles.thumbnailContainer}>
        <View style={styles.thumbnail} />

        {/* Play button overlay */}
        <View style={styles.playOverlay}>
          <View style={styles.playButton}>
            <Text style={styles.playIcon}>{'▶'}</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {width: `${Math.round(item.progress * 100)}%`},
            ]}
          />
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={1}>
        {item.title}
      </Text>

      {/* Episode caption */}
      <Text style={styles.caption}>
        ح {item.currentEp}/{item.totalEps}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>أكمل المشاهدة</Text>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        inverted
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.section,
  },
  header: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSizes.sectionTitle,
    fontWeight: fontWeights.bold,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  listContent: {
    paddingHorizontal: spacing.xs,
  },
  card: {
    width: CARD_WIDTH,
    marginHorizontal: spacing.sm,
  },
  thumbnailContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radii.thumbnail,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.cardElevated,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    color: colors.text,
    fontSize: 12,
    marginLeft: 2,
  },
  progressBarTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.cta,
  },
  title: {
    color: colors.text,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
    marginTop: spacing.sm,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  caption: {
    color: colors.textMuted,
    fontSize: fontSizes.caption,
    marginTop: spacing.xs,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
});
