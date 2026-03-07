import React from 'react';
import {View, Text, FlatList, Pressable, StyleSheet} from 'react-native';
import {colors, fontSizes, fontWeights, spacing} from '../theme';

export interface TrendingItem {
  id: string;
  rank: number;
  title: string;
}

interface TrendingListProps {
  items: TrendingItem[];
  onItemPress?: (item: TrendingItem) => void;
}

/**
 * Numbered trending list (1-10).
 * Ranks 1-3 use green accent; 4-10 use muted gray.
 */
export default function TrendingList({items, onItemPress}: TrendingListProps) {
  const renderItem = ({item}: {item: TrendingItem}) => {
    const isTop3 = item.rank <= 3;

    return (
      <Pressable style={styles.row} onPress={() => onItemPress?.(item)}>
        <Text
          style={[
            styles.rank,
            {color: isTop3 ? colors.cta : colors.textMuted},
          ]}>
          {item.rank}
        </Text>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.arrow}>&#x2039;</Text>
      </Pressable>
    );
  };

  const renderSeparator = () => <View style={styles.separator} />;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        {'الأكثر رواجاً \uD83D\uDD25'}
      </Text>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={renderSeparator}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSizes.sectionTitle,
    fontWeight: fontWeights.bold,
    color: colors.text,
    writingDirection: 'rtl',
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  rank: {
    fontSize: fontSizes.sectionTitle,
    fontWeight: fontWeights.bold,
    width: 32,
    textAlign: 'center',
  },
  title: {
    flex: 1,
    fontSize: fontSizes.body,
    color: colors.text,
    marginHorizontal: spacing.md,
    writingDirection: 'rtl',
  },
  arrow: {
    fontSize: 20,
    color: colors.textDim,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
});
