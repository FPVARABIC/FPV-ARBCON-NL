import React, {useCallback, useRef, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import type {LayoutChangeEvent} from 'react-native';
import {colors, radii, spacing, typography} from '../../theme';
import {readInteraction} from '../controls/interaction';

/** Jump to a section, leaving every field mounted and visible in the same scroll view. */
export function useSectionNavigation() {
  const scrollRef = useRef<ScrollView>(null);
  const positions = useRef(new Map<string, number>());
  const register = useCallback((key: string) => (event: LayoutChangeEvent) => {
    positions.current.set(key, event.nativeEvent.layout.y);
  }, []);
  const jump = useCallback((key: string) => {
    const y = positions.current.get(key);
    if (y !== undefined) scrollRef.current?.scrollTo({y: Math.max(0, y - spacing.md), animated: false});
  }, []);
  return {scrollRef, register, jump};
}

export function SectionNavigation({items, onSelect}: {
  readonly items: readonly {key: string; label: string}[];
  readonly onSelect: (key: string) => void;
}): React.JSX.Element {
  const [selected, setSelected] = useState<string>();
  return <View style={styles.bar} testID="section-navigation" accessibilityLabel="Ga naar onderdeel">
    {items.map(item => <Pressable key={item.key} accessibilityRole="button" accessibilityState={{selected: selected === item.key}}
      onPress={() => {setSelected(item.key); onSelect(item.key);}}
      testID={`section-jump-${item.key}`} style={state => [styles.item, selected === item.key && styles.selected, (readInteraction(state).hovered || state.pressed) && styles.hover]}>
      <Text style={styles.label}>{item.label}</Text>
    </Pressable>)}
  </View>;
}
const styles = StyleSheet.create({
  bar: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
  item: {minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radii.sm, backgroundColor: colors.backgroundRaised, borderWidth: 1, borderColor: colors.borderSoft},
  hover: {backgroundColor: colors.accentSoft, borderColor: colors.accent},
  selected: {backgroundColor: colors.accentSoft, borderColor: colors.accent},
  label: {...typography.label, color: colors.textPrimary},
});
