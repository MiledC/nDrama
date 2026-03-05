import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../stores/authStore";

interface Comment {
  id: string;
  authorName: string;
  authorInitials: string;
  authorColor: string;
  text: string;
  timeAgo: string;
  likes: number;
  isLiked: boolean;
  isSpoiler: boolean;
}

interface CommentsSheetProps {
  visible: boolean;
  onClose: () => void;
  episodeId: string;
  episodeTitle: string;
  episodeNumber: number;
}

const MOCK_COMMENTS: Comment[] = [
  {
    id: "1",
    authorName: "Sara Ahmed",
    authorInitials: "SA",
    authorColor: "#8B5CF6",
    text: "This episode was absolutely incredible! The plot twist at the end had me speechless. Can't wait for the next one.",
    timeAgo: "2h",
    likes: 24,
    isLiked: false,
    isSpoiler: false,
  },
  {
    id: "2",
    authorName: "Mohammed K",
    authorInitials: "MK",
    authorColor: "#00B856",
    text: "The acting in this series keeps getting better with every episode. Truly world-class production.",
    timeAgo: "4h",
    likes: 18,
    isLiked: true,
    isSpoiler: false,
  },
  {
    id: "3",
    authorName: "Layla Noor",
    authorInitials: "LN",
    authorColor: "#D4A843",
    text: "I knew the villain was the brother all along! The way they revealed it in the final scene was perfect though.",
    timeAgo: "5h",
    likes: 31,
    isLiked: false,
    isSpoiler: true,
  },
  {
    id: "4",
    authorName: "Omar Faisal",
    authorInitials: "OF",
    authorColor: "#EF4444",
    text: "Great soundtrack in this episode. Anyone know the name of the song that plays during the chase scene?",
    timeAgo: "8h",
    likes: 7,
    isLiked: false,
    isSpoiler: false,
  },
  {
    id: "5",
    authorName: "Nadia Saleh",
    authorInitials: "NS",
    authorColor: "#3B82F6",
    text: "This is my favorite series on the platform. Every episode leaves me wanting more!",
    timeAgo: "12h",
    likes: 42,
    isLiked: true,
    isSpoiler: false,
  },
  {
    id: "6",
    authorName: "Khalid Rashed",
    authorInitials: "KR",
    authorColor: "#EC4899",
    text: "The cinematography in the desert scenes is breathtaking. Beautiful work by the entire crew.",
    timeAgo: "1d",
    likes: 15,
    isLiked: false,
    isSpoiler: false,
  },
];

type SortMode = "newest" | "mostLiked";

