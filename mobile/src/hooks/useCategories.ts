import {useQuery} from '@tanstack/react-query';
import {getCategoryTree, getCategorySeries} from '../api';
import type {
  CategoryItem,
  SeriesListItem,
  PaginatedResponse,
} from '../types/api';

interface CategorySeriesParams {
  offset?: number;
  limit?: number;
}

/** Hook to fetch the hierarchical category tree. */
export function useCategoryTree() {
  return useQuery<CategoryItem[], Error>({
    queryKey: ['categories', 'tree'],
    queryFn: getCategoryTree,
  });
}

/** Hook to fetch series belonging to a specific category. */
export function useCategorySeries(
  categoryId: string,
  params?: CategorySeriesParams,
) {
  return useQuery<PaginatedResponse<SeriesListItem>, Error>({
    queryKey: ['categories', 'series', categoryId, params],
    queryFn: () => getCategorySeries(categoryId, params),
    enabled: !!categoryId,
  });
}