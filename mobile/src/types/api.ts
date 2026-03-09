// Series
export interface SeriesListItem {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  tags: TagItem[];
  free_episode_count: number;
  coin_cost_per_episode: number;
  created_at: string;
}

export interface TagItem {
  id: string;
  name: string;
}

export interface EpisodeListItem {
  id: string;
  title: string;
  episode_number: number;
  thumbnail_url: string | null;
  is_free: boolean;
  is_unlocked: boolean;
  duration_seconds: number | null;
}

export interface SeriesDetail {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  tags: TagItem[];
  free_episode_count: number;
  coin_cost_per_episode: number;
  created_at: string;
  episodes: EpisodeListItem[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}

// Home Sections
export interface HomeSectionItem {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  free_episode_count: number;
  coin_cost_per_episode: number;
  episode_count: number;
}

export interface HomeSection {
  id: string;
  type: 'featured' | 'trending' | 'new_releases' | 'category';
  title: string;
  items: HomeSectionItem[];
}

// Categories
export interface CategoryItem {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  sort_order: number;
  children: CategoryItem[];
}

// Episodes (detail)
export interface EpisodeDetail {
  id: string;
  title: string;
  description: string | null;
  episode_number: number;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  is_free: boolean;
  is_unlocked: boolean;
  locked: boolean;
  playback_url: string | null;
  audio_tracks: AudioTrackItem[];
  subtitles: SubtitleItem[];
  series_id: string;
  coin_cost: number;
}

export interface AudioTrackItem {
  id: string;
  language_code: string;
  label: string;
  file_url: string;
  is_default: boolean;
}

export interface SubtitleItem {
  id: string;
  language_code: string;
  label: string;
  file_url: string;
  format: string;
  is_default: boolean;
}

// Watch History
export interface WatchHistoryItem {
  episode_id: string;
  episode_title: string;
  series_id: string;
  series_title: string;
  thumbnail_url: string | null;
  progress_seconds: number;
  duration_seconds: number | null;
  completed: boolean;
  last_watched_at: string;
}

// Coins
export interface BalanceResponse {
  balance: number;
}

export interface CoinPackageResponse {
  id: string;
  name: string;
  description: string | null;
  coin_amount: number;
  price_sar: string;
  sort_order: number;
}

export interface TransactionResponse {
  id: string;
  type: 'purchase' | 'spend' | 'refund' | 'promo' | 'adjustment';
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

export interface UnlockResponse {
  episode_id: string;
  new_balance: number;
  transaction_id: string;
}