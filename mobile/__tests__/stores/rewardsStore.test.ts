import {
  useRewardsStore,
  getRewardForDay,
  getMultiplier,
  REWARD_CYCLE,
} from "@/stores/rewardsStore";

const resetStore = () => useRewardsStore.setState(useRewardsStore.getInitialState());

beforeEach(() => resetStore());

describe("getRewardForDay", () => {
  it("returns correct rewards for first cycle", () => {
    expect(getRewardForDay(1)).toBe(3);
    expect(getRewardForDay(2)).toBe(5);
    expect(getRewardForDay(3)).toBe(5);
    expect(getRewardForDay(4)).toBe(8);
    expect(getRewardForDay(5)).toBe(8);
    expect(getRewardForDay(6)).toBe(10);
    expect(getRewardForDay(7)).toBe(20);
  });

  it("wraps around after 7 days", () => {
    expect(getRewardForDay(8)).toBe(3);
    expect(getRewardForDay(14)).toBe(20);
    expect(getRewardForDay(15)).toBe(3);
  });
});

describe("getMultiplier", () => {
  it("returns 1x for days 1-6", () => {
    for (let d = 1; d <= 6; d++) {
      expect(getMultiplier(d)).toBe(1);
    }
  });

  it("returns 2x for days 7-29", () => {
    expect(getMultiplier(7)).toBe(2);
    expect(getMultiplier(15)).toBe(2);
    expect(getMultiplier(29)).toBe(2);
  });

  it("returns 3x for day 30+", () => {
    expect(getMultiplier(30)).toBe(3);
    expect(getMultiplier(100)).toBe(3);
  });
});

describe("rewardsStore", () => {
  it("starts with zero streak and unclaimed", () => {
    const state = useRewardsStore.getState();
    expect(state.currentStreak).toBe(0);
    expect(state.hasClaimedToday).toBe(false);
    expect(state.lastClaimedAt).toBeNull();
  });

  it("claimReward increments streak and returns coins", () => {
    const coins = useRewardsStore.getState().claimReward();
    // Day 1: base=3, multiplier=1 → 3
    expect(coins).toBe(3);
    expect(useRewardsStore.getState().currentStreak).toBe(1);
    expect(useRewardsStore.getState().hasClaimedToday).toBe(true);
  });

  it("consecutive claims build streak correctly", () => {
    const store = useRewardsStore.getState();
    store.claimReward(); // day 1: 3
    const day2 = useRewardsStore.getState().claimReward(); // day 2: 5
    expect(day2).toBe(5);
    expect(useRewardsStore.getState().currentStreak).toBe(2);
  });

  it("applies 2x multiplier at day 7", () => {
    // Set streak to 6 so next claim is day 7
    useRewardsStore.setState({ currentStreak: 6 });
    const coins = useRewardsStore.getState().claimReward();
    // Day 7: base=20, multiplier=2 → 40
    expect(coins).toBe(40);
    expect(useRewardsStore.getState().currentStreak).toBe(7);
  });

  it("applies 3x multiplier at day 30", () => {
    useRewardsStore.setState({ currentStreak: 29 });
    const coins = useRewardsStore.getState().claimReward();
    // Day 30: base = REWARD_CYCLE[(30-1) % 7] = REWARD_CYCLE[1] = 5, multiplier=3 → 15
    expect(coins).toBe(15);
  });

  it("reset clears all state", () => {
    useRewardsStore.getState().claimReward();
    useRewardsStore.getState().reset();
    const state = useRewardsStore.getState();
    expect(state.currentStreak).toBe(0);
    expect(state.hasClaimedToday).toBe(false);
    expect(state.lastClaimedAt).toBeNull();
  });

  it("setWeekRewards updates the weekly calendar", () => {
    const rewards = [true, true, false, false, false, false, false];
    useRewardsStore.getState().setWeekRewards(rewards);
    expect(useRewardsStore.getState().weekRewards).toEqual(rewards);
  });
});
