import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MAIN_TABS, type MainTabKey } from '../../../navigation/tabs';
import { Icon } from '../../icons';
import {
  colors,
  effectiveWidth,
  radii,
  spacing,
  typography,
} from '../../theme';
import { readInteraction } from '../controls/interaction';
import { TAB_ICONS } from './tabIcons';

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
      {MAIN_TABS.filter(tab => tab.implemented).map(tab => {
        const content = (
          <>
            <View style={styles.icon}>
              <Icon
                name={TAB_ICONS[tab.key]}
                size={22}
                color={colors.accentStrong}
              />
            </View>
            <View style={styles.copy}>
              <Text style={styles.title}>{t(tab.labelKey)}</Text>

            </View>
            {onSelect ? (
              <Icon
                name={activeTab === tab.key ? 'check' : 'chevron-forward'}
                size={18}
                color={colors.accentStrong}
              />
            ) : null}
          </>
        );
        const sizing = { width: `${100 / columns}%` as `${number}%` };
        return (
          <View
            key={tab.key}
            style={[styles.cell, sizing]}
            testID={`tool-directory-${tab.key}`}
          >
            {onSelect ? (
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
                {content}
              </Pressable>
            ) : (
              <View style={styles.card}>{content}</View>
            )}
          </View>
        );
      })}
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
  icon: {
    width: 34,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copy: { flex: 1, gap: 3, minWidth: 0 },
  title: { ...typography.bodyStrong, color: colors.textPrimary },
  description: { ...typography.caption, color: colors.textSecondary },
});
