import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";

interface Episode {
  id: string;
  episode_number: number;
  is_free: boolean;
  is_locked: boolean;
  coin_cost: number;
}

interface EpisodeGridProps {
  episodes: Episode[];
  currentEpisodeId?: string;
  onEpisodePress: (episode: Episode) => void;
}

function EpisodeCell({
  episode,
  isCurrent,
  onPress,
}: {
  episode: Episode;
  isCurrent: boolean;
  onPress: () => void;
}) {
  const isLocked = episode.is_locked && !episode.is_free;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.cell,
        isCurrent && styles.cellCurrent,
        isLocked && styles.cellLocked,
      ]}
    >
      <Text
        style={[
          styles.episodeNumber,
          isCurrent && styles.episodeNumberCurrent,
        ]}
      >
        {episode.episode_number}
      </Text>
      {isLocked && <Text style={styles.lockIcon}>L</Text>}
      {episode.is_free && !isCurrent && (
        <View style={styles.freeDot} />
      )}
    </TouchableOpacity>
  );
}

export function EpisodeGrid({
  episodes,
  currentEpisodeId,
  onEpisodePress,
}: EpisodeGridProps) {
  return (
    <FlatList
      data={episodes}
      keyExtractor={(item) => item.id}
      numColumns={6}
      scrollEnabled={false}
      contentContainerStyle={styles.grid}
      renderItem={({ item }) => (
        <EpisodeCell
          episode={item}
          isCurrent={item.id === currentEpisodeId}
          onPress={() => onEpisodePress(item)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  grid: {
    paddingHorizontal: 16,
  },
  cell: {
    flex: 1 / 6,
    aspectRatio: 1,
    margin: 3,
    borderRadius: 8,
    backgroundColor: "#1F1133",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cellCurrent: {
    backgroundColor: "#8B5CF6",
  },
  cellLocked: {
    opacity: 0.6,
  },
  episodeNumber: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  episodeNumberCurrent: {
    color: "#FFFFFF",
  },
  lockIcon: {
    position: "absolute",
    bottom: 2,
    end: 4,
    fontSize: 9,
    color: "#D4A843",
    fontWeight: "700",
  },
  freeDot: {
    position: "absolute",
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#00B856",
  },
});