export function CommentsSheet({
  visible,
  onClose,
  episodeTitle,
  episodeNumber,
}: CommentsSheetProps) {
  const { t } = useTranslation();
  const isRegistered = useAuthStore((s) => s.isRegistered);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(
    new Set()
  );
  const [commentText, setCommentText] = useState("");

  const snapPoints = useMemo(() => ["75%", "95%"], []);

  const sortedComments = useMemo(() => {
    const sorted = [...MOCK_COMMENTS];
    if (sortMode === "mostLiked") {
      sorted.sort((a, b) => b.likes - a.likes);
    }
    return sorted;
  }, [sortMode]);

  const handleRevealSpoiler = useCallback((commentId: string) => {
    setRevealedSpoilers((prev) => {
      const next = new Set(prev);
      next.add(commentId);
      return next;
    });
  }, []);

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
      />
    ),
    []
  );

  const renderComment = useCallback(
    ({ item }: { item: Comment }) => {
      const isSpoilerHidden =
        item.isSpoiler && !revealedSpoilers.has(item.id);

      return (
        <View style={styles.commentRow}>
          <View
            style={[styles.avatar, { backgroundColor: item.authorColor }]}
          >
            <Text style={styles.avatarText}>{item.authorInitials}</Text>
          </View>
          <View style={styles.commentContent}>
            <View style={styles.commentHeader}>
              <Text style={styles.authorName}>{item.authorName}</Text>
              <Text style={styles.timeAgo}>{item.timeAgo}</Text>
            </View>
            {isSpoilerHidden ? (
              <TouchableOpacity
                style={styles.spoilerOverlay}
                onPress={() => handleRevealSpoiler(item.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.spoilerLabel}>
                  {t("comments.spoilerTapToReveal")}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.commentText} numberOfLines={3}>
                {item.text}
              </Text>
            )}
            <TouchableOpacity style={styles.likeRow} activeOpacity={0.7}>
              <Text
                style={[
                  styles.heartIcon,
                  item.isLiked && styles.heartIconLiked,
                ]}
              >
                {item.isLiked ? "\u2764\uFE0F" : "\u2661"}
              </Text>
              <Text style={styles.likeCount}>{item.likes}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [revealedSpoilers, handleRevealSpoiler, t]
  );

  if (!visible) {
    return null;
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onChange={handleSheetChange}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.indicator}
    >
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>{t("comments.title")}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {MOCK_COMMENTS.length}
            </Text>
          </View>
        </View>
        <View style={styles.sortRow}>
          <TouchableOpacity
            onPress={() => setSortMode("newest")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.sortOption,
                sortMode === "newest" && styles.sortOptionActive,
              ]}
            >
              {t("comments.newest")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSortMode("mostLiked")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.sortOption,
                sortMode === "mostLiked" && styles.sortOptionActive,
              ]}
            >
              {t("comments.mostLiked")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.episodeBar}>
        <Text style={styles.episodeBarText} numberOfLines={1}>
          {t("comments.episodeContext", {
            number: episodeNumber,
            title: episodeTitle,
          })}
        </Text>
      </View>

      <BottomSheetFlatList
        data={sortedComments}
        keyExtractor={(item: Comment) => item.id}
        renderItem={renderComment}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <View style={styles.inputBar}>
        {isRegistered ? (
          <View style={styles.inputRow}>
            <View style={[styles.inputAvatar, { backgroundColor: "#8B5CF6" }]}>
              <Text style={styles.avatarText}>Y</Text>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder={t("comments.inputPlaceholder")}
              placeholderTextColor="#666666"
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !commentText.trim() && styles.sendButtonDisabled,
              ]}
              disabled={!commentText.trim()}
              activeOpacity={0.7}
            >
              <Text style={styles.sendIcon}>{"\u25B6"}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.signInPrompt} activeOpacity={0.7}>
            <Text style={styles.signInText}>
              {t("comments.signInToComment")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: "#1F1133",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  indicator: {
    backgroundColor: "#666666",
    width: 36,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  countBadge: {
    backgroundColor: "#2A1845",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginStart: 8,
  },
  countBadgeText: {
    color: "#A3A3A3",
    fontSize: 13,
    fontWeight: "600",
  },
  sortRow: {
    flexDirection: "row",
    gap: 16,
  },
  sortOption: {
    color: "#666666",
    fontSize: 14,
    fontWeight: "500",
  },
  sortOptionActive: {
    color: "#00B856",
  },
  episodeBar: {
    backgroundColor: "#2A1845",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  episodeBarText: {
    color: "#A3A3A3",
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  separator: {
    height: 1,
    backgroundColor: "#2A2A2A",
    marginVertical: 12,
  },
  commentRow: {
    flexDirection: "row",
    paddingVertical: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginEnd: 10,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  authorName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  timeAgo: {
    color: "#666666",
    fontSize: 12,
    marginStart: 8,
  },
  commentText: {
    color: "#A3A3A3",
    fontSize: 14,
    lineHeight: 20,
  },
  spoilerOverlay: {
    backgroundColor: "rgba(42, 24, 69, 0.9)",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  spoilerLabel: {
    color: "#D4A843",
    fontSize: 13,
    fontWeight: "600",
  },
  likeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  heartIcon: {
    color: "#666666",
    fontSize: 16,
  },
  heartIconLiked: {
    color: "#EF4444",
  },
  likeCount: {
    color: "#666666",
    fontSize: 12,
    marginStart: 4,
  },
  inputBar: {
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1F1133",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginEnd: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: "#2A1845",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: "#FFFFFF",
    fontSize: 14,
    maxHeight: 80,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#00B856",
    alignItems: "center",
    justifyContent: "center",
    marginStart: 8,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendIcon: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  signInPrompt: {
    backgroundColor: "#2A1845",
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: "center",
  },
  signInText: {
    color: "#00B856",
    fontSize: 14,
    fontWeight: "600",
  },
});
