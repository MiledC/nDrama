import api from './client';
import type {
  CategoryItem,
  SeriesListItem,
  PaginatedResponse,
} from '../types/api';

interface CategorySeriesParams {
  offset?: number;
  limit?: number;
}

/** Get the hierarchical category tree. */
export async function getCategoryTree(): Promise<CategoryItem[]> {
  const {data} = await api.get<CategoryItem[]>('/categories/tree');
  return data;
}

/** Get series belonging to a specific category. */
export async function getCategorySeries(
  categoryId: string,
  params?: CategorySeriesParams,
): Promise<PaginatedResponse<SeriesListItem>> {
  const {data} = await api.get<PaginatedResponse<SeriesListItem>>(
    `/categories/${categoryId}/series`,
    {params},
  );
  return data;
}