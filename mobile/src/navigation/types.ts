/**
 * Navigation type definitions for the Draama app.
 * Maps to UXPilot screen docs (00-21).
 */

export type RootStackParamList = {
  MainTabs: undefined;
  SeriesDetail: {seriesId: string};
  VideoPlayer: {episodeId: string; seriesId: string};
  CoinStore: undefined;
  Subscriptions: undefined;
  Referral: undefined;
  Notifications: undefined;
  Settings: undefined;
  WatchHistory: undefined;
  Login: undefined;
  Otp: {phoneNumber: string};

  // Modals
  DailyRewards: undefined;
  LockedEpisode: {episodeId: string; coinCost: number};
  ShareRate: {seriesId: string; episodeId?: string};
  Comments: {episodeId: string};
};

export type TabParamList = {
  Home: undefined;
  Discover: undefined;
  Search: undefined;
  MyList: undefined;
  Profile: undefined;
};
