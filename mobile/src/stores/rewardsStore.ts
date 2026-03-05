import { create } from "zustand";

// Reward cycle: 3 -> 5 -> 5 -> 8 -> 8 -> 10 -> 20 coins
export const REWARD_CYCLE = [3, 5, 5, 8, 8, 10, 20];

export function getRewardForDay(streakDay: number): number {
  const idx = (streakDay - 1) % REWARD_CYCLE.length;
  return REWARD_CYCLE[idx];
}

export function getMultiplier(streakDay: number): number {
  if (streakDay >= 30) return 3;
  if (streakDay >= 7) return 2;
  return 1;
}

interface RewardsState {
  currentStreak: number;
  lastClaimedAt: string | null;
  hasClaimedToday: boolean;
  weekRewards: boolean[]; // 7-day calendar: which days claimed this week

  setStreak: (streak: number) => void;
  claimReward: () => number; // Returns coins earned
  setLastClaimedAt: (date: string) => void;
  setHasClaimedToday: (claimed: boolean) => void;
  setWeekRewards: (rewards: boolean[]) => void;
  reset: () => void;
}

export const useRewardsStore = create<RewardsState>((set, get) => ({
  currentStreak: 0,
  lastClaimedAt: null,
  hasClaimedToday: false,
  weekRewards: [false, false, false, false, false, false, false],

  setStreak: (streak) => set({ currentStreak: streak }),

  claimReward: () => {
    const { currentStreak } = get();
    const newStreak = currentStreak + 1;
    const baseReward = getRewardForDay(newStreak);
    const multiplier = getMultiplier(newStreak);
    const totalCoins = baseReward * multiplier;

    const today = new Date().toISOString().split("T")[0];
    set((state) => {
      const dayOfWeek = new Date().getDay();
      const newWeekRewards = [...state.weekRewards];
      newWeekRewards[dayOfWeek] = true;

      return {
        currentStreak: newStreak,
        lastClaimedAt: today,
        hasClaimedToday: true,
        weekRewards: newWeekRewards,
      };
    });

    return totalCoins;
  },

  setLastClaimedAt: (date) => set({ lastClaimedAt: date }),
  setHasClaimedToday: (claimed) => set({ hasClaimedToday: claimed }),
  setWeekRewards: (rewards) => set({ weekRewards: rewards }),

  reset: () => {
    set({
      currentStreak: 0,
      lastClaimedAt: null,
      hasClaimedToday: false,
      weekRewards: [false, false, false, false, false, false, false],
    });
  },
}));
