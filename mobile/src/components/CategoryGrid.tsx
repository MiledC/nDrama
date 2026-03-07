import React from 'react';
import {View, Text, FlatList, Pressable, StyleSheet} from 'react-native';
import {colors, fontSizes, fontWeights, spacing, radii} from '../theme';

export interface Category {
  id: string;
  name: string;
  bgColor: string;
}

interface CategoryGridProps {
  categories: Category[];
  onCategoryPress?: (category: Category) => void;
}

const CARD_HEIGHT = 80;
const COLUMN_GAP = spacing.md;

/**
 * 2-column browse-by-category grid.
 * Each card uses a solid dark color background (no linear-gradient dependency).
 */
export default function CategoryGrid({
  categories,
  onCategoryPress,
}: CategoryGridProps) {
  const renderItem = ({item}: {item: Category}) => (
    <Pressable
      style={[styles.card, {backgroundColor: item.bgColor}]}
      onPress={() => onCategoryPress?.(item)}>
      <Text style={styles.cardText}>{item.name}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>تصفح حسب الفئة</Text>
      <FlatList
        data={categories}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        scrollEnabled={false}
        contentContainerStyle={styles.grid}
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
  grid: {
    gap: COLUMN_GAP,
  },
  row: {
    gap: COLUMN_GAP,
  },
  card: {
    flex: 1,
    height: CARD_HEIGHT,
    borderRadius: radii.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    fontSize: fontSizes.cardTitle,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    writingDirection: 'rtl',
  },
});
