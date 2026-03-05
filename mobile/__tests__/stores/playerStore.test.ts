import { usePlayerStore } from "@/stores/playerStore";

const makeEpisode = (overrides = {}) => ({
  id: "ep-1",
  series_id: "series-1",
  episode_number: 1,
  title: "Episode 1",
  playback_url: "https://stream.mux.com/test.m3u8",
  drm_license_url: null,
  duration_seconds: 120,
  is_free: true,
  is_locked: false,
  ...overrides,
});

const resetStore = () => usePlayerStore.setState(usePlayerStore.getInitialState());

beforeEach(() => resetStore());

describe("playerStore", () => {
  it("starts with no episode", () => {
    expect(usePlayerStore.getState().currentEpisode).toBeNull();
  });

  it("setEpisode sets current episode and resets position", () => {
    const ep = makeEpisode();
    usePlayerStore.getState().setEpisode(ep);
    const state = usePlayerStore.getState();
    expect(state.currentEpisode).toEqual(ep);
    expect(state.playbackPosition).toBe(0);
    expect(state.isPlaying).toBe(true);
  });

  it("setEpisodeList stores episodes for a series", () => {
    const episodes = [makeEpisode({ id: "ep-1" }), makeEpisode({ id: "ep-2", episode_number: 2 })];
    usePlayerStore.getState().setEpisodeList("series-1", episodes);
    expect(usePlayerStore.getState().episodeList).toHaveLength(2);
    expect(usePlayerStore.getState().currentSeriesId).toBe("series-1");
  });

  it("nextEpisode returns next in list", () => {
    const ep1 = makeEpisode({ id: "ep-1", episode_number: 1 });
    const ep2 = makeEpisode({ id: "ep-2", episode_number: 2 });
    usePlayerStore.getState().setEpisodeList("series-1", [ep1, ep2]);
    usePlayerStore.getState().setEpisode(ep1);
    expect(usePlayerStore.getState().nextEpisode()).toEqual(ep2);
  });

  it("nextEpisode returns null when at last episode", () => {
    const ep1 = makeEpisode({ id: "ep-1" });
    usePlayerStore.getState().setEpisodeList("series-1", [ep1]);
    usePlayerStore.getState().setEpisode(ep1);
    expect(usePlayerStore.getState().nextEpisode()).toBeNull();
  });

  it("previousEpisode returns previous in list", () => {
    const ep1 = makeEpisode({ id: "ep-1", episode_number: 1 });
    const ep2 = makeEpisode({ id: "ep-2", episode_number: 2 });
    usePlayerStore.getState().setEpisodeList("series-1", [ep1, ep2]);
    usePlayerStore.getState().setEpisode(ep2);
    expect(usePlayerStore.getState().previousEpisode()).toEqual(ep1);
  });

  it("previousEpisode returns null when at first episode", () => {
    const ep1 = makeEpisode({ id: "ep-1" });
    usePlayerStore.getState().setEpisodeList("series-1", [ep1]);
    usePlayerStore.getState().setEpisode(ep1);
    expect(usePlayerStore.getState().previousEpisode()).toBeNull();
  });

  it("setPlaybackPosition updates position", () => {
    usePlayerStore.getState().setPlaybackPosition(45.5);
    expect(usePlayerStore.getState().playbackPosition).toBe(45.5);
  });

  it("reset clears all player state", () => {
    usePlayerStore.getState().setEpisode(makeEpisode());
    usePlayerStore.getState().setPlaybackPosition(60);
    usePlayerStore.getState().reset();
    const state = usePlayerStore.getState();
    expect(state.currentEpisode).toBeNull();
    expect(state.playbackPosition).toBe(0);
    expect(state.isPlaying).toBe(false);
  });

  it("setAutoAdvanceCountdown updates countdown", () => {
    usePlayerStore.getState().setAutoAdvanceCountdown(3);
    expect(usePlayerStore.getState().autoAdvanceCountdown).toBe(3);
    usePlayerStore.getState().setAutoAdvanceCountdown(null);
    expect(usePlayerStore.getState().autoAdvanceCountdown).toBeNull();
  });
});
