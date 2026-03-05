import { createFont, createTamagui, createTokens } from '@tamagui/core'
import { shorthands } from '@tamagui/config/v4'

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------

const size = {
  1: 11,
  2: 12,
  3: 14,
  4: 16,
  5: 18,
  6: 20,
  7: 24,
  8: 28,
  9: 32,
  10: 40,
  true: 14,
} as const

const lineHeight = {
  1: 16,
  2: 18,
  3: 20,
  4: 24,
  5: 26,
  6: 28,
  7: 32,
  8: 36,
  9: 40,
  10: 48,
  true: 20,
} as const

const weight = {
  1: '400',
  2: '400',
  3: '400',
  4: '400',
  5: '500',
  6: '600',
  7: '600',
  8: '700',
  9: '700',
  10: '700',
  true: '400',
} as const

const letterSpacing = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
  6: 0,
  7: 0,
  8: 0,
  9: -0.5,
  10: -0.5,
  true: 0,
} as const

const interFont = createFont({
  family: 'Inter',
  size,
  lineHeight,
  weight,
  letterSpacing,
  face: {
    400: { normal: 'Inter_400Regular' },
    500: { normal: 'Inter_500Medium' },
    600: { normal: 'Inter_600SemiBold' },
    700: { normal: 'Inter_700Bold' },
  },
})

const notoSansArabicFont = createFont({
  family: 'NotoSansArabic',
  size,
  lineHeight,
  weight,
  letterSpacing,
  face: {
    400: { normal: 'NotoSansArabic_400Regular' },
    500: { normal: 'NotoSansArabic_500Medium' },
    600: { normal: 'NotoSansArabic_600SemiBold' },
    700: { normal: 'NotoSansArabic_700Bold' },
  },
})

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------

const tokens = createTokens({
  color: {
    // Backgrounds
    background: '#0D0D0D',
    backgroundGradientStart: '#1a0a2e',
    surface: '#1F1133',
    surfaceElevated: '#2A1845',

    // Brand
    primary: '#00B856',
    primaryDark: '#006C35',
    accent: '#8B5CF6',
    accentDark: '#6D28D9',
    secondary: '#D4A843',

    // Divider
    divider: '#2A2A2A',

    // Text
    textPrimary: '#FFFFFF',
    textSecondary: '#A3A3A3',
    textTertiary: '#666666',

    // Semantic
    error: '#EF4444',
    overlay: 'rgba(0,0,0,0.6)',

    // Utility
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
  },

  space: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 40,
    10: 48,
    true: 16,

    // Semantic spacing aliases (as numeric values)
    '-1': -4,
    '-2': -8,
    '-3': -12,
    '-4': -16,
  },

  size: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 40,
    10: 48,
    11: 56,
    12: 64,
    true: 16,

    // Component sizes
    buttonHeight: 48,
    inputHeight: 48,
  },

  radius: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    true: 12,

    // Semantic radius aliases
    thumbnail: 8,
    card: 12,
    input: 12,
    bottomSheet: 20,
    button: 24,
  },

  zIndex: {
    0: 0,
    1: 100,
    2: 200,
    3: 300,
    4: 400,
    5: 500,
  },
})

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------

const darkTheme = {
  background: tokens.color.background,
  backgroundHover: tokens.color.surface,
  backgroundPress: tokens.color.surfaceElevated,
  backgroundFocus: tokens.color.surface,
  backgroundStrong: tokens.color.backgroundGradientStart,
  backgroundTransparent: tokens.color.transparent,

  color: tokens.color.textPrimary,
  colorHover: tokens.color.textPrimary,
  colorPress: tokens.color.textSecondary,
  colorFocus: tokens.color.textPrimary,
  colorTransparent: tokens.color.transparent,

  borderColor: tokens.color.divider,
  borderColorHover: tokens.color.accent,
  borderColorFocus: tokens.color.accent,
  borderColorPress: tokens.color.accentDark,

  placeholderColor: tokens.color.textTertiary,

  // Semantic color aliases for easy access in components
  primary: tokens.color.primary,
  primaryDark: tokens.color.primaryDark,
  accent: tokens.color.accent,
  accentDark: tokens.color.accentDark,
  secondary: tokens.color.secondary,
  surface: tokens.color.surface,
  surfaceElevated: tokens.color.surfaceElevated,
  error: tokens.color.error,
  overlay: tokens.color.overlay,
  textPrimary: tokens.color.textPrimary,
  textSecondary: tokens.color.textSecondary,
  textTertiary: tokens.color.textTertiary,
  divider: tokens.color.divider,
  backgroundGradientStart: tokens.color.backgroundGradientStart,

  shadowColor: tokens.color.black,
  shadowColorHover: tokens.color.black,
  shadowColorPress: tokens.color.black,
  shadowColorFocus: tokens.color.black,
} as const

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const config = createTamagui({
  defaultFont: 'body',
  shouldAddPrefersColorThemes: false,
  themeClassNameOnRoot: false,
  shorthands,
  fonts: {
    heading: interFont,
    body: interFont,
    arabic: notoSansArabicFont,
  },
  tokens,
  themes: {
    dark: darkTheme,
  },
  media: {
    sm: { maxWidth: 390 },
    md: { maxWidth: 768 },
    lg: { maxWidth: 1024 },
  },
})

// Export tokens and theme for external use
export { tokens }
export { darkTheme }

export type AppConfig = typeof config

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config
