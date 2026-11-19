import type { TextStyle } from 'react-native';
import { fonts } from './font';

/** Lato hierarchy shared by every screen; controls may grow with translated labels. */
export const typography = {
  display: {
    fontFamily: fonts.family,
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '700',
  },
  title: {
    fontFamily: fonts.family,
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '700',
  },
  sectionTitle: {
    fontFamily: fonts.family,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
  },
  heading: {
    fontFamily: fonts.family,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  bodyStrong: {
    fontFamily: fonts.family,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  body: {
    fontFamily: fonts.family,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
  },
  label: {
    fontFamily: fonts.family,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
  },
  value: {
    fontFamily: fonts.family,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  caption: {
    fontFamily: fonts.family,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  helper: {
    fontFamily: fonts.family,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
  },
  eyebrow: {
    fontFamily: fonts.family,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    letterSpacing: 0,
  },
  mono: { fontFamily: fonts.mono, fontSize: 14, lineHeight: 22 },
} as const satisfies Record<string, TextStyle>;

export type TypographyToken = keyof typeof typography;
