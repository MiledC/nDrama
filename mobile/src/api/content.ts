import apiClient from './client';
import type {
  Category,
  Episode,
  EpisodeDetail,
  EpisodeListParams,
  PaginatedResponse,
  Series,
  SeriesDetail,
  SeriesListParams,
} from './types';

/** List series with optional search and pagination. */
export async function getSeriesList(
  params?: SeriesListParams,
): Promise<PaginatedResponse<Series>> {
  const { data } = await apiClient.get<PaginatedResponse<Series>>('/series', { params });
  return data;
}

/** Get full series detail (includes episode list). */
export async function getSeriesDetail(seriesId: string): Promise<SeriesDetail> {
  const { data } = await apiClient.get<SeriesDetail>(`/series/${seriesId}`);
  return data;
}

/** List episodes for a series with pagination. */
export async function getEpisodes(
  seriesId: string,
  params?: EpisodeListParams,
): Promise<PaginatedResponse<Episode>> {
  const { data } = await apiClient.get<PaginatedResponse<Episode>>(
    `/series/${seriesId}/episodes`,
    { params },
  );
  return data;
}

/** Get episode detail with playback URLs (if unlocked). */
export async function getEpisodeDetail(episodeId: string): Promise<EpisodeDetail> {
  const { data } = await apiClient.get<EpisodeDetail>(`/episodes/${episodeId}`);
  return data;
}

/** Get category tree. */
export async function getCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>('/categories/tree');
  return data;
}

/** Search series by query string. */
export async function searchSeries(
  params: { q: string } & SeriesListParams,
): Promise<PaginatedResponse<Series>> {
  const { data } = await apiClient.get<PaginatedResponse<Series>>('/series', {
    params: { search: params.q, offset: params.offset, limit: params.limit },
  });
  return data;
}
