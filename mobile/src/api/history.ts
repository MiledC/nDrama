import api from './client';

/** Report playback progress for an episode. */
export async function reportProgress(
  episodeId: string,
  progressSeconds: number,
): Promise<void> {
  await api.post(`/history/${episodeId}`, {progress_seconds: progressSeconds});
}
