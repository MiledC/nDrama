import React from 'react';
import PlaceholderScreen from './PlaceholderScreen';

// Tab screens
export {default as HomeScreen} from './HomeScreen';
export const DiscoverScreen = () => React.createElement(PlaceholderScreen, {name: 'Discover'});
export {default as SearchScreen} from './SearchScreen';
export const MyListScreen = () => React.createElement(PlaceholderScreen, {name: 'My List'});
export const ProfileScreen = () => React.createElement(PlaceholderScreen, {name: 'Profile'});

// Stack screens
export {default as SplashScreen} from './SplashScreen';
export const SeriesDetailScreen = () => React.createElement(PlaceholderScreen, {name: 'Series Detail'});
export const VideoPlayerScreen = () => React.createElement(PlaceholderScreen, {name: 'Video Player'});
export const LockedEpisodeScreen = () => React.createElement(PlaceholderScreen, {name: 'Locked Episode'});
export const CoinStoreScreen = () => React.createElement(PlaceholderScreen, {name: 'Coin Store'});
export const SubscriptionsScreen = () => React.createElement(PlaceholderScreen, {name: 'Subscriptions'});
export const DailyRewardsScreen = () => React.createElement(PlaceholderScreen, {name: 'Daily Rewards'});
export const ReferralScreen = () => React.createElement(PlaceholderScreen, {name: 'Referral'});
export const NotificationsScreen = () => React.createElement(PlaceholderScreen, {name: 'Notifications'});
export const SettingsScreen = () => React.createElement(PlaceholderScreen, {name: 'Settings'});
export const WatchHistoryScreen = () => React.createElement(PlaceholderScreen, {name: 'Watch History'});
export const LoginScreen = () => React.createElement(PlaceholderScreen, {name: 'Login'});
export const OtpScreen = () => React.createElement(PlaceholderScreen, {name: 'OTP Verification'});
export const ShareRateScreen = () => React.createElement(PlaceholderScreen, {name: 'Share & Rate'});
export const CommentsScreen = () => React.createElement(PlaceholderScreen, {name: 'Comments'});
