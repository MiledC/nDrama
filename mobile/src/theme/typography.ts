import {Platform, TextStyle} from 'react-native';

/**
 * Typography tokens mapped from docs/uxpilot-mobile/00-global-style.md
 *
 * EN: Inter, AR: Noto Sans Arabic
 * React Native uses system fonts by default; these can be overridden
 * once custom fonts are loaded via react-native-asset.
 */

const fontFamily = {
  en: Platform.select({ios: 'Inter', android: 'Inter'}),
  ar: Platform.select({ios: 'Noto Sans Arabic', android: 'NotoSansArabic'}),
};

export const fontSizes = {
  hero: 28,
  sectionTitle: 20,
  cardTitle: 16,
  body: 14,
  caption: 12,
  tabLabel: 11,
  tiny: 10,
  coinAmount: 18,
  button: 16,
  episodeNumber: 14,
} as const;

export const fontWeights = {
  bold: '700' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  regular: '400' as TextStyle['fontWeight'],
};

export const typography = {
  heroTitle: {
    fontSize: fontSizes.hero,
    fontWeight: fontWeights.bold,
    fontFamily: fontFamily.en,
  } as TextStyle,

  sectionTitle: {
    fontSize: fontSizes.sectionTitle,
    fontWeight: fontWeights.bold,
    fontFamily: fontFamily.en,
  } as TextStyle,

  cardTitle: {
    fontSize: fontSizes.cardTitle,
    fontWeight: fontWeights.semibold,
    fontFamily: fontFamily.en,
  } as TextStyle,

  body: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.regular,
    fontFamily: fontFamily.en,
  } as TextStyle,

  caption: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
    fontFamily: fontFamily.en,
  } as TextStyle,

  tabLabel: {
    fontSize: fontSizes.tabLabel,
    fontWeight: fontWeights.semibold,
    fontFamily: fontFamily.en,
  } as TextStyle,

  button: {
    fontSize: fontSizes.button,
    fontWeight: fontWeights.semibold,
    fontFamily: fontFamily.en,
  } as TextStyle,

  coinAmount: {
    fontSize: fontSizes.coinAmount,
    fontWeight: fontWeights.bold,
    fontFamily: fontFamily.en,
  } as TextStyle,
} as const;

// Arabic variants — use these when locale is AR
export const typographyAr = {
  heroTitle: {...typography.heroTitle, fontFamily: fontFamily.ar},
  sectionTitle: {...typography.sectionTitle, fontFamily: fontFamily.ar},
  cardTitle: {...typography.cardTitle, fontFamily: fontFamily.ar},
  body: {...typography.body, fontFamily: fontFamily.ar},
  caption: {...typography.caption, fontFamily: fontFamily.ar},
  tabLabel: {...typography.tabLabel, fontFamily: fontFamily.ar},
  button: {...typography.button, fontFamily: fontFamily.ar},
  coinAmount: {...typography.coinAmount, fontFamily: fontFamily.ar},
} as const;
