import apiClient from './client';
import type { Favorite, PaginatedResponse, PaginationParams } from './types';

/** List the current subscriber's favorite series. */
export async function getFavorites(
  params?: PaginationParams,
): Promise<PaginatedResponse<Favorite>> {
  const { data } = await apiClient.get<PaginatedResponse<Favorite>>('/favorites', {
    params,
  });
  return data;
}

/** Add a series to favorites. */
export async function addFavorite(seriesId: string): Promise<Favorite> {
  const { data } = await apiClient.post<Favorite>('/favorites', {
    series_id: seriesId,
  });
  return data;
}

/** Remove a series from favorites. */
export async function removeFavorite(seriesId: string): Promise<void> {
  await apiClient.delete(`/favorites/${seriesId}`);
}
