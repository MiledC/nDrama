import api from './client';
import type {WatchHistoryItem, PaginatedResponse} from '../types/api';

/** Get continue watching / watch history list. */
export async function getWatchHistory(
  offset = 0,
  limit = 100,
): Promise<PaginatedResponse<WatchHistoryItem>> {
  const {data} = await api.get<PaginatedResponse<WatchHistoryItem>>(
    '/history',
    {params: {offset, limit}},
  );
  return data;
}

/** Report playback progress for an episode. */
export async function reportProgress(
  episodeId: string,
  progressSeconds: number,
): Promise<void> {
  await api.post(`/history/${episodeId}`, {progress_seconds: progressSeconds});
}
