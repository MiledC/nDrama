import React, {useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {colors, fontSizes, fontWeights, spacing, radii} from '../theme';
import {useFavorites, useToggleFavorite} from '../hooks/useFavorites';
import {useAuthStore} from '../stores/authStore';
import type {FavoriteSeriesItem} from '../api/favorites';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MyListNavigation = NativeStackNavigationProp<RootStackParamList>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const GRID_GAP = spacing.md;
const GRID_HORIZONTAL_PADDING = spacing.lg;
const CARD_WIDTH =
  (SCREEN_WIDTH - GRID_HORIZONTAL_PADDING * 2 - GRID_GAP) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.5; // 2:3 ratio

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SeriesCard({
  item,
  onPress,
  onLongPress,
}: {
  item: FavoriteSeriesItem;
  onPress: () => void;
  onLongPress: () => void;
}) {
  return (
    <Pressable
      style={({pressed}) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      onLongPress={onLongPress}>
      <View style={styles.cardThumbnail}>
        <Text style={styles.cardThumbnailIcon}>{'\uD83C\uDFAC'}</Text>
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>
        {item.title}
      </Text>
      {item.tags.length > 0 && (
        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {item.tags.map(t => t.name).join(' \u00B7 ')}
        </Text>
      )}
    </Pressable>
  );
}

function EmptyState({onBrowse}: {onBrowse: () => void}) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>{'\uD83D\uDD16'}</Text>
      <Text style={styles.emptyTitle}>
        {'\u0642\u0627\u0626\u0645\u062A\u0643 \u0641\u0627\u0631\u063A\u0629'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {'\u0623\u0636\u0641 \u0645\u0633\u0644\u0633\u0644\u0627\u062A \u0644\u0645\u0634\u0627\u0647\u062F\u062A\u0647\u0627 \u0644\u0627\u062D\u0642\u0627\u064B'}
      </Text>
      <Pressable
        style={({pressed}) => [
          styles.browseButton,
          pressed && styles.browseButtonPressed,
        ]}
        onPress={onBrowse}>
        <Text style={styles.browseButtonText}>
          {'\u062A\u0635\u0641\u062D \u0627\u0644\u0645\u0633\u0644\u0633\u0644\u0627\u062A'}
        </Text>
      </Pressable>
    </View>
  );
}

function LoginPrompt({onLogin}: {onLogin: () => void}) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>{'\uD83D\uDD16'}</Text>
      <Text style={styles.emptyTitle}>
        {'\u0633\u062C\u0644 \u062F\u062E\u0648\u0644\u0643 \u0644\u062D\u0641\u0638 \u0642\u0627\u0626\u0645\u062A\u0643'}
      </Text>
      <Pressable
        style={({pressed}) => [
          styles.loginButton,
          pressed && styles.browseButtonPressed,
        ]}
        onPress={onLogin}>
        <Text style={styles.loginButtonText}>
          {'\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644'}
        </Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function MyListScreen() {
  const navigation = useNavigation<MyListNavigation>();
  const isAnonymous = useAuthStore(s => s.isAnonymous);
  const {data: favoritesData, isLoading} = useFavorites();
  const toggleFavorite = useToggleFavorite();

  const favorites = favoritesData?.items ?? [];

  const handleSeriesPress = useCallback(
    (seriesId: string) => {
      navigation.navigate('SeriesDetail', {seriesId});
    },
    [navigation],
  );

  const handleSeriesLongPress = useCallback(
    (item: FavoriteSeriesItem) => {
      Alert.alert(item.title, '', [
        {
          text: '\u0625\u0632\u0627\u0644\u0629 \u0645\u0646 \u0627\u0644\u0642\u0627\u0626\u0645\u0629',
          style: 'destructive',
          onPress: () => {
            toggleFavorite.mutate({seriesId: item.id, isFavorite: true});
          },
        },
        {
          text: '\u0625\u0644\u063A\u0627\u0621',
          style: 'cancel',
        },
      ]);
    },
    [toggleFavorite],
  );

  const handleBrowse = useCallback(() => {
    navigation.getParent()?.navigate('Home');
  }, [navigation]);

  const renderItem = useCallback(
    ({item}: {item: FavoriteSeriesItem}) => (
      <SeriesCard
        item={item}
        onPress={() => handleSeriesPress(item.id)}
        onLongPress={() => handleSeriesLongPress(item)}
      />
    ),
    [handleSeriesPress, handleSeriesLongPress],
  );

  const keyExtractor = useCallback(
    (item: FavoriteSeriesItem) => item.id,
    [],
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {'\u0642\u0627\u0626\u0645\u062A\u064A'}
        </Text>
      </View>

      {isAnonymous ? (
        <LoginPrompt onLogin={() => navigation.navigate('Login')} />
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.cta} />
        </View>
      ) : favorites.length === 0 ? (
        <EmptyState onBrowse={handleBrowse} />
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  /* ---- Header ---- */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: fontSizes.sectionTitle,
    fontWeight: fontWeights.bold,
    color: colors.text,
    writingDirection: 'rtl',
  },

  /* ---- Loading ---- */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ---- Grid ---- */
  gridContent: {
    paddingHorizontal: GRID_HORIZONTAL_PADDING,
    paddingBottom: spacing.section * 2,
  },
  gridRow: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },

  /* ---- Card ---- */
  card: {
    width: CARD_WIDTH,
  },
  cardPressed: {
    opacity: 0.7,
  },
  cardThumbnail: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radii.thumbnail,
    backgroundColor: colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardThumbnailIcon: {
    fontSize: 32,
    opacity: 0.3,
  },
  cardTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
    color: colors.text,
    writingDirection: 'rtl',
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },

  /* ---- Empty State ---- */
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    color: colors.textDim,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSizes.cardTitle,
    fontWeight: fontWeights.semibold,
    color: colors.textDim,
    writingDirection: 'rtl',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSizes.body,
    color: colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  browseButton: {
    borderWidth: 1,
    borderColor: colors.cta,
    height: 44,
    paddingHorizontal: spacing.xxl,
    borderRadius: radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  browseButtonPressed: {
    opacity: 0.7,
    backgroundColor: colors.ctaGlow,
  },
  browseButtonText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.cta,
    writingDirection: 'rtl',
  },

  /* ---- Login Prompt ---- */
  loginButton: {
    backgroundColor: colors.cta,
    height: 44,
    paddingHorizontal: spacing.xxl,
    borderRadius: radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  loginButtonText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    color: colors.text,
    writingDirection: 'rtl',
  },
});
