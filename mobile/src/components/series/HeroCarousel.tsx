import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  ViewToken,
} from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/Button";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_WIDTH * 1.4; // Portrait hero
const AUTO_ROTATE_INTERVAL = 5000;

interface HeroItem {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  episodeCount: number;
}

interface HeroCarouselProps {
  items: HeroItem[];
  onPress: (id: string) => void;
}

export function HeroCarousel({ items, onPress }: HeroCarouselProps) {
  const { t } = useTranslation();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      const nextIndex = (activeIndex + 1) % items.length;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, AUTO_ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, [activeIndex, items.length]);

  const renderItem = ({ item }: { item: HeroItem }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress(item.id)}
      style={styles.heroItem}
    >
      <Image
        source={item.thumbnailUrl ? { uri: item.thumbnailUrl } : undefined}
        style={styles.heroImage}
        contentFit="cover"
      />
      <View style={styles.gradient}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.heroDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.heroMeta}>
            <Text style={styles.episodeCount}>
              {item.episodeCount} {t("series.episodes")}
            </Text>
          </View>
          <Button
            title={t("series.watchNow")}
            onPress={() => onPress(item.id)}
            variant="primary"
            size="md"
            style={styles.heroButton}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={items}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={renderItem}
      />
      {items.length > 1 && (
        <View style={styles.dots}>
          {items.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: HERO_HEIGHT,
  },
  heroItem: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    backgroundColor: "rgba(13, 13, 13, 0.4)",
  },
  heroContent: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: "rgba(13, 13, 13, 0.7)",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  heroDescription: {
    color: "#A3A3A3",
    fontSize: 14,
    marginBottom: 12,
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  episodeCount: {
    color: "#8B5CF6",
    fontSize: 13,
    fontWeight: "600",
  },
  heroButton: {
    alignSelf: "flex-start",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: "#8B5CF6",
    width: 24,
  },
});
