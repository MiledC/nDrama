import React, {useState} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {colors, fontSizes, fontWeights, spacing} from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const BANNER_HEIGHT = 44;

export default function DailyRewardBanner() {
  const navigation = useNavigation<Nav>();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  const handlePress = () => {
    navigation.navigate('DailyRewards');
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <View style={styles.container}>
      {/* Subtle purple gradient accent on the left (simulated with a positioned View) */}
      <View style={styles.purpleAccent} />

      <Pressable style={styles.content} onPress={handlePress}>
        <View style={styles.leftContent}>
          <Text style={styles.flameIcon}>{'🔥'}</Text>
          <Text style={styles.bannerText}>اجمع مكافأتك اليومية</Text>
          <Text style={styles.coinIcon}>{'🪙'}</Text>
          <Text style={styles.arrowIcon}>{'‹'}</Text>
        </View>
      </Pressable>

      <Pressable
        style={styles.dismissButton}
        onPress={handleDismiss}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        <Text style={styles.dismissText}>{'✕'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: BANNER_HEIGHT,
    backgroundColor: '#1A1A1A',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  purpleAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flameIcon: {
    fontSize: 14,
  },
  bannerText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: fontWeights.semibold,
    writingDirection: 'rtl',
  },
  coinIcon: {
    fontSize: 12,
  },
  arrowIcon: {
    color: colors.textMuted,
    fontSize: fontSizes.body,
  },
  dismissButton: {
    paddingHorizontal: spacing.lg,
    height: BANNER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    color: colors.textDim,
    fontSize: fontSizes.body,
  },
});
