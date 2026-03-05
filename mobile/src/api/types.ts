/**
 * TypeScript types for the Draama subscriber API.
 */

// ---------------------------------------------------------------------------
// Generic pagination
// ---------------------------------------------------------------------------

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface DeviceAuthRequest {
  device_id: string;
}

export interface AuthResponse {
  session_token: string;
  subscriber_id: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface RegisterResponse {
  session_token: string;
  subscriber: SubscriberProfile;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  session_token: string;
  subscriber: SubscriberProfile;
}

// ---------------------------------------------------------------------------
// Subscriber / Profile
// ---------------------------------------------------------------------------

export type SubscriberStatus = 'anonymous' | 'active' | 'suspended' | 'banned';

export interface SubscriberProfile {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  status: SubscriberStatus;
  coin_balance: number;
  language: string | null;
  created_at: string;
}

export interface UpdateProfileRequest {
  name?: string;
  avatar_url?: string;
}

// ---------------------------------------------------------------------------
// Content — Categories
// ---------------------------------------------------------------------------

export interface Category {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string;
  parent_id: string | null;
  children?: Category[];
}

// ---------------------------------------------------------------------------
// Content — Series
// ---------------------------------------------------------------------------

export interface Series {
  id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  poster_url: string | null;
  banner_url: string | null;
  category_id: string | null;
  tags: Tag[];
  episode_count: number;
  status: string;
  release_date: string | null;
  is_favorited: boolean;
  created_at: string;
}

export interface SeriesDetail extends Series {
  episodes: Episode[];
}

export interface Tag {
  id: string;
  name: string;
  name_ar: string | null;
}

export interface SeriesListParams extends PaginationParams {
  category_id?: string;
}

export interface SeriesSearchParams extends PaginationParams {
  q: string;
  category_id?: string;
}

// ---------------------------------------------------------------------------
// Content — Episodes
// ---------------------------------------------------------------------------

export interface Episode {
  id: string;
  series_id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  episode_number: number;
  season_number: number;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  is_free: boolean;
  coin_price: number;
  is_unlocked: boolean;
  created_at: string;
}

export interface EpisodeDetail extends Episode {
  stream_url: string | null;
  subtitle_urls: SubtitleTrack[];
  audio_tracks: AudioTrack[];
  progress_seconds: number;
}

export interface SubtitleTrack {
  language: string;
  label: string;
  url: string;
}

export interface AudioTrack {
  language: string;
  label: string;
  url: string;
}

export interface EpisodeListParams extends PaginationParams {
  // No extra params beyond pagination
}

// ---------------------------------------------------------------------------
// Coins
// ---------------------------------------------------------------------------

export interface CoinBalance {
  balance: number;
}

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  price_usd: number;
  price_sar: number;
  bonus_coins: number;
  is_popular: boolean;
}

export interface PurchaseCoinsRequest {
  package_id: string;
  receipt: string;
  platform: 'ios' | 'android';
}

export interface PurchaseCoinsResponse {
  balance: number;
  transaction: CoinTransaction;
}

export interface SpendCoinsRequest {
  episode_id: string;
}

export interface SpendCoinsResponse {
  balance: number;
  unlock: EpisodeUnlock;
}

export interface CoinTransaction {
  id: string;
  type: 'purchase' | 'spend' | 'refund' | 'bonus';
  amount: number;
  description: string | null;
  created_at: string;
}

export interface EpisodeUnlock {
  id: string;
  episode_id: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Favorites
// ---------------------------------------------------------------------------

export interface Favorite {
  id: string;
  series_id: string;
  series: Series;
  created_at: string;
}

export interface AddFavoriteRequest {
  series_id: string;
}

// ---------------------------------------------------------------------------
// Watch History
// ---------------------------------------------------------------------------

export interface WatchHistory {
  id: string;
  episode_id: string;
  episode: Episode & { series_title: string; series_poster_url: string | null };
  progress_seconds: number;
  duration_seconds: number | null;
  completed: boolean;
  last_watched_at: string;
}

export interface UpdateProgressRequest {
  progress_seconds: number;
  duration_seconds: number;
}
