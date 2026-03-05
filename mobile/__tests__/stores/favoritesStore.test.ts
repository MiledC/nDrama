import { useFavoritesStore } from "@/stores/favoritesStore";

const makeFavorite = (overrides = {}) => ({
  id: "fav-1",
  series_id: "series-1",
  title: "Desert Shadows",
  thumbnail_url: "https://example.com/thumb.jpg",
  episode_count: 40,
  created_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

const resetStore = () => useFavoritesStore.setState(useFavoritesStore.getInitialState());

beforeEach(() => resetStore());

describe("favoritesStore", () => {
  it("starts with empty favorites", () => {
    expect(useFavoritesStore.getState().favorites).toHaveLength(0);
    expect(useFavoritesStore.getState().favoriteIds.size).toBe(0);
  });

  it("setFavorites populates list and ids", () => {
    const favs = [
      makeFavorite({ id: "f1", series_id: "s1" }),
      makeFavorite({ id: "f2", series_id: "s2" }),
    ];
    useFavoritesStore.getState().setFavorites(favs);
    expect(useFavoritesStore.getState().favorites).toHaveLength(2);
    expect(useFavoritesStore.getState().favoriteIds.has("s1")).toBe(true);
    expect(useFavoritesStore.getState().favoriteIds.has("s2")).toBe(true);
  });

  it("addFavorite adds to front of list", () => {
    const fav1 = makeFavorite({ id: "f1", series_id: "s1" });
    const fav2 = makeFavorite({ id: "f2", series_id: "s2" });
    useFavoritesStore.getState().addFavorite(fav1);
    useFavoritesStore.getState().addFavorite(fav2);
    expect(useFavoritesStore.getState().favorites[0].series_id).toBe("s2");
  });

  it("removeFavorite removes by series_id", () => {
    const fav = makeFavorite({ id: "f1", series_id: "s1" });
    useFavoritesStore.getState().addFavorite(fav);
    useFavoritesStore.getState().removeFavorite("s1");
    expect(useFavoritesStore.getState().favorites).toHaveLength(0);
    expect(useFavoritesStore.getState().favoriteIds.has("s1")).toBe(false);
  });

  it("isFavorite checks membership", () => {
    const fav = makeFavorite({ id: "f1", series_id: "s1" });
    useFavoritesStore.getState().addFavorite(fav);
    expect(useFavoritesStore.getState().isFavorite("s1")).toBe(true);
    expect(useFavoritesStore.getState().isFavorite("s999")).toBe(false);
  });

  it("toggleFavorite removes if already favorited", () => {
    const fav = makeFavorite({ id: "f1", series_id: "s1" });
    useFavoritesStore.getState().addFavorite(fav);
    const result = useFavoritesStore.getState().toggleFavorite("s1");
    expect(result).toBe(false);
    expect(useFavoritesStore.getState().favorites).toHaveLength(0);
  });

  it("toggleFavorite adds if not favorited and favorite provided", () => {
    const fav = makeFavorite({ id: "f1", series_id: "s1" });
    const result = useFavoritesStore.getState().toggleFavorite("s1", fav);
    expect(result).toBe(true);
    expect(useFavoritesStore.getState().favorites).toHaveLength(1);
  });

  it("toggleFavorite returns false when not favorited and no favorite provided", () => {
    const result = useFavoritesStore.getState().toggleFavorite("s1");
    expect(result).toBe(false);
  });
});
