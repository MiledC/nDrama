import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { STALE_TIMES } from '@/utils/constants';

import * as authApi from './auth';
import * as coinsApi from './coins';
import * as contentApi from './content';
import * as favoritesApi from './favorites';
import * as historyApi from './history';
import type {
  DeviceAuthRequest,
  EpisodeListParams,
  LoginRequest,
  PurchaseCoinsRequest,
  RegisterRequest,
  SeriesListParams,
  SeriesSearchParams,
  SpendCoinsRequest,
  UpdateProfileRequest,
  UpdateProgressRequest,
} from './types';
import { getProfile, updateProfile, deleteProfile } from './profile';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const queryKeys = {
  // Content
  series: {
    all: ['series'] as const,
    list: (params?: SeriesListParams) => ['series', 'list', params] as const,
    detail: (id: string) => ['series', 'detail', id] as const,
    episodes: (seriesId: string, params?: EpisodeListParams) =>
      ['series', seriesId, 'episodes', params] as const,
    search: (params: SeriesSearchParams) => ['series', 'search', params] as const,
  },
  categories: ['categories'] as const,
  episodes: {
    detail: (id: string) => ['episodes', 'detail', id] as const,
  },

  // Coins
  coins: {
    balance: ['coins', 'balance'] as const,
    packages: ['coins', 'packages'] as const,
  },

  // Favorites
  favorites: {
    all: ['favorites'] as const,
    list: (page?: number) => ['favorites', 'list', page] as const,
  },

  // History
  history: {
    all: ['history'] as const,
    list: (page?: number) => ['history', 'list', page] as const,
  },

  // Profile
  profile: ['profile'] as const,
} as const;

// ---------------------------------------------------------------------------
// Content queries
// ---------------------------------------------------------------------------

export function useSeriesList(params?: SeriesListParams) {
  return useQuery({
    queryKey: queryKeys.series.list(params),
    queryFn: () => contentApi.getSeriesList(params),
    staleTime: STALE_TIMES.seriesList,
  });
}

export function useSeriesDetail(seriesId: string) {
  return useQuery({
    queryKey: queryKeys.series.detail(seriesId),
    queryFn: () => contentApi.getSeriesDetail(seriesId),
    staleTime: STALE_TIMES.seriesDetail,
    enabled: !!seriesId,
  });
}

export function useEpisodes(seriesId: string, params?: EpisodeListParams) {
  return useQuery({
    queryKey: queryKeys.series.episodes(seriesId, params),
    queryFn: () => contentApi.getEpisodes(seriesId, params),
    staleTime: STALE_TIMES.seriesDetail,
    enabled: !!seriesId,
  });
}

export function useInfiniteEpisodes(seriesId: string) {
  return useInfiniteQuery({
    queryKey: ['series', seriesId, 'episodes', 'infinite'] as const,
    queryFn: ({ pageParam }) =>
      contentApi.getEpisodes(seriesId, { page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined,
    enabled: !!seriesId,
    staleTime: STALE_TIMES.seriesDetail,
  });
}

export function useEpisodeDetail(episodeId: string) {
  return useQuery({
    queryKey: queryKeys.episodes.detail(episodeId),
    queryFn: () => contentApi.getEpisodeDetail(episodeId),
    enabled: !!episodeId,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => contentApi.getCategories(),
    staleTime: STALE_TIMES.categories,
  });
}

export function useSearch(params: SeriesSearchParams) {
  return useQuery({
    queryKey: queryKeys.series.search(params),
    queryFn: () => contentApi.searchSeries(params),
    enabled: params.q.length > 0,
    staleTime: STALE_TIMES.seriesList,
  });
}

// ---------------------------------------------------------------------------
// Coin queries
// ---------------------------------------------------------------------------

export function useCoinBalance() {
  return useQuery({
    queryKey: queryKeys.coins.balance,
    queryFn: () => coinsApi.getCoinBalance(),
    staleTime: STALE_TIMES.coinBalance,
  });
}

export function useCoinPackages() {
  return useQuery({
    queryKey: queryKeys.coins.packages,
    queryFn: () => coinsApi.getCoinPackages(),
    staleTime: STALE_TIMES.coinPackages,
  });
}

// ---------------------------------------------------------------------------
// Favorites queries
// ---------------------------------------------------------------------------

export function useFavorites(page?: number) {
  return useQuery({
    queryKey: queryKeys.favorites.list(page),
    queryFn: () => favoritesApi.getFavorites({ page }),
  });
}

// ---------------------------------------------------------------------------
// History queries
// ---------------------------------------------------------------------------

export function useWatchHistory(page?: number) {
  return useQuery({
    queryKey: queryKeys.history.list(page),
    queryFn: () => historyApi.getWatchHistory({ page }),
  });
}

// ---------------------------------------------------------------------------
// Profile queries
// ---------------------------------------------------------------------------

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => getProfile(),
    staleTime: STALE_TIMES.profile,
  });
}

// ---------------------------------------------------------------------------
// Auth mutations
// ---------------------------------------------------------------------------

export function useDeviceAuth() {
  return useMutation({
    mutationFn: (body: DeviceAuthRequest) => authApi.deviceAuth(body),
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: LoginRequest) => authApi.login(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RegisterRequest) => authApi.register(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

// ---------------------------------------------------------------------------
// Coin mutations
// ---------------------------------------------------------------------------

export function usePurchaseCoins() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: PurchaseCoinsRequest) => coinsApi.purchaseCoins(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coins.balance });
    },
  });
}

export function useSpendCoins() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SpendCoinsRequest) => coinsApi.spendCoins(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coins.balance });
      // Also invalidate series/episode data since unlock status changed.
      queryClient.invalidateQueries({ queryKey: queryKeys.series.all });
    },
  });
}

// ---------------------------------------------------------------------------
// Favorite mutations
// ---------------------------------------------------------------------------

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      seriesId,
      isFavorited,
    }: {
      seriesId: string;
      isFavorited: boolean;
    }): Promise<void> => {
      if (isFavorited) {
        await favoritesApi.removeFavorite(seriesId);
      } else {
        await favoritesApi.addFavorite(seriesId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.series.all });
    },
  });
}

// ---------------------------------------------------------------------------
// History mutations
// ---------------------------------------------------------------------------

export function useUpdateProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      episodeId,
      body,
    }: {
      episodeId: string;
      body: UpdateProgressRequest;
    }) => historyApi.updateProgress(episodeId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.history.all });
    },
  });
}

// ---------------------------------------------------------------------------
// Profile mutations
// ---------------------------------------------------------------------------

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProfileRequest) => updateProfile(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteProfile(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
