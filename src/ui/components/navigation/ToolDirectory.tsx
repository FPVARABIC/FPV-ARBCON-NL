import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MAIN_TABS, type MainTabKey } from '../../../navigation/tabs';
import { Icon } from '../../icons';
import { colors, effectiveWidth, radii, spacing, typography } from '../../theme';
import { readInteraction } from '../controls/interaction';
import { TAB_ICONS } from './tabIcons';
import { TOOL_GROUPS } from './toolGroups';

/** The same destination registry drives Home, the phone directory and both tab bars. */
const DESCRIPTIONS: Record<MainTabKey, string> = {
  SETUP: 'Oriëntatie, kalibratie en bordinformatie',
  MOTORS: 'Motoropstelling, richting en gecontroleerde tests',
  PORTS: 'UART-poorten en aangesloten apparatuur',
  GPS: 'Satellieten, positie en GPS-instellingen',
  CONFIGURATIONS: 'Bordfuncties en algemene instellingen',
  RECEIVER: 'Kanalen, ontvangerprotocol en signaal',
  PID: 'PID-waarden, rates en filters',
  MODES: 'Vliegmodi en AUX-schakelaars',
  FAILSAFE: 'Gedrag bij verlies van het radiosignaal',
  POWER: 'Accu, spanning en stroommeting',
  OSD: 'Schermindeling en waarschuwingen',
  VTX: 'Videokanaal, frequentie en zendvermogen',
  LED: 'LED-posities, kleuren en functies',
  SENSORS: 'Live sensorgegevens en meetgrafieken',
  BLACKBOX: 'Vluchtregistratie en opslagbeheer',
  PRESETS: 'Configuratievoorinstellingen bekijken en toepassen',
  CLI: 'Opdrachtregel, uitvoer en configuratieback-ups',
};

export function ToolDirectory({
  onSelect,
  activeTab,
  compact = false,
}: {
  readonly onSelect?: (tab: MainTabKey) => void;
  readonly activeTab?: MainTabKey;
  readonly compact?: boolean;
}): React.JSX.Element {
  const { t } = useTranslation();
  const { width, fontScale } = useWindowDimensions();
  const available = effectiveWidth(width, fontScale);
  const tabs = MAIN_TABS.filter(tab => tab.implemented);
  if (!onSelect) {
    const groupColumns =
      available >= 1150 ? 5 : available >= 780 ? 3 : available >= 520 ? 2 : 1;
    return (
      <View style={styles.grid} testID="tool-directory">
        {TOOL_GROUPS.map(group => (
          <View key={group.label} style={[styles.cell, { width: `${100 / groupColumns}%` }]}>
            <View style={styles.group}>
              <Text accessibilityRole="header" style={styles.groupTitle}>
                {group.label}
              </Text>
              {tabs
                .filter(tab => group.tabs.includes(tab.key))
                .map(tab => (
                  <View
                    key={tab.key}
                    style={styles.directoryRow}
                    testID={`tool-directory-${tab.key}`}
                  >
                    <Icon name={TAB_ICONS[tab.key]} size={18} color={colors.textMuted} />
                    <Text style={styles.directoryLabel}>{t(tab.labelKey)}</Text>
                  </View>
                ))}
            </View>
          </View>
        ))}
      </View>
    );
  }

  const columns = compact
    ? available >= 620
      ? 2
      : 1
    : available >= 1100
    ? 4
    : available >= 760
    ? 3
    : available >= 520
    ? 2
    : 1;
  return (
    <View style={styles.grid} testID="tool-directory">
      {tabs.map(tab => (
        <View
          key={tab.key}
          style={[styles.cell, { width: `${100 / columns}%` }]}
          testID={`tool-directory-${tab.key}`}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(tab.labelKey)}
            accessibilityHint={DESCRIPTIONS[tab.key]}
            accessibilityState={{ selected: activeTab === tab.key }}
            onPress={() => onSelect(tab.key)}
            testID={`tool-select-${tab.key}`}
            style={state => {
              const { hovered, pressed } = readInteraction(state);
              return [
                styles.card,
                activeTab === tab.key && styles.selected,
                (hovered || pressed) && styles.hovered,
              ];
            }}
          >
            <Icon name={TAB_ICONS[tab.key]} size={22} color={colors.accentStrong} />
            <Text style={styles.title}>{t(tab.labelKey)}</Text>
            <Icon
              name={activeTab === tab.key ? 'check' : 'chevron-forward'}
              size={18}
              color={colors.accentStrong}
            />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  cell: { padding: 5 },
  card: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 58,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  selected: {
    borderColor: colors.accentStrong,
    backgroundColor: colors.accentSoft,
  },
  hovered: {
    backgroundColor: colors.surfaceHover,
    borderColor: colors.accentStrong,
  },
  group: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  groupTitle: {
    ...typography.heading,
    color: colors.accentStrong,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  directoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 6,
  },
  directoryLabel: { ...typography.body, color: colors.textPrimary, flexShrink: 1 },
  title: { ...typography.bodyStrong, color: colors.textPrimary, flex: 1 },
});
