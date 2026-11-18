import {colors} from './colors';

function relativeLuminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    ?.map(channel => Number.parseInt(channel, 16) / 255)
    .map(channel =>
      channel <= 0.03928
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4,
    );
  if (channels === undefined || channels.length !== 3) {
    throw new Error(`Invalid six-digit colour: ${hex}`);
  }
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(first: string, second: string): number {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Firecom-inspired dark visual identity', () => {
  const surfaces = [colors.background, colors.backgroundRaised, colors.surface, colors.surfaceAlt, colors.surfaceRaised];
  it.each(surfaces)('keeps ordinary and disabled copy readable on %s', background => {
    for (const foreground of [colors.textPrimary, colors.textSecondary, colors.textMuted, colors.disabled, colors.accentStrong]) {
      expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it.each([
    ['gold actions', colors.accentText, colors.accent],
    ['hovered gold actions', colors.accentText, colors.accentHover],
    ['pressed gold actions', colors.accentText, colors.accentPressed],
    ['danger actions', colors.white, colors.errorFill],
    ['hardware copy', colors.accentStrong, colors.accentSoft],
    ['error copy', colors.error, colors.errorSoft],
    ['warning copy', colors.warning, colors.warningSoft],
    ['success copy', colors.success, colors.successSoft],
    ['info copy', colors.info, colors.infoSoft],
  ])('keeps %s at WCAG AA contrast', (_name, foreground, background) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });
});
