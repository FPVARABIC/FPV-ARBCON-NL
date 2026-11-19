/**
 * THE DESKTOP NAVIGATION RAIL.
 *
 * WHY IT EXISTS. A bottom tab bar is a phone idiom. On a 1920px monitor
 * it puts the primary navigation as far from the operator's eyes as the
 * window allows and wastes the horizontal room a configurator needs. The
 * operator reported the post-connection screens as "a mobile phone
 * interface inside a desktop monitor"; this is the navigation half of the
 * answer.
 *
 * IT IS THE SAME NAVIGATION, NOT A SECOND ONE. Identical props to
 * BottomTabBar, identical MAIN_TABS order, identical
 * implemented-only filtering, identical "reports a press and nothing
 * else" contract. The shell renders exactly one of the two for a given
 * width - it never mounts, unmounts or reorders any tab PANEL, which is
 * the invariant MainTabsScreen's motor-stop bridge depends on.
 *
 * RTL. The rail sits on the right under the app's forceRTL, which is the
 * reading-order start.
 */

import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {colors, radii, spacing, typography} from '../../theme';
import { Icon } from '../../icons';
import { MIN_TOUCH_TARGET, readInteraction } from '../controls/interaction';
import { MAIN_TABS, type MainTabKey } from '../../../navigation/tabs';
import { TAB_ICONS } from './tabIcons';
import { useActiveItemReveal } from './activeItemReveal';
import { TOOL_GROUP_STARTS } from './toolGroups';

const VISIBLE_TABS = MAIN_TABS.filter(tab => tab.implemented);

/** Wide enough for the longest Arabic destination label at 100% text
 * scale without wrapping, and narrow enough to leave the workspace the
 * majority of a 1280px window. */
export const SIDE_RAIL_WIDTH = 208;

export interface SideNavigationRailProps {
  readonly activeTab: MainTabKey;
  readonly onSelectTab: (tab: MainTabKey) => void;
  /** Optional connection/identity strip shown above the destinations. */
  readonly header?: React.ReactNode;
}

export default function SideNavigationRail({
  activeTab,
  onSelectTab,
  header,
}: SideNavigationRailProps): React.JSX.Element {
  const { t } = useTranslation();
  const reveal = useActiveItemReveal<MainTabKey>(activeTab, 'y');

  return (
    <View
      style={styles.rail}
      accessibilityRole="tablist"
      accessibilityLabel={t('tabs.barAccessibilityLabel')}
      testID="main-side-rail"
    >
      {Platform.OS !== 'web' ? (
        <View style={styles.brand} testID="main-side-rail-brand">
          <Text style={styles.brandName}>fiercon</Text>
        </View>
      ) : null}
      {header !== undefined ? (
        <View style={styles.header} testID="main-side-rail-header">
          {header}
        </View>
      ) : null}
      <ScrollView
        ref={reveal.scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator
        onLayout={reveal.onScrollViewLayout}
        onContentSizeChange={reveal.onContentSizeChange}
        testID="main-side-rail-scroll"
      >
        {VISIBLE_TABS.map(tab => {
          const isActive = tab.key === activeTab;
          return (
            <React.Fragment key={tab.key}>
              {TOOL_GROUP_STARTS.has(tab.key) ? <Text style={styles.groupLabel}>{TOOL_GROUP_STARTS.get(tab.key)}</Text> : null}
            <Pressable
              onPress={() => onSelectTab(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive, disabled: false }}
              aria-selected={isActive}
              style={state => {
                const { pressed, hovered } = readInteraction(state);
                return [
                  styles.item,
                  (hovered || pressed) && !isActive && styles.itemHovered,
                  isActive && styles.itemActive,
                ];
              }}
              onLayout={reveal.registerItem(tab.key)}
              testID={`main-rail-${tab.key}`}
            >
              <View
                style={[styles.iconBubble, isActive && styles.iconBubbleActive]}
              >
                <Icon
                  name={TAB_ICONS[tab.key]}
                  size={20}
                  color={isActive ? colors.accentText : colors.textSecondary}
                />
              </View>
              <Text
                style={[styles.label, isActive && styles.labelActive]}
              >
                {t(tab.labelKey)}
              </Text>
            </Pressable>
            </React.Fragment>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: SIDE_RAIL_WIDTH,
    backgroundColor: colors.backgroundRaised,
    borderEndWidth: 1,
    borderEndColor: colors.borderSoft,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.backgroundRaised,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  brandName: {
    ...typography.title,
    color: colors.accentStrong,
    fontWeight: '700',
    writingDirection: 'ltr',
  },
  groupLabel: {
    ...typography.eyebrow,
    color: colors.textMuted,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  header: {
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  /**
   * THE SCROLLER MUST BE ALLOWED TO SHRINK. React Native's Yoga default is
   * `flexShrink: 0` (yoga Style.h: `DefaultFlexShrink = 0.0f`, and the
   * Android config does not enable web defaults), so an unstyled
   * ScrollView in this column took its FULL content height, overflowed the
   * rail and reported a scroll range of zero - the destinations past the
   * bottom edge were clipped and permanently unreachable on Android. The
   * browser masked it because CSS defaults to `flex-shrink: 1`: measured
   * here, react-native-web gave the same ScrollView shrink=1, a 672px
   * viewport over 716px of content, and it scrolled correctly.
   */
  scroll: { flex: 1 },
  list: { gap: spacing.xs },
  item: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
  },
  itemHovered: { backgroundColor: colors.surfaceHover },
  itemActive: { backgroundColor: colors.accentSoft },
  iconBubble: {
    width: 34,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
  },
  iconBubbleActive: { backgroundColor: colors.accent },
  label: {
    ...typography.body,
    flex: 1,
    fontWeight: '700',
    color: colors.textSecondary,
    writingDirection: 'ltr'},
  labelActive: { color: colors.accentStrong },
});
