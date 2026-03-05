/**
 * Design tokens re-exported from tamagui.config for convenient access.
 *
 * Usage:
 *   import { colors, spacing, radii, typography } from '@/theme/tokens'
 */

export { tokens, darkTheme, config } from '../../tamagui.config'

// ---------------------------------------------------------------------------
// Raw color values (non-token) for use outside Tamagui (e.g. React Navigation)
// ---------------------------------------------------------------------------

export const colors = {
  background: '#0D0D0D',
  backgroundGradientStart: '#1a0a2e',
  surface: '#1F1133',
  surfaceElevated: '#2A1845',
  primary: '#00B856',
  primaryDark: '#006C35',
  accent: '#8B5CF6',
  accentDark: '#6D28D9',
  secondary: '#D4A843',
  divider: '#2A2A2A',
  textPrimary: '#FFFFFF',
  textSecondary: '#A3A3A3',
  textTertiary: '#666666',
  error: '#EF4444',
  overlay: 'rgba(0,0,0,0.6)',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const

// ---------------------------------------------------------------------------
// Spacing (raw values)
// ---------------------------------------------------------------------------

export const spacing = {
  screenHorizontal: 16,
  carouselGap: 12,
  sectionVertical: 28,
} as const

// ---------------------------------------------------------------------------
// Radii (raw values)
// ---------------------------------------------------------------------------

export const radii = {
  card: 12,
  thumbnail: 8,
  bottomSheet: 20,
  button: 24,
  input: 12,
} as const

// ---------------------------------------------------------------------------
// Typography presets
// ---------------------------------------------------------------------------

export const typography = {
  heroTitle: { fontSize: 28, fontWeight: '700' as const },
  sectionTitle: { fontSize: 20, fontWeight: '700' as const },
  seriesCardTitle: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
  episodeCounter: { fontSize: 14, fontWeight: '700' as const },
  coinAmount: { fontSize: 18, fontWeight: '700' as const },
  tabLabel: { fontSize: 11, fontWeight: '600' as const },
  button: { fontSize: 16, fontWeight: '600' as const },
} as const
