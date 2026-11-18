import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import BrandLogo, {
  BRAND_PRODUCT_NAME,
  BRAND_PRODUCT_TAGLINE,
} from './BrandLogo';

/** Persistent product identity on every web route; native keeps its Home lockup. */
export default function BrandTopChrome(): React.JSX.Element {
  return (
    <View style={styles.strip} testID="brand-top-chrome">
      <View style={styles.lockup}>
        <BrandLogo height={48} testID="brand-logo" />
        <View style={styles.rule} />
        <View style={styles.copy}>
          <Text style={styles.productName} testID="brand-product-name">
            {BRAND_PRODUCT_NAME}
          </Text>
          <Text style={styles.tagline}>{BRAND_PRODUCT_TAGLINE}</Text>
        </View>
        <View style={styles.locale}>
          <Text style={styles.localeText}>NL</Text>
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  strip: {
    width: '100%',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  lockup: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rule: { width: 2, height: 36, backgroundColor: colors.accent },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  productName: {
    ...typography.heading,
    color: colors.textPrimary,
    writingDirection: 'ltr',
    textAlign: 'left',
  },
  tagline: {
    ...typography.helper,
    color: colors.textMuted,
    writingDirection: 'ltr',
    textAlign: 'left',
  },
  locale: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  localeText: { ...typography.caption, color: colors.accentStrong },
});
