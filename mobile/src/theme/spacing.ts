/**
 * Spacing & layout tokens mapped from docs/uxpilot-mobile/00-global-style.md
 * Base: 375pt mobile width
 */

export const spacing = {
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px — carousel gap, card padding, menu item gap */
  md: 12,
  /** 16px — screen horizontal padding, item padding */
  lg: 16,
  /** 20px */
  xl: 20,
  /** 24px */
  xxl: 24,
  /** 28px — section vertical spacing */
  section: 28,
} as const;

export const radii = {
  /** 8px — thumbnails */
  thumbnail: 8,
  /** 12px — cards, inputs */
  card: 12,
  /** 20px — bottom sheets */
  sheet: 20,
  /** 24px — pill buttons */
  pill: 24,
  /** 9999px — full circle */
  full: 9999,
} as const;

export const sizes = {
  /** 48px — buttons, inputs */
  buttonHeight: 48,
  /** 44px — secondary buttons */
  buttonHeightSm: 44,
  /** 36px — small buttons */
  buttonHeightXs: 36,
  /** 28px — mini buttons (Top Up, Subscribe pills) */
  buttonHeightMini: 28,
  /** 56px — tab bar */
  tabBarHeight: 56,
  /** 48px — search bar */
  searchBarHeight: 48,
  /** 24px — tab bar icons */
  tabIcon: 24,
  /** 44px — episode grid squares */
  episodeSquare: 44,
  /** 72px — profile avatar */
  avatar: 72,
  /** 40px — notification icon circles */
  notificationIcon: 40,
} as const;
