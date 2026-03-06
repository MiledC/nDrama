import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {colors, fontWeights} from '../theme';

type SplashNav = NativeStackNavigationProp<RootStackParamList>;

const DOT_COUNT = 3;
const DOT_SIZE = 6;
const AUTO_NAV_DELAY = 2000;

/**
 * Splash screen -- cinematic brand reveal shown on app launch.
 * Auto-transitions to MainTabs after 2 seconds with a fade-out effect.
 */
const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashNav>();

  // ---------- Animations ----------
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const dotAnimations = useRef(
    Array.from({length: DOT_COUNT}, () => new Animated.Value(0.2)),
  ).current;

  // Pulsing dots – staggered infinite loop
  useEffect(() => {
    const createDotLoop = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.2,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      );

    const loops = dotAnimations.map((dot, i) => createDotLoop(dot, i * 200));
    loops.forEach(l => l.start());

    return () => loops.forEach(l => l.stop());
  }, [dotAnimations]);

  // Auto-navigate after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      // Fade the whole screen out, then navigate
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        navigation.reset({index: 0, routes: [{name: 'MainTabs'}]});
      });
    }, AUTO_NAV_DELAY);

    return () => clearTimeout(timer);
  }, [navigation, screenOpacity]);

  // ---------- Render ----------
  return (
    <Animated.View style={[styles.root, {opacity: screenOpacity}]}>
      {/* Base background */}
      <View style={styles.bgBase} />

      {/* Bottom green wash at 8 % opacity */}
      <View style={styles.bgGreenWash} />

      {/* Film-grain texture overlay (subtle noise via small semi-transparent dots pattern) */}
      <View style={styles.grainOverlay} />

      {/* ---- Centered content ---- */}
      <View style={styles.centerContent}>
        {/* Logo */}
        <Animated.Text style={styles.logo}>
          <Animated.Text style={styles.logoAccent}>D</Animated.Text>
          raama
        </Animated.Text>

        {/* Green divider line */}
        <View style={styles.divider} />

        {/* Tagline */}
        <Animated.Text style={styles.tagline}>
          {'مسلسلات قصيرة. دراما كبيرة.'}
        </Animated.Text>
      </View>

      {/* ---- Bottom loading indicator ---- */}
      <View style={styles.dotsContainer}>
        {dotAnimations.map((anim, idx) => (
          <Animated.View
            key={idx}
            style={[styles.dot, {opacity: anim}]}
          />
        ))}
      </View>
    </Animated.View>
  );
};

export default SplashScreen;

// ---------- Styles ----------

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  /* ---- Background layers ---- */
  bgBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
  },
  bgGreenWash: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    backgroundColor: colors.ctaDark,
    opacity: 0.08,
  },
  grainOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.012)',
  },

  /* ---- Center ---- */
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: fontWeights.bold,
    color: colors.text,
    letterSpacing: 2,
  },
  logoAccent: {
    color: colors.cta,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: colors.cta,
    marginTop: 12,
    borderRadius: 1,
  },
  tagline: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 10,
    letterSpacing: 0.5,
  },

  /* ---- Dots ---- */
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 48,
    gap: 8,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: colors.cta,
  },
});
