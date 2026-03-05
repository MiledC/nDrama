import { create } from "zustand";

interface Episode {
  id: string;
  series_id: string;
  episode_number: number;
  title: string;
  playback_url: string | null;
  drm_license_url: string | null;
  duration_seconds: number;
  is_free: boolean;
  is_locked: boolean;
}

interface PlayerState {
  currentEpisode: Episode | null;
  currentSeriesId: string | null;
  episodeList: Episode[];
  playbackPosition: number;
  isPlaying: boolean;
  isBuffering: boolean;
  showControls: boolean;
  autoAdvanceCountdown: number | null;

  setEpisode: (episode: Episode) => void;
  setEpisodeList: (seriesId: string, episodes: Episode[]) => void;
  setPlaybackPosition: (position: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsBuffering: (buffering: boolean) => void;
  setShowControls: (show: boolean) => void;
  setAutoAdvanceCountdown: (countdown: number | null) => void;
  nextEpisode: () => Episode | null;
  previousEpisode: () => Episode | null;
  reset: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentEpisode: null,
  currentSeriesId: null,
  episodeList: [],
  playbackPosition: 0,
  isPlaying: false,
  isBuffering: false,
  showControls: true,
  autoAdvanceCountdown: null,

  setEpisode: (episode) => {
    set({
      currentEpisode: episode,
      playbackPosition: 0,
      isPlaying: true,
      autoAdvanceCountdown: null,
    });
  },

  setEpisodeList: (seriesId, episodes) => {
    set({ currentSeriesId: seriesId, episodeList: episodes });
  },

  setPlaybackPosition: (position) => {
    set({ playbackPosition: position });
  },

  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setIsBuffering: (buffering) => set({ isBuffering: buffering }),
  setShowControls: (show) => set({ showControls: show }),
  setAutoAdvanceCountdown: (countdown) => set({ autoAdvanceCountdown: countdown }),

  nextEpisode: () => {
    const { currentEpisode, episodeList } = get();
    if (!currentEpisode) return null;
    const idx = episodeList.findIndex((e) => e.id === currentEpisode.id);
    if (idx === -1 || idx >= episodeList.length - 1) return null;
    return episodeList[idx + 1];
  },

  previousEpisode: () => {
    const { currentEpisode, episodeList } = get();
    if (!currentEpisode) return null;
    const idx = episodeList.findIndex((e) => e.id === currentEpisode.id);
    if (idx <= 0) return null;
    return episodeList[idx - 1];
  },

  reset: () => {
    set({
      currentEpisode: null,
      currentSeriesId: null,
      episodeList: [],
      playbackPosition: 0,
      isPlaying: false,
      isBuffering: false,
      showControls: true,
      autoAdvanceCountdown: null,
    });
  },
}));
