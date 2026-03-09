import {useMutation} from '@tanstack/react-query';
import {reportProgress} from '../api/history';

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
