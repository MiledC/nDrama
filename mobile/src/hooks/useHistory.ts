import {useMutation, useQuery} from '@tanstack/react-query';
import {getWatchHistory, reportProgress} from '../api/history';
import type {WatchHistoryItem, PaginatedResponse} from '../types/api';

/** Hook to fetch watch history for deriving stats. */
export function useWatchHistory() {
  return useQuery<PaginatedResponse<WatchHistoryItem>, Error>({
    queryKey: ['history'],
    queryFn: () => getWatchHistory(0, 100),
  });
}

/** Mutation hook to report playback progress for an episode. */
export function useReportProgress() {
  return useMutation({
    mutationFn: ({
      episodeId,
      progressSeconds,
    }: {
      episodeId: string;
      progressSeconds: number;
    }) => reportProgress(episodeId, progressSeconds),
  });
}
