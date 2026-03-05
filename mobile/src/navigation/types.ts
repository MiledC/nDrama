import type { NavigatorScreenParams } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";

// Root stack
export type RootStackParamList = {
  Splash: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<TabParamList>;
  Player: { episodeId: string; seriesId: string };
};

// Auth stack
export type AuthStackParamList = {
  Login: undefined;
  OTP: { phone: string };
  Register: undefined;
};

// Tab navigator
export type TabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  DiscoverTab: NavigatorScreenParams<DiscoverStackParamList>;
  SearchTab: NavigatorScreenParams<SearchStackParamList>;
  MyListTab: NavigatorScreenParams<MyListStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

// Home stack
export type HomeStackParamList = {
  Home: undefined;
  SeriesDetail: { seriesId: string };
  CategoryList: { categoryId: string; categoryName: string };
};

// Discover stack
export type DiscoverStackParamList = {
  Discover: undefined;
  SeriesDetail: { seriesId: string };
};

// Search stack
export type SearchStackParamList = {
  Search: undefined;
  SeriesDetail: { seriesId: string };
};

// My List stack
export type MyListStackParamList = {
  MyList: undefined;
  SeriesDetail: { seriesId: string };
};

// Profile stack
export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  WatchHistory: undefined;
  Notifications: undefined;
  CoinStore: undefined;
  Subscriptions: undefined;
  Referral: undefined;
};

// Screen props helpers
export type RootScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type HomeScreenProps<T extends keyof HomeStackParamList> =
  NativeStackScreenProps<HomeStackParamList, T>;

export type ProfileScreenProps<T extends keyof ProfileStackParamList> =
  NativeStackScreenProps<ProfileStackParamList, T>;

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> =
  BottomTabScreenProps<TabParamList, T>;

// Declare global navigation types for useNavigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
