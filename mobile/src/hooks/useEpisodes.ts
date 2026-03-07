import {useQuery} from '@tanstack/react-query';
import {getEpisodeDetail} from '../api';
import type {EpisodeDetail} from '../types/api';

/** Hook to fetch detailed information about a specific episode. */
export function useEpisodeDetail(episodeId: string) {
  return useQuery<EpisodeDetail, Error>({
    queryKey: ['episodes', 'detail', episodeId],
    queryFn: () => getEpisodeDetail(episodeId),
    enabled: !!episodeId,
  });
}