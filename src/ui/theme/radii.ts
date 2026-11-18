export const radii = {
  none: 0,
  sm: 10,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export type ThemeRadii = typeof radii;
