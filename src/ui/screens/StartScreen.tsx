import {
  WorkbenchScrollView,
  WorkbenchBlock,
} from '../components/workbench/Workbench';
import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
} from 'react-native';
import type { RootStackParamList } from '../../navigation/types';
import { BrandLogo, BRAND_PRODUCT_NAME, BRAND_PRODUCT_TAGLINE } from '../brand';
import { Icon, type IconName } from '../icons';
import {
  HomeConnectNotice,
  HomeConnectPicker,
  HomeConnectStatus,
} from '../components/home/HomeConnect';
import { ToolDirectory } from '../components/navigation/ToolDirectory';
import { readInteraction } from '../components/controls/interaction';
import {
  connectionNotice,
  useConnectionNotice,
  useDirectConnect,
  useVerifiedFcConnection,
} from '../session';
import {
  colors,
  contentEnvelope,
  isDesktopTier,
  noticeSurface,
  resolveLayoutTier,
  PROSE_MEASURE,
  radii,
  spacing,
  typography,
} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Start'>;

function ActionCard({
  title,
  description,
  label,
  testID,
  icon,
  secondary,
  desktop,
  onPress,
}: {
  title: string;
  description: string;
  label: string;
  testID: string;
  icon: IconName;
  secondary?: boolean;
  desktop: boolean;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <WorkbenchBlock
      style={[styles.actionCard, secondary && styles.secondaryCard, desktop && styles.actionCardShare]}
      section="actionCard"
    >
      <WorkbenchBlock style={styles.cardHeading} section="cardHeading">
        <WorkbenchBlock style={styles.cardIcon} section="cardIcon">
          <Icon name={icon} size={28} color={colors.accentStrong} />
        </WorkbenchBlock>
        <Text style={styles.cardTitle}>{title}</Text>
      </WorkbenchBlock>
      <Text style={styles.body}>{description}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        testID={testID}
        style={state => {
          const { hovered, pressed } = readInteraction(state);
          return [
            styles.action,
            secondary && styles.secondaryAction,
            hovered &&
              (secondary ? styles.secondaryHovered : styles.actionHovered),
            pressed && styles.pressed,
          ];
        }}
      >
        <Text style={[styles.actionText, secondary && styles.secondaryText]}>
          {label}
        </Text>
        <Icon
          name="chevron-forward"
          size={20}
          color={secondary ? colors.accentStrong : colors.accentText}
        />
      </Pressable>
    </WorkbenchBlock>
  );
}

