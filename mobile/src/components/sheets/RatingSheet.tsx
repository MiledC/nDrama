import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
} from "react-native";
import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/Button";

interface RatingSheetProps {
  visible: boolean;
  onClose: () => void;
  series: { id: string; title: string; poster_url: string | null };
  averageRating?: number;
  totalRatings?: number;
  existingRating?: number;
  onSubmit: (rating: number, review?: string) => void;
}

const RATING_LABELS: Record<number, string> = {
  1: "rating.poor",
  2: "rating.okay",
  3: "rating.good",
  4: "rating.great",
  5: "rating.loveIt",
};

const REVIEW_MAX_LENGTH = 200;

export function RatingSheet({
  visible,
  onClose,
  series,
  averageRating,
  totalRatings,
  existingRating,
  onSubmit,
}: RatingSheetProps) {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [selectedRating, setSelectedRating] = useState(existingRating ?? 0);
  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    if (visible) {
      setSelectedRating(existingRating ?? 0);
      setReviewText("");
    }
  }, [visible, existingRating]);

  const snapPoints = useMemo(() => ["45%"], []);

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

  const handleSubmit = useCallback(() => {
    if (selectedRating > 0) {
      onSubmit(selectedRating, reviewText.trim() || undefined);
    }
  }, [selectedRating, reviewText, onSubmit]);

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
      <View style={styles.container}>
        {/* Series info */}
        <View style={styles.seriesRow}>
          {series.poster_url ? (
            <Image
              source={{ uri: series.poster_url }}
              style={styles.thumbnail}
            />
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
              <Text style={styles.thumbnailPlaceholderText}>
                {series.title.charAt(0)}
              </Text>
            </View>
          )}
          <View style={styles.seriesInfo}>
            <Text style={styles.seriesTitle} numberOfLines={1}>
              {series.title}
            </Text>
            {averageRating != null && (
              <View style={styles.avgRatingRow}>
                <Text style={styles.starFilled}>{"\u2605"}</Text>
                <Text style={styles.avgRatingText}>
                  {averageRating.toFixed(1)}
                </Text>
                {totalRatings != null && (
                  <Text style={styles.totalRatingsText}>
                    ({t("rating.ratingsCount", { count: totalRatings })})
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Stars */}
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setSelectedRating(star)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <Text
                style={[
                  styles.star,
                  star <= selectedRating
                    ? styles.starFilledInteractive
                    : styles.starOutline,
                ]}
              >
                {star <= selectedRating ? "\u2605" : "\u2606"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rating label */}
        {selectedRating > 0 && (
          <Text style={styles.ratingLabel}>
            {t(RATING_LABELS[selectedRating])}
          </Text>
        )}

        {/* Review input */}
        <TextInput
          style={styles.reviewInput}
          placeholder={t("rating.reviewPlaceholder")}
          placeholderTextColor="#666666"
          value={reviewText}
          onChangeText={setReviewText}
          maxLength={REVIEW_MAX_LENGTH}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>
          {reviewText.length}/{REVIEW_MAX_LENGTH}
        </Text>

        {/* Submit button */}
        <Button
          title={t("rating.submit")}
          onPress={handleSubmit}
          variant="primary"
          fullWidth
          disabled={selectedRating === 0}
        />
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
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  seriesRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  thumbnail: {
    width: 48,
    height: 68,
    borderRadius: 8,
  },
  thumbnailPlaceholder: {
    backgroundColor: "#3A2855",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailPlaceholderText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  seriesInfo: {
    flex: 1,
    marginStart: 12,
    justifyContent: "center",
  },
  seriesTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  avgRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  starFilled: {
    color: "#D4A843",
    fontSize: 14,
  },
  avgRatingText: {
    color: "#D4A843",
    fontSize: 14,
    fontWeight: "600",
    marginStart: 4,
  },
  totalRatingsText: {
    color: "#666666",
    fontSize: 12,
    marginStart: 4,
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 8,
  },
  star: {
    fontSize: 36,
  },
  starFilledInteractive: {
    color: "#D4A843",
  },
  starOutline: {
    color: "#666666",
  },
  ratingLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 16,
  },
  reviewInput: {
    backgroundColor: "#2A1845",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#FFFFFF",
    fontSize: 14,
    minHeight: 60,
    marginBottom: 4,
  },
  charCount: {
    color: "#666666",
    fontSize: 11,
    textAlign: "right",
    marginBottom: 12,
  },
});
