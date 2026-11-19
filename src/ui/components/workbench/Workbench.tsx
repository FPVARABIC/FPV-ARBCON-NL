import React, { forwardRef } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ScrollViewProps, ViewProps } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme';

type BlockProps = ViewProps & {
  section: string;
  panel?: boolean;
  heading?: boolean;
};
/** Shared panel/legend structure, adapted from Betaflight UiBox and SettingRow.
 * All children, disabled reasons and transaction handlers remain owned by callers. */
export const WorkbenchBlock = forwardRef<View, BlockProps>(
  function WorkbenchBlockView(
    { section, panel = false, heading = false, children, style, ...props },
    ref,
  ) {
    const parts = React.Children.toArray(children);
    const first = parts[0];
    const textProps =
      React.isValidElement<{ children?: React.ReactNode; style?: object }>(
        first,
      ) && first.type === Text
        ? first.props
        : undefined;
    const labelStyle = StyleSheet.flatten(textProps?.style) as
      | import('react-native').TextStyle
      | undefined;
    const shortLabel =
      typeof textProps?.children === 'string' &&
      textProps.children.length <= 60;
    const legend =
      panel &&
      textProps &&
      shortLabel &&
      (Number(labelStyle?.fontWeight) >= 600 ||
        Number(labelStyle?.fontSize) >= 16)
        ? (first as React.ReactElement)
        : undefined;
    const data =
      Platform.OS === 'web'
        ? {
            dataSet: {
              wb: section,
              wbPanel: panel ? 'true' : 'false',
              wbHeading: heading ? 'true' : 'false',
              wbHidden:
                StyleSheet.flatten(style)?.display === 'none'
                  ? 'true'
                  : 'false',
            },
          }
        : {};
    return (
      <View
        ref={ref}
        {...props}
        {...data}
        style={[style, panel && styles.panel, heading && styles.heading]}
      >
        {legend ? (
          <View style={styles.legend}>
            {React.cloneElement(
              legend as React.ReactElement<{ style?: unknown }>,
              {
                style: [
                  (legend.props as { style?: unknown }).style,
                  styles.legendText,
                ],
              },
            )}
          </View>
        ) : null}
        {legend ? parts.slice(1) : children}
      </View>
    );
  },
);
export const WorkbenchScrollView = forwardRef<
  ScrollView,
  ScrollViewProps & { workspace: string }
>(function WorkbenchScroller(
  { workspace, contentContainerStyle, ...props },
  ref,
) {
  const data =
    Platform.OS === 'web' ? { dataSet: { workbench: workspace } } : {};
  return (
    <ScrollView
      ref={ref}
      {...props}
      {...data}
      contentContainerStyle={[styles.content, contentContainerStyle]}
    />
  );
});
const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
    shadowOpacity: 0,
    elevation: 0,
    overflow: 'visible',
    marginTop: spacing.sm,
  },
  legend: {
    alignSelf: 'flex-start',
    marginTop: -23,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
  },
  legendText: {
    ...typography.label,
    fontSize: 13,
    lineHeight: 20,
    color: colors.accentText,
    fontWeight: '700',
  },
  heading: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
    backgroundColor: colors.background,
    alignItems: 'stretch',
    alignSelf: 'stretch',
    width: '100%',
  },
  content: {
    width: '100%',
    maxWidth: undefined,
    padding: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
    alignSelf: 'stretch',
  },
});
