import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  I18nManager,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import * as SecureStore from "expo-secure-store";

import { useSearch, useCategories } from "@/api/queries";
import { SeriesCard } from "@/components/series/SeriesCard";
import type { SearchStackParamList } from "@/navigation/types";
import type { Series, Category } from "@/api/types";
import { colors, radii, spacing } from "@/theme/tokens";

type NavigationProp = NativeStackNavigationProp<SearchStackParamList, "Search">;

const SCREEN_WIDTH = Dimensions.get("window").width;
const RECENT_SEARCHES_KEY = "draama_recent_searches";
const MAX_RECENT_SEARCHES = 10;

export default function SearchScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Debounce search query
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  const searchParams = useMemo(
    () => ({
      q: debouncedQuery,
      category_id: selectedCategoryId,
    }),
    [debouncedQuery, selectedCategoryId],
  );

  const { data: searchResults, isLoading: isSearching } = useSearch(searchParams);
  const { data: categories } = useCategories();

  const loadRecentSearches = async () => {
    try {
      const stored = await SecureStore.getItemAsync(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Ignore storage errors
    }
  };

  const saveRecentSearch = async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(
      0,
      MAX_RECENT_SEARCHES,
    );
    setRecentSearches(updated);
    try {
      await SecureStore.setItemAsync(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  };

  const removeRecentSearch = async (term: string) => {
    const updated = recentSearches.filter((s) => s !== term);
    setRecentSearches(updated);
    try {
      await SecureStore.setItemAsync(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  };

  const handleSeriesPress = useCallback(
    (id: string) => {
      if (debouncedQuery) {
        saveRecentSearch(debouncedQuery);
      }
      navigation.navigate("SeriesDetail", { seriesId: id });
    },
    [navigation, debouncedQuery],
  );

  const handleRecentSearchPress = useCallback(
    (term: string) => {
      setQuery(term);
      setDebouncedQuery(term);
    },
    [],
  );

  const handleCategoryPress = useCallback(
    (categoryId: string) => {
      setSelectedCategoryId((prev) => (prev === categoryId ? undefined : categoryId));
    },
    [],
  );

  const handleSubmitEditing = useCallback(() => {
    if (query.trim()) {
      saveRecentSearch(query.trim());
    }
  }, [query]);

  const showResults = debouncedQuery.length > 0;

  const renderSeriesItem = useCallback(
    ({ item }: { item: Series }) => (
      <View style={styles.gridItem}>
        <SeriesCard
          id={item.id}
          title={item.title}
          thumbnailUrl={item.poster_url}
          episodeCount={item.episode_count}
          onPress={handleSeriesPress}
        />
      </View>
    ),
    [handleSeriesPress],
  );

  const renderCategoryPill = useCallback(
    (category: Category) => {
      const isSelected = selectedCategoryId === category.id;
      return (
        <TouchableOpacity
          key={category.id}
          onPress={() => handleCategoryPress(category.id)}
          activeOpacity={0.7}
          style={[
            styles.categoryPill,
            isSelected && styles.categoryPillSelected,
          ]}
        >
          <Text
            style={[
              styles.categoryPillText,
              isSelected && styles.categoryPillTextSelected,
            ]}
          >
            {I18nManager.isRTL && category.name_ar ? category.name_ar : category.name}
          </Text>
        </TouchableOpacity>
      );
    },
    [selectedCategoryId, handleCategoryPress],
  );

  const renderEmptyState = () => {
    if (isSearching) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    if (debouncedQuery.length > 0) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{t("common.noResults")}</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search Input */}
      <View style={styles.searchInputContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>Q</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t("search.searchPlaceholder")}
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmitEditing}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery("");
                setDebouncedQuery("");
              }}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>X</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showResults ? (
        /* Search Results */
        <FlatList
          data={searchResults?.items ?? []}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.resultsContainer}
          renderItem={renderSeriesItem}
          ListEmptyComponent={renderEmptyState}
          ListHeaderComponent={
            isSearching ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
        />
      ) : (
        /* Idle State: Recent Searches + Categories */
        <ScrollView
          contentContainerStyle={styles.idleContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("search.recentSearches")}</Text>
              {recentSearches.map((term) => (
                <View key={term} style={styles.recentRow}>
                  <TouchableOpacity
                    onPress={() => handleRecentSearchPress(term)}
                    style={styles.recentTextContainer}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.recentIcon}>C</Text>
                    <Text style={styles.recentText} numberOfLines={1}>
                      {term}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => removeRecentSearch(term)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.removeText}>X</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Categories */}
          {categories && categories.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("search.categories")}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                  styles.categoriesRow,
                  I18nManager.isRTL && styles.rowReverse,
                ]}
              >
                {categories.map(renderCategoryPill)}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchInputContainer: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: 12,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.input,
    paddingHorizontal: 14,
    height: 48,
  },
  searchIcon: {
    color: colors.textTertiary,
    fontSize: 16,
    fontWeight: "700",
    marginEnd: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    height: "100%",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  clearButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginStart: 4,
  },
  clearButtonText: {
    color: colors.textTertiary,
    fontSize: 14,
    fontWeight: "700",
  },
  idleContainer: {
    paddingBottom: 32,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: spacing.screenHorizontal,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  recentTextContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginEnd: 12,
  },
  recentIcon: {
    color: colors.textTertiary,
    fontSize: 14,
    fontWeight: "700",
    marginEnd: 12,
  },
  recentText: {
    color: colors.textSecondary,
    fontSize: 15,
    flex: 1,
  },
  removeText: {
    color: colors.textTertiary,
    fontSize: 14,
    fontWeight: "700",
  },
  categoriesRow: {
    paddingEnd: 4,
    gap: 10,
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
  categoryPill: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  categoryPillSelected: {
    backgroundColor: colors.accent,
  },
  categoryPillText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "500",
  },
  categoryPillTextSelected: {
    color: colors.white,
    fontWeight: "600",
  },
  resultsContainer: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: 32,
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  gridItem: {
    width: (SCREEN_WIDTH - spacing.screenHorizontal * 2 - 12) / 2,
  },
  centered: {
    flex: 1,
    paddingTop: 80,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  loadingRow: {
    paddingVertical: 16,
    alignItems: "center",
  },
});
