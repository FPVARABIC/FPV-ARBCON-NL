export const radii = {
  none: 0,
  sm: 4,
  md: 6,
  lg: 10,
  pill: 999,
} as const;

export type ThemeRadii = typeof radii;