/** All connection decisions still use the shared verified-session boundary. */
export default function StartScreen({ navigation }: Props): React.JSX.Element {
  const { width, fontScale } = useWindowDimensions();
  const tier = resolveLayoutTier(width, fontScale);
  const desktop = isDesktopTier(tier);
  const contentCap = contentEnvelope(tier, true);
  const connection = useVerifiedFcConnection();
  const { phase, begin, choose, dismiss } = useDirectConnect();
  const notice = useConnectionNotice();
  const openConfiguration = React.useCallback(() => {
    connectionNotice.clear();
    if (connection.kind === 'CONNECTED') {
      navigation.navigate('Setup', { sessionKey: connection.sessionKey });
      return;
    }
    // Keep requestPort() in the originating user gesture.
    begin();
  }, [begin, connection, navigation]);
  const dismissConnection = () => {
    connectionNotice.clear();
    dismiss();
  };

  return (
    <WorkbenchScrollView
      testID="start-screen"
      style={styles.root}
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled"
      workspace="Start"
    >
      <WorkbenchBlock
        style={styles.heroBand}
        testID="start-identity"
        section="heroBand"
      >
        <WorkbenchBlock
          style={[styles.container, styles.hero, { maxWidth: contentCap }]}
          section="container"
        >
          {Platform.OS !== 'web' ? (
            <WorkbenchBlock style={styles.nativeBrand} section="nativeBrand">
              <BrandLogo height={64} testID="start-brand-logo" />
              <WorkbenchBlock style={styles.brandCopy} section="brandCopy">
                <Text style={styles.brandName}>{BRAND_PRODUCT_NAME}</Text>
                <Text style={styles.body}>{BRAND_PRODUCT_TAGLINE}</Text>
              </WorkbenchBlock>
            </WorkbenchBlock>
          ) : null}
          <Text accessibilityRole="header" style={[styles.heroTitle, desktop && styles.heroTitleDesktop]}>
            Vluchtcontroller configureren
          </Text>
        </WorkbenchBlock>
      </WorkbenchBlock>
      <WorkbenchBlock
        style={[styles.container, { maxWidth: contentCap }]}
        section="container"
      >
        <HomeConnectNotice
          phase={phase}
          notice={notice}
          onRetry={openConfiguration}
          onDismiss={dismissConnection}
        />
        <WorkbenchBlock style={styles.sectionHeading} section="sectionHeading">
          <WorkbenchBlock style={styles.sectionCopy} section="sectionCopy">
            <Text accessibilityRole="header" style={styles.sectionTitle}>Verbinding & firmware</Text>
          </WorkbenchBlock>
          <WorkbenchBlock
            style={styles.connectionBadge}
            testID="start-connection-state"
            section="connectionBadge"
          >
            <Icon
              name={connection.kind === 'CONNECTED' ? 'check' : 'cable'}
              size={17}
              color={
                connection.kind === 'CONNECTED'
                  ? colors.success
                  : colors.textMuted
              }
            />
            <Text style={styles.caption}>
              {connection.kind === 'CONNECTED'
                ? 'Vluchtcontroller verbonden'
                : 'Geen vluchtcontroller verbonden'}
            </Text>
          </WorkbenchBlock>
        </WorkbenchBlock>
        <WorkbenchBlock
          style={desktop ? styles.actionRow : styles.actionColumn}
          testID="start-route-group"
          section="actionRow"
        >
          <ActionCard
            title="Drone configureren"
            description="Verbinding, kalibratie en bordinformatie"
            label="Vluchtcontroller verbinden"
            testID="start-configure"
            icon="sliders-horizontal"
            desktop={desktop}
            onPress={openConfiguration}
          />
          <ActionCard
            title="Firmware bijwerken"
            description="Firmware selecteren · Flashen · Herstel"
            label="Firmware openen"
            testID="start-firmware"
            icon="cpu"
            desktop={desktop}
            secondary
            onPress={() => navigation.navigate('FirmwareFlasher')}
          />
        </WorkbenchBlock>
        <HomeConnectStatus
          phase={phase}
          onRetry={openConfiguration}
          onDismiss={dismissConnection}
        />
        <WorkbenchBlock style={styles.safety} section="safety">
          <Icon name="shield" size={20} color={colors.accentStrong} />
          <Text style={styles.safetyText}>
            Verwijder de propellers vóór motortests.
          </Text>
        </WorkbenchBlock>
      </WorkbenchBlock>
      <WorkbenchBlock style={styles.directoryBand} section="directoryBand">
        <WorkbenchBlock
          style={[styles.container, { maxWidth: contentCap }]}
          section="container"
        >
          <WorkbenchBlock style={styles.sectionCopy} section="sectionCopy">
            <Text accessibilityRole="header" style={styles.sectionTitle}>Configuratieonderdelen</Text>
          </WorkbenchBlock>
          <ToolDirectory />
        </WorkbenchBlock>
      </WorkbenchBlock>
      <WorkbenchBlock
        style={[styles.container, { maxWidth: contentCap }]}
        testID="start-guide-section"
        section="container"
      >
        <WorkbenchBlock
          style={[styles.guide, desktop && styles.guideRow]}
          section="guide"
        >
          <WorkbenchBlock style={styles.guideCopy} section="guideCopy">
            <Text accessibilityRole="header" style={styles.sectionTitle}>Vliegstijl & afstelling</Text>

            <Text style={styles.caption}>
              Cinematic · Freestyle · Racing · Tiny Whoop · Long Range
            </Text>
          </WorkbenchBlock>
          <Pressable
            testID="start-flight-style-guide"
            accessibilityRole="button"
            accessibilityLabel="Vliegstijlgidsen openen"
            onPress={() => navigation.navigate('FlightStyleGuide')}
            style={state => [
              styles.action,
              styles.secondaryAction,
              readInteraction(state).hovered && styles.secondaryHovered,
              state.pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.actionText, styles.secondaryText]}>
              Vliegstijlgidsen openen
            </Text>
            <Icon
              name="chevron-forward"
              size={20}
              color={colors.accentStrong}
            />
          </Pressable>
        </WorkbenchBlock>
      </WorkbenchBlock>
      <HomeConnectPicker phase={phase} onChoose={choose} onDismiss={dismiss} />
    </WorkbenchScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  page: { width: '100%', paddingBottom: spacing.xl },
  container: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  heroBand: {
    backgroundColor: colors.backgroundRaised,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  hero: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  nativeBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  brandCopy: { flex: 1, minWidth: 0 },
  brandName: { ...typography.title, color: colors.textPrimary },
  heroTitle: {
    ...typography.display,
    fontSize: 26,
    lineHeight: 34,
    color: colors.textPrimary,
    maxWidth: 960,
  },
  heroTitleDesktop: { fontSize: 32, lineHeight: 40 },
  sectionHeading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sectionCopy: { gap: spacing.sm, flexShrink: 1 },
  sectionTitle: { ...typography.title, color: colors.textPrimary },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    maxWidth: PROSE_MEASURE,
  },
  caption: { ...typography.caption, color: colors.textMuted, flexShrink: 1 },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxWidth: '100%',
  },
  actionRow: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.lg },
  actionColumn: { gap: spacing.lg },
  actionCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  secondaryCard: { borderLeftColor: colors.borderStrong },
  actionCardShare: { flexGrow: 1, flexShrink: 1, flexBasis: 0 },
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  cardTitle: { ...typography.title, color: colors.textPrimary, flexShrink: 1 },
  action: {
    alignSelf: 'flex-start',
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radii.sm,
    backgroundColor: colors.accent,
    maxWidth: '100%',
  },
  actionText: { ...typography.label, color: colors.accentText, flexShrink: 1 },
  secondaryAction: {
    backgroundColor: 'transparent',
    borderColor: colors.borderStrong,
  },
  secondaryText: { color: colors.accentStrong },
  actionHovered: { backgroundColor: colors.accentHover },
  secondaryHovered: {
    backgroundColor: colors.surfaceHover,
    borderColor: colors.accent,
  },
  pressed: { opacity: 0.8 },
  safety: {
    ...noticeSurface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.warningSoft,
  },
  safetyText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    maxWidth: PROSE_MEASURE,
  },
  directoryBand: {
    backgroundColor: colors.backgroundRaised,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderSoft,
  },
  guide: {
    padding: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xl,
  },
  guideRow: { flexDirection: 'row', alignItems: 'center' },
  guideCopy: { flex: 1, gap: spacing.sm },
});
