import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {
  listFavorites,
  addFavorite,
  removeFavorite,
  FavoriteSeriesItem,
} from '../api/favorites';
import type {PaginatedResponse} from '../types/api';

/** Hook to fetch the subscriber's favorites list. */
export function useFavorites() {
  return useQuery<PaginatedResponse<FavoriteSeriesItem>, Error>({
    queryKey: ['favorites'],
    queryFn: () => listFavorites(),
  });
}

/** Check if a series is in favorites (derived from the cached list). */
export function useIsFavorite(seriesId: string): boolean {
  const queryClient = useQueryClient();
  const data = queryClient.getQueryData<PaginatedResponse<FavoriteSeriesItem>>([
    'favorites',
  ]);
  return data?.items.some(f => f.id === seriesId) ?? false;
}

/** Mutation to toggle a series in/out of favorites with optimistic update. */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    {seriesId: string; isFavorite: boolean},
    {previous: PaginatedResponse<FavoriteSeriesItem> | undefined}
  >({
    mutationFn: ({seriesId, isFavorite}) =>
      isFavorite ? removeFavorite(seriesId) : addFavorite(seriesId),
    onMutate: async ({seriesId, isFavorite}) => {
      await queryClient.cancelQueries({queryKey: ['favorites']});
      const previous =
        queryClient.getQueryData<PaginatedResponse<FavoriteSeriesItem>>([
          'favorites',
        ]);

      if (previous) {
        if (isFavorite) {
          // Remove from list
          const filtered = previous.items.filter(f => f.id !== seriesId);
          queryClient.setQueryData<PaginatedResponse<FavoriteSeriesItem>>(
            ['favorites'],
            {...previous, items: filtered, total: filtered.length},
          );
        } else {
          // Add placeholder to list (will be replaced on refetch)
          const placeholder: FavoriteSeriesItem = {
            id: seriesId,
            title: '',
            description: null,
            thumbnail_url: null,
            tags: [],
            favorited_at: new Date().toISOString(),
          };
          queryClient.setQueryData<PaginatedResponse<FavoriteSeriesItem>>(
            ['favorites'],
            {
              ...previous,
              items: [placeholder, ...previous.items],
              total: previous.total + 1,
            },
          );
        }
      }

      return {previous};
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['favorites'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: ['favorites']});
    },
  });
}
