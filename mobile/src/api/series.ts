import api from './client';
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

/** List all series with pagination and search. */
export async function listSeries(
  params?: SeriesListParams,
): Promise<PaginatedResponse<SeriesListItem>> {
  const {data} = await api.get<PaginatedResponse<SeriesListItem>>(
    '/series',
    {params},
  );
  return data;
}

/** Get detailed information about a specific series. */
export async function getSeriesDetail(seriesId: string): Promise<SeriesDetail> {
  const {data} = await api.get<SeriesDetail>(`/series/${seriesId}`);
  return data;
}

/** Get episodes for a specific series. */
export async function getSeriesEpisodes(
  seriesId: string,
  params?: EpisodeListParams,
): Promise<PaginatedResponse<EpisodeListItem>> {
  const {data} = await api.get<PaginatedResponse<EpisodeListItem>>(
    `/series/${seriesId}/episodes`,
    {params},
  );
  return data;
}