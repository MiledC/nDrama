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
export {default as SeriesDetailScreen} from './SeriesDetailScreen';
export {default as VideoPlayerScreen} from './VideoPlayerScreen';
export const LockedEpisodeScreen = () => React.createElement(PlaceholderScreen, {name: 'Locked Episode'});
export const CoinStoreScreen = () => React.createElement(PlaceholderScreen, {name: 'Coin Store'});
export const SubscriptionsScreen = () => React.createElement(PlaceholderScreen, {name: 'Subscriptions'});
export const DailyRewardsScreen = () => React.createElement(PlaceholderScreen, {name: 'Daily Rewards'});
export const ReferralScreen = () => React.createElement(PlaceholderScreen, {name: 'Referral'});
export const NotificationsScreen = () => React.createElement(PlaceholderScreen, {name: 'Notifications'});
export const SettingsScreen = () => React.createElement(PlaceholderScreen, {name: 'Settings'});
export const WatchHistoryScreen = () => React.createElement(PlaceholderScreen, {name: 'Watch History'});
export {default as LoginScreen} from './LoginScreen';
export {default as OtpScreen} from './OtpScreen';
export const ShareRateScreen = () => React.createElement(PlaceholderScreen, {name: 'Share & Rate'});
export const CommentsScreen = () => React.createElement(PlaceholderScreen, {name: 'Comments'});
