import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {StyleSheet} from 'react-native';
import Feather from '@react-native-vector-icons/feather';
import {colors, sizes, fontSizes} from '../theme';
import type {TabParamList} from './types';
import {
  HomeScreen,
  DiscoverScreen,
  SearchScreen,
  MyListScreen,
  ProfileScreen,
} from '../screens';

const Tab = createBottomTabNavigator<TabParamList>();

const ICON_SIZE = 22;

/**
 * 5-tab bottom navigator matching the global style guide.
 * Tabs: الرئيسية (Home), اكتشف (Discover), البحث (Search), قائمتي (My List), الملف الشخصي (Profile)
 */
export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: styles.tabLabel,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'الرئيسية',
          tabBarIcon: ({color}) => (
            <Feather name="home" size={ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarLabel: 'اكتشف',
          tabBarIcon: ({color}) => (
            <Feather name="compass" size={ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: 'البحث',
          tabBarIcon: ({color}) => (
            <Feather name="search" size={ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MyList"
        component={MyListScreen}
        options={{
          tabBarLabel: 'قائمتي',
          tabBarIcon: ({color}) => (
            <Feather name="bookmark" size={ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'الملف الشخصي',
          tabBarIcon: ({color}) => (
            <Feather name="user" size={ICON_SIZE} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.tabBar,
    borderTopColor: colors.tabBarBorder,
    borderTopWidth: 1,
    height: sizes.tabBarHeight,
    paddingBottom: 4,
  },
  tabLabel: {
    fontSize: fontSizes.tabLabel,
    fontWeight: '600',
  },
});
