import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';
export function WorkbenchTabs<K extends string>({
  items,
  selected,
  onSelect,
  testID,
}: {
  items: readonly { key: K; label: string }[];
  selected: K;
  onSelect: (key: K) => void;
  testID: string;
}): React.JSX.Element {
  return (
    <View style={styles.tabs} accessibilityRole="tablist" testID={testID}>
      {items.map(item => (
        <Pressable
          key={item.key}
          accessibilityRole="tab"
          accessibilityState={{ selected: selected === item.key }}
          aria-selected={selected === item.key}
          onPress={() => onSelect(item.key)}
          testID={`${testID}-${item.key}`}
          style={[styles.tab, selected === item.key && styles.active]}
        >
          <Text
            style={[styles.label, selected === item.key && styles.activeLabel]}
          >
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  tab: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  active: {
    borderBottomColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  label: { ...typography.label, color: colors.textSecondary },
  activeLabel: { color: colors.accentStrong, fontWeight: '700' },
});
