import api from './client';
import type {EpisodeDetail} from '../types/api';

/** Get detailed information about a specific episode. */
export async function getEpisodeDetail(
  episodeId: string,
): Promise<EpisodeDetail> {
  const {data} = await api.get<EpisodeDetail>(`/episodes/${episodeId}`);
  return data;
}