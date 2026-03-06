import React from 'react';
import {View, Text, FlatList, StyleSheet} from 'react-native';
import {colors, fontSizes, fontWeights, spacing} from '../theme';
import SeriesCard, {SeriesData} from './SeriesCard';

interface CategoryRowProps {
  title: string;
  /** Optional inline label like "2.4K يشاهدون الآن" */
  liveCount?: string;
  /** Whether to show a green pulsing dot next to the live count */
  showLiveDot?: boolean;
  /** List of series to display */
  series: SeriesData[];
}

export default function CategoryRow({
  title,
  liveCount,
  showLiveDot,
  series,
}: CategoryRowProps) {
  if (series.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {showLiveDot && <View style={styles.liveDot} />}
          {liveCount != null && (
            <Text style={styles.liveCount}>{liveCount}</Text>
          )}
        </View>
        <Text style={styles.seeAll}>{'عرض الكل >'}</Text>
      </View>

      <FlatList
        data={series}
        renderItem={({item}) => <SeriesCard series={item} />}
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
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSizes.sectionTitle,
    fontWeight: fontWeights.bold,
    writingDirection: 'rtl',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.cta,
  },
  liveCount: {
    color: colors.textMuted,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
    writingDirection: 'rtl',
  },
  seeAll: {
    color: colors.cta,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    writingDirection: 'rtl',
  },
  listContent: {
    paddingHorizontal: spacing.xs,
  },
});
