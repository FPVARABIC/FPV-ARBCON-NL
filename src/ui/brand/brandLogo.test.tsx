/* eslint-disable no-bitwise --
 * The asset-truth test below reads the WebP VP8X feature flags byte, and
 * a flags byte is read with a mask. Same documented file-header pattern
 * the OSD firmware-word suites use. */
/** fiercon mark geometry/accessibility and placement. The original supplied
 * emblem is retained as a legacy source asset, separate from the current mark. */

import {createHash} from 'crypto';
import {existsSync, readFileSync, readdirSync, statSync} from 'fs';
import {join} from 'path';

import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';

import BrandLogo, {
  BRAND_LOGO_ASPECT,
  BRAND_LOGO_CONTENT_HEIGHT,
  BRAND_LOGO_CONTENT_WIDTH,
  BRAND_LOGO_LABEL,
} from './BrandLogo';
import BrandTopChrome from './BrandTopChrome';
import {BRAND_LOGO_SOURCE} from './brandLogoSource';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const ASSET_PATH = join(__dirname, 'fpvArabicLogo.webp');

/** The operator-supplied file, measured at integration time. */
const EXPECTED_SHA256 =
  'a6099046f6f3db3edc1ff639894e31de1ceb0773fdebfdd71bd50abfab076ec7';
const EXPECTED_BYTES = 122934;

function render(element: React.JSX.Element) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    renderer = ReactTestRenderer.create(element);
  });
  return renderer;
}

function flatten(style: unknown): Record<string, unknown> {
  const flat: Record<string, unknown> = {};
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(walk);
    } else if (value && typeof value === 'object') {
      Object.assign(flat, value);
    }
  };
  walk(style);
  return flat;
}

describe('the archived supplied emblem remains intact', () => {
  it('matches the recorded byte identity - sha256, size, WebP container, real alpha channel', () => {
    const bytes = readFileSync(ASSET_PATH);
    expect(bytes.length).toBe(EXPECTED_BYTES);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(
      EXPECTED_SHA256,
    );
    // RIFF....WEBP container, VP8X extended header with the ALPHA flag -
    // transparency is part of the delivered brand and must survive.
    expect(bytes.subarray(0, 4).toString('latin1')).toBe('RIFF');
    expect(bytes.subarray(8, 12).toString('latin1')).toBe('WEBP');
    expect(bytes.subarray(12, 16).toString('latin1')).toBe('VP8X');
    expect(bytes[20] & 0x10).toBe(0x10);
  });

  it('keeps the legacy asset module addressable independently of the current vector mark', () => {
    const source = BRAND_LOGO_SOURCE as unknown as {testUri?: string};
    expect(source.testUri ?? '').toMatch(/fpvArabicLogo\.webp$/);
  });
});

describe('fiercon identity geometry', () => {
  it('keeps the vector mark square at both toolbar and launcher sizes', () => {
    for (const height of [32, 64, 100]) {
      const renderer = render(<BrandLogo height={height} />);
      const windowStyle = flatten(renderer.root.findByProps({testID: 'brand-logo'}).props.style);
      expect(windowStyle.height).toBe(height);
      expect(windowStyle.width).toBe(height);
      expect(BRAND_LOGO_ASPECT).toBe(BRAND_LOGO_CONTENT_WIDTH / BRAND_LOGO_CONTENT_HEIGHT);
      expect(BRAND_LOGO_LABEL).toBe('fiercon');
      act(() => renderer.unmount());
    }
  });

  it('announces the brand exactly once - and not at all when decorative', () => {
    const labeled = render(<BrandLogo height={40} />);
    const labeledWindow = labeled.root.findByProps({testID: 'brand-logo'});
    expect(labeledWindow.props.accessibilityLabel).toBe(BRAND_LOGO_LABEL);
    expect(labeledWindow.props.accessibilityRole).toBe('image');
    act(() => labeled.unmount());

    const decorative = render(<BrandLogo height={40} decorative />);
    const decorativeWindow = decorative.root.findByProps({
      testID: 'brand-logo',
    });
    expect(decorativeWindow.props.accessible).toBe(false);
    expect(decorativeWindow.props.accessibilityElementsHidden).toBe(true);
    expect(decorativeWindow.props.accessibilityLabel).toBeUndefined();
    act(() => decorative.unmount());
  });
});

