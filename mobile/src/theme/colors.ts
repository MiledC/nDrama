/**
 * Color tokens mapped from docs/uxpilot-mobile/00-global-style.md
 *
 * Role assignment:
 * - Green (#00B856): CTAs, active states, progress, "action" indicators
 * - Gold (#D4A843): Coins, premium/subscription badges, monetization
 * - Purple (#8B5CF6): Streaks, achievements, gamification rewards
 */

// Base palette
export const palette = {
  // Backgrounds
  background: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceElevated: '#252525',

  // Primary — Green
  green: '#00B856',
  greenDark: '#006C35',
  greenGlow: 'rgba(0, 184, 86, 0.15)',

  // Secondary — Gold
  gold: '#D4A843',
  goldGlow: 'rgba(212, 168, 67, 0.20)',

  // Tertiary — Purple
  purple: '#8B5CF6',
  purpleGlow: 'rgba(139, 92, 246, 0.15)',
  purpleDark: '#6D28D9',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A3A3A3',
  textTertiary: '#666666',

  // UI
  divider: '#2A2A2A',
  overlay: 'rgba(0, 0, 0, 0.60)',
  error: '#EF4444',
  warning: '#F59E0B',

  // Transparent
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
} as const;

// Semantic tokens — use these in components
export const colors = {
  // Backgrounds
  bg: palette.background,
  card: palette.surface,
  cardElevated: palette.surfaceElevated,

  // CTAs & Active states
  cta: palette.green,
  ctaDark: palette.greenDark,
  ctaGlow: palette.greenGlow,
  active: palette.green,

  // Coins & Premium
  coin: palette.gold,
  coinGlow: palette.goldGlow,
  premium: palette.gold,

  // Streaks & Achievements
  streak: palette.purple,
  streakGlow: palette.purpleGlow,
  achievement: palette.purple,
  achievementRare: palette.gold,

  // Text
  text: palette.textPrimary,
  textMuted: palette.textSecondary,
  textDim: palette.textTertiary,

  // UI
  border: palette.divider,
  overlay: palette.overlay,
  error: palette.error,
  warning: palette.warning,

  // Tab bar
  tabActive: palette.green,
  tabInactive: palette.textTertiary,
  tabBar: palette.surface,
  tabBarBorder: palette.divider,

  // Status badges
  statusFree: palette.green,
  statusFreeBg: palette.greenGlow,
  statusLocked: palette.gold,
  statusLockedBg: palette.goldGlow,
  statusNew: palette.green,
  statusNewBg: palette.greenGlow,
  statusContinue: '#3B82F6',
  statusContinueBg: 'rgba(59, 130, 246, 0.15)',
  statusSubscribed: palette.gold,
  statusSubscribedBg: palette.goldGlow,

  // Episode grid states
  episodeWatched: palette.green,
  episodeWatchedBg: palette.greenGlow,
  episodeCurrent: palette.green,
  episodeFree: palette.divider,
  episodeLocked: palette.gold,
  episodeLockedBg: 'rgba(212, 168, 67, 0.15)',
} as const;
