import React from 'react';
import PlaceholderScreen from './PlaceholderScreen';

// Tab screens
export {default as HomeScreen} from './HomeScreen';
export {default as DiscoverScreen} from './DiscoverScreen';
export {default as SearchScreen} from './SearchScreen';
export const MyListScreen = () => React.createElement(PlaceholderScreen, {name: 'My List'});
export {default as ProfileScreen} from './ProfileScreen';

// Stack screens
export {default as SplashScreen} from './SplashScreen';
export {default as SeriesDetailScreen} from './SeriesDetailScreen';
export {default as VideoPlayerScreen} from './VideoPlayerScreen';
export {default as LockedEpisodeScreen} from './LockedEpisodeScreen';
export {default as CoinStoreScreen} from './CoinStoreScreen';
export {default as SubscriptionsScreen} from './SubscriptionsScreen';
export {default as DailyRewardsScreen} from './DailyRewardsScreen';
export {default as ReferralScreen} from './ReferralScreen';
export const NotificationsScreen = () => React.createElement(PlaceholderScreen, {name: 'Notifications'});
export const SettingsScreen = () => React.createElement(PlaceholderScreen, {name: 'Settings'});
export const WatchHistoryScreen = () => React.createElement(PlaceholderScreen, {name: 'Watch History'});
export {default as LoginScreen} from './LoginScreen';
export {default as OtpScreen} from './OtpScreen';
export const ShareRateScreen = () => React.createElement(PlaceholderScreen, {name: 'Share & Rate'});
export const CommentsScreen = () => React.createElement(PlaceholderScreen, {name: 'Comments'});
