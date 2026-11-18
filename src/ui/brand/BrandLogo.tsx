import React from 'react';
import {StyleSheet, View} from 'react-native';
import Svg, {Path, Rect} from 'react-native-svg';
import {colors} from '../theme';

export const BRAND_PRODUCT_NAME = 'fiercon';
export const BRAND_PRODUCT_TAGLINE = 'FPV-configurator';
export const BRAND_LOGO_LABEL = BRAND_PRODUCT_NAME;
export const BRAND_LOGO_CONTENT_WIDTH = 48;
export const BRAND_LOGO_CONTENT_HEIGHT = 48;
export const BRAND_LOGO_ASPECT = 1;

export interface BrandLogoProps {
  readonly height: number;
  readonly decorative?: boolean;
  readonly testID?: string;
}

/** Original folded-F mark, shared with the PWA and Android launcher. */
export default function BrandLogo({height, decorative = false, testID = 'brand-logo'}: BrandLogoProps): React.JSX.Element {
  return <View testID={testID} style={[styles.mark, {width: height, height}]}
    accessible={!decorative} accessibilityRole={decorative ? undefined : 'image'}
    accessibilityLabel={decorative ? undefined : BRAND_LOGO_LABEL}
    accessibilityElementsHidden={decorative} importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}>
    <Svg width={height} height={height} viewBox="0 0 48 48" accessible={false}>
      <Rect x={1} y={1} width={46} height={46} rx={10} fill={colors.backgroundRaised} stroke={colors.border} />
      <Path d="M12 35V13H36L31 19H19V23H30L25 29H19V35Z" fill={colors.accent} />
      <Path d="M27 35L36 24V35Z" fill={colors.textPrimary} />
    </Svg>
  </View>;
}

const styles = StyleSheet.create({mark: {flexShrink: 0, overflow: 'hidden'}});
