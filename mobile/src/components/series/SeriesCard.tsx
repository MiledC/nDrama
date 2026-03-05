import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { Badge } from "../ui/Badge";
import { ProgressBar } from "../ui/ProgressBar";

const CARD_WIDTH = (Dimensions.get("window").width - 16 * 2 - 12) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.5; // Portrait aspect ratio

interface SeriesCardProps {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  episodeCount: number;
  badge?: "free" | "new" | "locked" | "continue";
  progress?: number; // 0-100 for continue watching
  onPress: (id: string) => void;
}

export function SeriesCard({
  id,
  title,
  thumbnailUrl,
  episodeCount,
  badge,
  progress,
  onPress,
}: SeriesCardProps) {
  return (
    <TouchableOpacity
      onPress={() => onPress(id)}
      activeOpacity={0.8}
      style={styles.container}
    >
      <View style={styles.imageContainer}>
        <Image
          source={thumbnailUrl ? { uri: thumbnailUrl } : undefined}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        {badge && (
          <View style={styles.badgeContainer}>
            <Badge type={badge} />
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.meta}>{episodeCount} ep</Text>
      {progress !== undefined && progress > 0 && (
        <ProgressBar progress={progress} style={styles.progress} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
  },
  imageContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#1F1133",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  badgeContainer: {
    position: "absolute",
    top: 8,
    start: 8,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  meta: {
    color: "#A3A3A3",
    fontSize: 12,
    marginTop: 2,
  },
  progress: {
    marginTop: 6,
  },
});
