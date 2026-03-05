import apiClient from './client';
import type {
  PaginatedResponse,
  PaginationParams,
  UpdateProgressRequest,
  WatchHistory,
} from './types';

/** Get the subscriber's watch history (continue watching). */
export async function getWatchHistory(
  params?: PaginationParams,
): Promise<PaginatedResponse<WatchHistory>> {
  const { data } = await apiClient.get<PaginatedResponse<WatchHistory>>('/history', {
    params,
  });
  return data;
}

/** Report playback progress for an episode. */
export async function updateProgress(
  episodeId: string,
  body: UpdateProgressRequest,
): Promise<WatchHistory> {
  const { data } = await apiClient.post<WatchHistory>(`/history/${episodeId}`, body);
  return data;
}
