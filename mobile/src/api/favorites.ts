import api from './client';
import type {PaginatedResponse} from '../types/api';

export interface FavoriteSeriesItem {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  tags: {id: string; name: string}[];
  favorited_at: string;
}

/** List favorited series for the current subscriber. */
export async function listFavorites(
  offset = 0,
  limit = 50,
): Promise<PaginatedResponse<FavoriteSeriesItem>> {
  const {data} = await api.get<PaginatedResponse<FavoriteSeriesItem>>(
    '/favorites',
    {params: {offset, limit}},
  );
  return data;
}

/** Add a series to favorites (idempotent). */
export async function addFavorite(seriesId: string): Promise<void> {
  await api.post(`/favorites/${seriesId}`);
}

/** Remove a series from favorites (idempotent). */
export async function removeFavorite(seriesId: string): Promise<void> {
  await api.delete(`/favorites/${seriesId}`);
}
