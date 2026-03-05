import { useCallback, useRef, useEffect } from "react";
import { usePlayerStore } from "../stores/playerStore";

const PROGRESS_REPORT_INTERVAL = 10000; // 10s

export function usePlayer() {
  const store = usePlayerStore();
  const lastReportedPosition = useRef(0);
  const reportTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const startProgressReporting = useCallback(
    (onReport: (episodeId: string, position: number) => void) => {
      if (reportTimer.current) clearInterval(reportTimer.current);

      reportTimer.current = setInterval(() => {
        const { currentEpisode, playbackPosition } = usePlayerStore.getState();
        if (
          currentEpisode &&
          Math.abs(playbackPosition - lastReportedPosition.current) > 2
        ) {
          onReport(currentEpisode.id, Math.floor(playbackPosition));
          lastReportedPosition.current = playbackPosition;
        }
      }, PROGRESS_REPORT_INTERVAL);
    },
    []
  );

  const stopProgressReporting = useCallback(() => {
    if (reportTimer.current) {
      clearInterval(reportTimer.current);
      reportTimer.current = null;
    }
  }, []);

  const playEpisode = useCallback(
    (episode: Parameters<typeof store.setEpisode>[0]) => {
      store.setEpisode(episode);
      lastReportedPosition.current = 0;
    },
    [store]
  );

  const advanceToNext = useCallback(() => {
    const next = store.nextEpisode();
    if (next) {
      store.setEpisode(next);
      lastReportedPosition.current = 0;
    }
    return next;
  }, [store]);

  const goToPrevious = useCallback(() => {
    const prev = store.previousEpisode();
    if (prev) {
      store.setEpisode(prev);
      lastReportedPosition.current = 0;
    }
    return prev;
  }, [store]);

  useEffect(() => {
    return () => stopProgressReporting();
  }, [stopProgressReporting]);

  return {
    ...store,
    playEpisode,
    advanceToNext,
    goToPrevious,
    startProgressReporting,
    stopProgressReporting,
  };
}
