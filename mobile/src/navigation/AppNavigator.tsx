import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {colors} from '../theme';
import type {RootStackParamList} from './types';
import TabNavigator from './TabNavigator';
import {
  SeriesDetailScreen,
  VideoPlayerScreen,
  CoinStoreScreen,
  SubscriptionsScreen,
  DailyRewardsScreen,
  ReferralScreen,
  NotificationsScreen,
  SettingsScreen,
  WatchHistoryScreen,
  LoginScreen,
  OtpScreen,
  LockedEpisodeScreen,
  ShareRateScreen,
  CommentsScreen,
} from '../screens';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Root navigator with tabs + stack screens + modals.
 * Dark theme matching the Midnight Premium aesthetic.
 */
export default function AppNavigator() {
  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: colors.cta,
          background: colors.bg,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          notification: colors.cta,
        },
        fonts: {
          regular: {fontFamily: 'System', fontWeight: '400'},
          medium: {fontFamily: 'System', fontWeight: '500'},
          bold: {fontFamily: 'System', fontWeight: '700'},
          heavy: {fontFamily: 'System', fontWeight: '800'},
        },
      }}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor: colors.bg},
          animation: 'slide_from_right',
        }}>
        {/* Main tab bar */}
        <Stack.Screen name="MainTabs" component={TabNavigator} />

        {/* Stack screens */}
        <Stack.Screen name="SeriesDetail" component={SeriesDetailScreen} />
        <Stack.Screen
          name="VideoPlayer"
          component={VideoPlayerScreen}
          options={{animation: 'fade'}}
        />
        <Stack.Screen name="CoinStore" component={CoinStoreScreen} />
        <Stack.Screen name="Subscriptions" component={SubscriptionsScreen} />
        <Stack.Screen name="Referral" component={ReferralScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="WatchHistory" component={WatchHistoryScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Otp" component={OtpScreen} />

        {/* Modal screens */}
        <Stack.Screen
          name="DailyRewards"
          component={DailyRewardsScreen}
          options={{
            presentation: 'transparentModal',
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="LockedEpisode"
          component={LockedEpisodeScreen}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="ShareRate"
          component={ShareRateScreen}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="Comments"
          component={CommentsScreen}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
