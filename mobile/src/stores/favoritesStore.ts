import { create } from "zustand";

export interface FavoriteSeries {
  id: string;
  series_id: string;
  title: string;
  thumbnail_url: string | null;
  episode_count: number;
  created_at: string;
}

interface FavoritesState {
  favorites: FavoriteSeries[];
  favoriteIds: Set<string>;
  isLoading: boolean;

  setFavorites: (favorites: FavoriteSeries[]) => void;
  addFavorite: (favorite: FavoriteSeries) => void;
  removeFavorite: (seriesId: string) => void;
  isFavorite: (seriesId: string) => boolean;
  toggleFavorite: (seriesId: string, favorite?: FavoriteSeries) => boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  favoriteIds: new Set<string>(),
  isLoading: false,

  setFavorites: (favorites) => {
    set({
      favorites,
      favoriteIds: new Set(favorites.map((f) => f.series_id)),
    });
  },

  addFavorite: (favorite) => {
    set((state) => {
      const newFavorites = [favorite, ...state.favorites];
      const newIds = new Set(state.favoriteIds);
      newIds.add(favorite.series_id);
      return { favorites: newFavorites, favoriteIds: newIds };
    });
  },

  removeFavorite: (seriesId) => {
    set((state) => {
      const newFavorites = state.favorites.filter((f) => f.series_id !== seriesId);
      const newIds = new Set(state.favoriteIds);
      newIds.delete(seriesId);
      return { favorites: newFavorites, favoriteIds: newIds };
    });
  },

  isFavorite: (seriesId) => {
    return get().favoriteIds.has(seriesId);
  },

  toggleFavorite: (seriesId, favorite) => {
    const { isFavorite, addFavorite, removeFavorite } = get();
    if (isFavorite(seriesId)) {
      removeFavorite(seriesId);
      return false;
    } else if (favorite) {
      addFavorite(favorite);
      return true;
    }
    return false;
  },

  setIsLoading: (loading) => set({ isLoading: loading }),
}));
