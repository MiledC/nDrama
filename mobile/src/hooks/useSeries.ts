import {useQuery} from '@tanstack/react-query';
import {listSeries, getSeriesDetail, getSeriesEpisodes} from '../api';
import type {
  SeriesListItem,
  SeriesDetail,
  EpisodeListItem,
  PaginatedResponse,
} from '../types/api';

interface SeriesListParams {
  offset?: number;
  limit?: number;
  search?: string;
}

interface EpisodeListParams {
  offset?: number;
  limit?: number;
}

/** Hook to fetch paginated series list with optional search. */
export function useSeriesList(params?: SeriesListParams) {
  return useQuery<PaginatedResponse<SeriesListItem>, Error>({
    queryKey: ['series', 'list', params],
    queryFn: () => listSeries(params),
  });
}

/** Hook to fetch detailed information about a specific series. */
export function useSeriesDetail(seriesId: string) {
  return useQuery<SeriesDetail, Error>({
    queryKey: ['series', 'detail', seriesId],
    queryFn: () => getSeriesDetail(seriesId),
    enabled: !!seriesId,
  });
}

/** Hook to fetch episodes for a specific series. */
export function useSeriesEpisodes(
  seriesId: string,
  params?: EpisodeListParams,
) {
  return useQuery<PaginatedResponse<EpisodeListItem>, Error>({
    queryKey: ['series', 'episodes', seriesId, params],
    queryFn: () => getSeriesEpisodes(seriesId, params),
    enabled: !!seriesId,
  });
}

/** Hook to search series by query string (minimum 2 characters). */
export function useSearchSeries(query: string) {
  return useQuery<PaginatedResponse<SeriesListItem>, Error>({
    queryKey: ['series', 'search', query],
    queryFn: () => listSeries({search: query}),
    enabled: query.length >= 2,
  });
}