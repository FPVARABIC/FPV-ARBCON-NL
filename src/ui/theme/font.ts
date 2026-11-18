import { Platform } from 'react-native';
import type { TextStyle } from 'react-native';

/** Self-hosted Lato on web and Android; system sans-serif on other native targets. */
const LATO_WEB_STACK = "'Lato', 'Segoe UI', system-ui, sans-serif";
const MONO_WEB_STACK =
  "ui-monospace, 'Cascadia Mono', 'SF Mono', Menlo, Consolas, monospace";
export const fonts = {
  family:
    Platform.OS === 'web'
      ? LATO_WEB_STACK
      : Platform.OS === 'android'
      ? 'Lato'
      : 'System',
  mono: Platform.OS === 'web' ? MONO_WEB_STACK : 'monospace',
} as const;
export type CairoWeight = '400' | '500' | '600' | '700';
/** Compatibility name retained for existing shared styles. */
export function cairo(weight: CairoWeight): TextStyle {
  return { fontFamily: fonts.family, fontWeight: weight };
}
