import React from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { Button } from "../ui/Button";
import { CoinDisplay } from "../ui/CoinDisplay";
import { useRewardsStore, getRewardForDay, getMultiplier } from "../../stores/rewardsStore";

interface DailyRewardModalProps {
  visible: boolean;
  onClose: () => void;
  onClaim: () => void;
}

export function DailyRewardModal({ visible, onClose, onClaim }: DailyRewardModalProps) {
  const { currentStreak, hasClaimedToday, weekRewards } = useRewardsStore();
  const nextDay = currentStreak + 1;
  const reward = getRewardForDay(nextDay);
  const multiplier = getMultiplier(nextDay);
  const totalReward = reward * multiplier;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>X</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Daily Reward</Text>

          {/* Streak counter */}
          <View style={styles.streakContainer}>
            <Text style={styles.streakNumber}>{currentStreak}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
          </View>

          {/* Week calendar */}
          <View style={styles.calendar}>
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
              <View
                key={i}
                style={[styles.calendarDay, weekRewards[i] && styles.calendarDayClaimed]}
              >
                <Text
                  style={[
                    styles.calendarDayText,
                    weekRewards[i] && styles.calendarDayTextClaimed,
                  ]}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Reward amount */}
          <View style={styles.rewardContainer}>
            <CoinDisplay amount={totalReward} size="lg" />
            {multiplier > 1 && (
              <Text style={styles.multiplier}>{multiplier}x multiplier!</Text>
            )}
          </View>

          {/* Claim button */}
          <Button
            title={hasClaimedToday ? "Come back tomorrow!" : "Claim Reward"}
            onPress={onClaim}
            variant="primary"
            size="lg"
            fullWidth
            disabled={hasClaimedToday}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modal: {
    width: "100%",
    backgroundColor: "#1F1133",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    end: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    color: "#A3A3A3",
    fontSize: 14,
    fontWeight: "700",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
  },
  streakContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  streakNumber: {
    color: "#8B5CF6",
    fontSize: 48,
    fontWeight: "700",
  },
  streakLabel: {
    color: "#A3A3A3",
    fontSize: 14,
  },
  calendar: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  calendarDay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2A1845",
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDayClaimed: {
    backgroundColor: "#8B5CF6",
  },
  calendarDayText: {
    color: "#666666",
    fontSize: 13,
    fontWeight: "600",
  },
  calendarDayTextClaimed: {
    color: "#FFFFFF",
  },
  rewardContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  multiplier: {
    color: "#D4A843",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
});