describe('placement policy', () => {
  it('the web top chrome carries exactly ONE primary brand mark', () => {
    const renderer = render(<BrandTopChrome />);
    // Host nodes only: findAllByProps also matches the logical component
    // and RN's composite View, which forward the same testID through -
    // the same duplication App.test.tsx's findByTestID() filters for.
    const logos = renderer.root
      .findAllByProps({testID: 'brand-logo'})
      .filter(node => typeof node.type === 'string');
    expect(logos).toHaveLength(1);
    act(() => renderer.unmount());
  });

  it('the old placeholder lettermarks are gone from the sources that carried them', () => {
    // Three placeholders existed before the official logo arrived: the
    // Start screen's hand-drawn badge (core square + rotated arms), the
    // side rail's circled 'F' glyph, and the connection header's 'FPV'
    // tile. The third is gone with the file that drew it - the whole
    // connection screen was removed - so the two renderers that still
    // exist are checked in SOURCE, the same technique
    // operatorVocabulary.test.ts trusts, because a placeholder that
    // ships is a placeholder wherever the render tree hides it.
    const railSource = readFileSync(
      join(REPO_ROOT, 'src', 'ui', 'components', 'navigation', 'SideNavigationRail.tsx'),
      'utf8',
    );
    expect(railSource).not.toMatch(/>F</);
    expect(railSource).not.toContain('brandGlyph');

    // The connection header carried the third placeholder. Asserting its
    // ABSENCE is stronger than asserting its contents.
    expect(
      existsSync(
        join(REPO_ROOT, 'src', 'ui', 'components', 'connection', 'ConnectionHeader.tsx'),
      ),
    ).toBe(false);

    const startSource = readFileSync(
      join(REPO_ROOT, 'src', 'ui', 'screens', 'StartScreen.tsx'),
      'utf8',
    );
    expect(startSource).not.toContain('brandArm');
    expect(startSource).not.toContain('brandCore');
    expect(startSource).toContain('BrandLogo');
  });

  it('no tool screen imports the brand mark - Android screen space beyond Start belongs to the tools', () => {
    // Structural proof, stronger than mounting each of the 15 tabs: the
    // ONLY renderer files that may import src/ui/brand are the Start
    // screen (Android placement) and App.web.tsx (web chrome). If a tab
    // screen ever imports it, this fails and forces the conversation.
    const allowed = new Set([
      join(REPO_ROOT, 'src', 'ui', 'screens', 'StartScreen.tsx'),
    ]);
    const offenders: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
          if (entry === 'brand' || entry === 'node_modules') continue;
          walk(full);
          continue;
        }
        if (!/\.(ts|tsx)$/.test(entry) || /\.test\.tsx?$/.test(entry)) {
          continue;
        }
        const text = readFileSync(full, 'utf8');
        if (/from\s+'[^']*\/brand[/']|from\s+'\.\.\/brand'/.test(text)) {
          if (!allowed.has(full)) {
            offenders.push(full);
          }
        }
      }
    };
    walk(join(REPO_ROOT, 'src', 'ui'));
    expect(offenders).toEqual([]);
  });

  it('the protocol layer cannot reach the logo asset at all', () => {
    // Same source-walking fence the OSD preview photo carries: nothing
    // under src/core or the protocol/transport layers may import the
    // brand module or the asset. The logo is presentation-only and can
    // never enter an MSP or DFU payload by construction.
    const roots = [
      join(REPO_ROOT, 'src', 'core'),
      join(REPO_ROOT, 'src', 'platforms'),
    ];
    const offenders: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
          if (entry === 'node_modules') continue;
          walk(full);
          continue;
        }
        if (!/\.(ts|tsx)$/.test(entry)) continue;
        const text = readFileSync(full, 'utf8');
        if (text.includes('ui/brand') || text.includes('fpvArabicLogo')) {
          offenders.push(full);
        }
      }
    };
    roots.forEach(walk);
    expect(offenders).toEqual([]);
  });
});
