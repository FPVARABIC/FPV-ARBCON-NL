import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
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
  bullets,
  label,
  testID,
  icon,
  secondary,
  desktop,
  onPress,
}: {
  title: string;
  description: string;
  bullets: readonly string[];
  label: string;
  testID: string;
  icon: IconName;
  secondary?: boolean;
  desktop: boolean;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <View style={[styles.actionCard, desktop && styles.actionCardShare]}>
      <View style={styles.cardHeading}>
        <View style={styles.cardIcon}>
          <Icon name={icon} size={28} color={colors.accentStrong} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={styles.body}>{description}</Text>
      <View style={styles.bullets}>
        {bullets.map(item => (
          <View key={item} style={styles.bullet}>
            <Icon name="check" size={17} color={colors.accentStrong} />
            <Text style={styles.bulletText}>{item}</Text>
          </View>
        ))}
      </View>
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
    </View>
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
    <ScrollView
      testID="start-screen"
      style={styles.root}
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.heroBand} testID="start-identity">
        <View style={[styles.container, styles.hero, {maxWidth: contentCap}]}>
          {Platform.OS !== 'web' ? (
            <View style={styles.nativeBrand}>
              <BrandLogo height={64} testID="start-brand-logo" />
              <View style={styles.brandCopy}>
                <Text style={styles.brandName}>{BRAND_PRODUCT_NAME}</Text>
                <Text style={styles.body}>{BRAND_PRODUCT_TAGLINE}</Text>
              </View>
            </View>
          ) : null}
          <Text style={styles.eyebrow}>WERKBANK</Text>
          <Text style={[styles.heroTitle, desktop && styles.heroTitleDesktop]}>
            Vluchtcontroller configureren
          </Text>
        </View>
      </View>
      <View style={[styles.container, {maxWidth: contentCap}]}>
        <HomeConnectNotice
          phase={phase}
          notice={notice}
          onRetry={openConfiguration}
          onDismiss={dismissConnection}
        />
        <View style={styles.sectionHeading}>
          <View style={styles.sectionCopy}>

            <Text style={styles.sectionTitle}>Verbinding & firmware</Text>
          </View>
          <View style={styles.connectionBadge} testID="start-connection-state">
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
          </View>
        </View>
        <View
          style={desktop ? styles.actionRow : styles.actionColumn}
          testID="start-route-group"
        >
          <ActionCard
            title="Drone configureren"
            description="USB · Configuratie en diagnose"
            bullets={[
              'Verbinding, kalibratie en bordinformatie',
              'Motoren, ontvanger en OSD',
              'GPS, sensoren en CLI',
            ]}
            label="Vluchtcontroller verbinden"
            testID="start-configure"
            icon="sliders-horizontal"
            desktop={desktop}
            onPress={openConfiguration}
          />
          <ActionCard
            title="Firmware bijwerken"
            description="Firmware selecteren · Flashen · Herstel"
            bullets={[
              'Bord, target en versie selecteren',
              'Officiële bouwopties of een lokaal bestand',
              'DFU-flashen en herstelgereedschappen',
            ]}
            label="Firmware openen"
            testID="start-firmware"
            icon="cpu"
            desktop={desktop}
            secondary
            onPress={() => navigation.navigate('FirmwareFlasher')}
          />
        </View>
        <HomeConnectStatus
          phase={phase}
          onRetry={openConfiguration}
          onDismiss={dismissConnection}
        />
        <View style={styles.safety}>
          <Icon name="shield" size={20} color={colors.accentStrong} />
          <Text style={styles.safetyText}>
            Instellingen worden pas geschreven na de vereiste controles.
            Verwijder de propellers vóór motortests.
          </Text>
        </View>
      </View>
      <View style={styles.directoryBand}>
        <View style={[styles.container, {maxWidth: contentCap}]}>
          <View style={styles.sectionCopy}>
            <Text style={styles.eyebrow}>ALLE GEREEDSCHAPPEN</Text>
            <Text style={styles.sectionTitle}>
              Configuratieonderdelen
            </Text>

          </View>
          <ToolDirectory />
        </View>
      </View>
      <View style={[styles.container, {maxWidth: contentCap}]} testID="start-guide-section">
        <View style={[styles.guide, desktop && styles.guideRow]}>
          <View style={styles.guideCopy}>
            <Text style={styles.eyebrow}>VLIEGSTIJLGIDSEN</Text>
            <Text style={styles.sectionTitle}>Vliegstijl & afstelling</Text>

            <Text style={styles.caption}>
              Cinematic · Freestyle · Racing · Tiny Whoop · Long Range
            </Text>
          </View>
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
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerName}>{BRAND_PRODUCT_NAME}</Text>
          <Text style={styles.caption}>
            Nederlandse editie · Configuratie, firmware en diagnose
          </Text>
        </View>
      </View>
      <HomeConnectPicker phase={phase} onChoose={choose} onDismiss={dismiss} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  page: { width: '100%', paddingBottom: spacing.xl },
  container: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
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
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  goldRule: { height: 3, width: 26, backgroundColor: colors.accent },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.accentStrong,
    letterSpacing: 1.3,
  },
  heroTitle: {
    ...typography.display,
    fontSize: 26,
    lineHeight: 34,
    color: colors.textPrimary,
    maxWidth: 960,
  },
  heroTitleDesktop: { fontSize: 32, lineHeight: 40 },
  intro: {
    ...typography.body,
    fontSize: 17,
    lineHeight: 28,
    color: colors.textSecondary,
    maxWidth: 700,
  },
  heroMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaText: { ...typography.caption, color: colors.textSecondary },
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
    borderTopColor: colors.accent,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    gap: spacing.md,
  },
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
  bullets: { gap: spacing.sm, paddingVertical: spacing.sm, flexGrow: 1 },
  bullet: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bulletText: { ...typography.body, color: colors.textSecondary, flex: 1 },
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
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: spacing.xl,
    gap: 3,
  },
  footerName: { ...typography.label, color: colors.textPrimary },
});
