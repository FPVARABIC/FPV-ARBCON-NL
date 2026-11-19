import {
  WorkbenchScrollView,
  WorkbenchBlock,
} from '../components/workbench/Workbench';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  filterCompatiblePresets,
  type FirmwarePresetCategory,
  type FirmwarePresetStatus,
  type FirmwarePresetSummary,
} from '../../core';
import {
  firmwarePresetRepository,
  rawCliSessionController,
  type CliBatchResult,
  type LoadedFirmwarePreset,
  type SetupUiSessionKey,
} from '../../platforms/react-native/protocol';
import {
  PROSE_MEASURE,
  colors,
  radii,
  spacing,
  typography,
  useContentEnvelope,
} from '../theme';
import { MIN_TOUCH_TARGET } from '../components/controls';
import { Icon } from '../icons';

export type PresetsRepositoryPort = Pick<
  typeof firmwarePresetRepository,
  'loadIndex' | 'loadFirmwareVersion' | 'loadPreset' | 'commands'
>;

export type PresetsCliPort = Pick<
  typeof rawCliSessionController,
  | 'getPhase'
  | 'begin'
  | 'captureDiffAll'
  | 'saveTextFile'
  | 'executeBatch'
  | 'saveAndClose'
  | 'exitWithoutSave'
>;

interface Props {
  readonly sessionKey?: SetupUiSessionKey;
  readonly active: boolean;
  readonly onCliBusyChange: (busy: boolean) => void;
  readonly repository?: PresetsRepositoryPort;
  readonly cli?: PresetsCliPort;
}
const CATEGORY_LABEL: Record<FirmwarePresetCategory, string> = {
  TUNE: 'Tune',
  RATES: 'Rates',
  OSD: 'OSD',
  VTX: 'VTX',
  LEDS: 'LEDs',
  MODES: 'Vliegmodi',
  FILTERS: 'Filters',
  RC_LINK: 'RC Link',
  BNF: 'BNF',
  OTHER: 'Overig',
};
/**
 * The catalogue's provenance words, in Arabic. They used to render raw
 * ("OFFICIAL", "EXPERIMENTAL") to an operator reading an Arabic screen, and
 * EXPERIMENTAL in particular is a safety signal about a tune that will be
 * written to a flight controller - it deserves to be legible and to look
 * different from the other two, not to be a grey pill in another language.
 */
const STATUS_LABEL: Record<FirmwarePresetStatus, string> = {
  OFFICIAL: 'Officieel',
  COMMUNITY: 'Community',
  EXPERIMENTAL: 'Experimenteel',
};
const ALL_CATEGORIES: readonly FirmwarePresetCategory[] = [
  'TUNE',
  'RATES',
  'FILTERS',
  'RC_LINK',
  'MODES',
  'OSD',
  'VTX',
  'LEDS',
  'BNF',
  'OTHER',
];
function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function PresetsScreen({
  sessionKey,
  active,
  onCliBusyChange,
  repository = firmwarePresetRepository,
  cli = rawCliSessionController,
}: Props): React.JSX.Element {
  const { t } = useTranslation();
  const { maxWidth } = useContentEnvelope(true);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<string>();
  const [firmwareVersion, setFirmwareVersion] = useState<string>();
  const [presets, setPresets] = useState<readonly FirmwarePresetSummary[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<FirmwarePresetCategory | 'ALL'>(
    'ALL',
  );
  const [selected, setSelected] = useState<FirmwarePresetSummary>();
  const [loaded, setLoaded] = useState<LoadedFirmwarePreset>();
  const [selectedOptions, setSelectedOptions] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [backupReady, setBackupReady] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [batch, setBatch] = useState<CliBatchResult>();
  const [cliOpen, setCliOpen] = useState(false);
  const [status, setStatus] = useState(
    'Kies een preset voor de aangesloten vluchtcontroller.',
  );
  const setBusy = useCallback(
    (busy: boolean) => onCliBusyChange(busy),
    [onCliBusyChange],
  );
  /* WHICH AIRCRAFT IS ON SCREEN RIGHT NOW.
     The staleness test has to be about the SESSION, not about the
     effect: the fetch effect below re-runs when `loading` flips, so a
     guard tied to the effect's own lifetime cancelled the very fetch
     that had just set `loading` and the screen sat on «تحميل…» for
     ever. That is what the regression alongside this file caught. */
  const currentSession = useRef(sessionKey);
  currentSession.current = sessionKey;

  const loadCatalog = useCallback(async () => {
    if (!sessionKey) return;
    const askedFor = sessionKey;
    const isStale = (): boolean => currentSession.current !== askedFor;
    setLoading(true);
    setFailure(undefined);
    setSelected(undefined);
    setLoaded(undefined);
    try {
      const [index, version] = await Promise.all([
        repository.loadIndex(),
        repository.loadFirmwareVersion(sessionKey),
      ]);
      /* THE CATALOGUE IS FILTERED BY THIS AIRCRAFT'S FIRMWARE.
         `loadFirmwareVersion` is a read of the connected board, so an
         answer that arrives after the operator swapped aircraft would
         list packages "compatible with" a firmware version the board in
         front of them is not running. Dropped, exactly as every
         configuration screen drops a stale read. */
      if (isStale()) return;
      const compatible = filterCompatiblePresets(index, version.versionString);
      setFirmwareVersion(version.versionString);
      setPresets(compatible);
      // A dropped entry is one we refused to make downloadable - an unsafe
      // path or a bad hash. The operator is told, rather than shown a quietly
      // shorter list.
      const dropped =
        index.rejectedCount > 0
          ? ` ${index.rejectedCount} vermeldingen zijn overgeslagen omdat de hash of het pad niet overeenkwam.`
          : '';
      setStatus(
        compatible.length
          ? `Compatibele presets voor ${version.versionString}: ${compatible.length}.${dropped}`
          : `Voor firmware ${version.versionString} zijn geen pakketten gevonden.${dropped}`,
      );
    } catch (error) {
      if (isStale()) return;
      setFailure(errorText(error));
    } finally {
      if (!isStale()) setLoading(false);
    }
  }, [repository, sessionKey]);
  /**
   * ONE FETCH PER AIRCRAFT, AND A NEW ONE WHEN THE AIRCRAFT CHANGES.
   *
   * This used to decide whether to fetch by asking whether `presets` was
   * empty, and that reads two completely different situations as the
   * same one:
   *
   *   - nothing has been fetched yet, and
   *   - the official index was fetched and holds NOTHING compatible with
   *     this firmware.
   *
   * The second is an ordinary outcome the screen even has a sentence for
   * («لا توجد حزم في المصدر الرسمي للإصدار …»), and after it the
   * condition was true again: the screen re-fetched the index, got the
   * same empty answer, and re-fetched, without end. Measured against the
   * unmodified screen: the index request never stopped repeating.
   *
   * It also never re-fetched when the SESSION changed, because by then
   * `presets` was not empty - so a list built for the previous board's
   * firmware stayed on screen, presented as fitting the new one.
   *
   * Remembering which aircraft was actually asked answers both: one
   * fetch per aircraft, a fresh one per aircraft, and none in between.
   */
  const fetchedFor = useRef<typeof sessionKey | undefined>(undefined);
  useEffect(() => {
    if (!active || sessionKey === undefined) return;
    if (fetchedFor.current === sessionKey) return;
    fetchedFor.current = sessionKey;
    setPresets([]);
    setFirmwareVersion(undefined);
    setSelected(undefined);
    setLoaded(undefined);
    setStatus('Kies een preset voor de aangesloten vluchtcontroller.');
    loadCatalog().catch(() => undefined);
  }, [active, loadCatalog, sessionKey]);
  useEffect(
    () => () => {
      if (cli.getPhase() !== 'IDLE')
        cli.exitWithoutSave().catch(() => undefined);
    },
    [cli],
  );
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return presets.filter(
      preset =>
        (category === 'ALL' || preset.category === category) &&
        (!needle ||
          [preset.title, preset.author ?? '', ...preset.keywords]
            .join(' ')
            .toLowerCase()
            .includes(needle)),
    );
  }, [category, presets, query]);
  const choosePreset = useCallback(
    async (preset: FirmwarePresetSummary) => {
      setSelected(preset);
      setLoaded(undefined);
      setDetailsLoading(true);
      setFailure(undefined);
      setBackupReady(false);
      setBatch(undefined);
      try {
        const detail = await repository.loadPreset(preset);
        setLoaded(detail);
        setSelectedOptions(
          new Set(
            detail.document.options
              .filter(option => option.checkedByDefault)
              .map(option => option.name),
          ),
        );
        setStatus(
          'Bestand gecontroleerd. Bekijk de opties en opdrachten voordat je de preset toepast.',
        );
      } catch (error) {
        setFailure(errorText(error));
      } finally {
        setDetailsLoading(false);
      }
    },
    [repository],
  );
  const toggleOption = useCallback(
    (name: string) => {
      if (!loaded) return;
      setSelectedOptions(current => {
        const next = new Set(current);
        const option = loaded.document.options.find(item => item.name === name);
        if (next.has(name)) next.delete(name);
        else {
          if (option?.exclusive && option.group)
            for (const sibling of loaded.document.options)
              if (sibling.group === option.group) next.delete(sibling.name);
          next.add(name);
        }
        return next;
      });
    },
    [loaded],
  );
  const commands = useMemo(
    () => (loaded ? repository.commands(loaded, selectedOptions) : []),
    [loaded, repository, selectedOptions],
  );
  const createBackup = useCallback(async () => {
    if (!sessionKey) return;
    setBusy(true);
    setFailure(undefined);
    setStatus('Configuratieback-up maken met diff all…');
    try {
      await cli.begin(sessionKey);
      const backup = await cli.captureDiffAll();
      const saved = await cli.saveTextFile(
        `fpv-arbcon-backup-${firmwareVersion ?? 'unknown'}.txt`,
        backup,
      );
      if (!saved) throw new Error('De back-up is niet opgeslagen.');
      await cli.exitWithoutSave();
      setBackupReady(true);
      setStatus(
        'Back-up opgeslagen. Je kunt de preset nu tijdelijk toepassen.',
      );
    } catch (error) {
      await cli.exitWithoutSave().catch(() => undefined);
      setFailure(errorText(error));
    } finally {
      setBusy(false);
    }
  }, [cli, firmwareVersion, sessionKey, setBusy]);
  const applyNow = useCallback(async () => {
    if (!sessionKey || !loaded || !backupReady || commands.length === 0) return;
    setBusy(true);
    setFailure(undefined);
    setBatch(undefined);
    setProgress({ done: 0, total: commands.length });
    setStatus('CLI-opdrachten uitvoeren…');
    try {
      await cli.begin(sessionKey);
      setCliOpen(true);
      const result = await cli.executeBatch(commands, (done, total) =>
        setProgress({ done, total }),
      );
      setBatch(result);
      setStatus(
        result.errors.length
          ? `CLI-fouten: ${result.errors.length}. Sluit af zonder op te slaan.`
          : 'Preset tijdelijk toegepast. Controleer het resultaat en kies of je de wijzigingen wilt opslaan.',
      );
    } catch (error) {
      setCliOpen(false);
      setBusy(false);
      setFailure(errorText(error));
    }
  }, [backupReady, cli, commands, loaded, sessionKey, setBusy]);
  const confirmApply = useCallback(() => {
    if (!loaded) return;
    const warning = loaded.completeWarning.trim();
    Alert.alert(
      'Preset tijdelijk toepassen?',
      `${warning ? `${warning}\n\n` : ''}De vluchtcontroller voert ${commands.length} CLI-opdrachten uit. Opslaan volgt pas na bevestiging. Verwijder eerst de propellers.`,
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Tijdelijk toepassen',
          style: 'destructive',
          onPress: () => applyNow().catch(() => undefined),
        },
      ],
    );
  }, [applyNow, commands.length, loaded]);
  const closeWithoutSave = useCallback(async () => {
    try {
      await cli.exitWithoutSave();
      setStatus(
        'CLI afgesloten zonder op te slaan.',
      );
    } catch (error) {
      setFailure(errorText(error));
    } finally {
      setCliOpen(false);
      setBusy(false);
    }
  }, [cli, setBusy]);
  const save = useCallback(async () => {
    try {
      await cli.saveAndClose();
      setStatus(
        'Opslagopdracht verzonden. Verbind opnieuw zodra de vluchtcontroller is herstart.',
      );
      setBackupReady(false);
    } catch (error) {
      setFailure(errorText(error));
      return;
    } finally {
      setCliOpen(false);
      setBusy(false);
    }
  }, [cli, setBusy]);
  return (
    <WorkbenchBlock style={styles.root} testID="presets-screen" section="root">
      <WorkbenchScrollView
        contentContainerStyle={[styles.content, { maxWidth }]}
        workspace="Presets"
      >
        <WorkbenchBlock style={styles.hero} section="hero" heading>
          <Text style={styles.title}>{'Presets'}</Text>

          <WorkbenchBlock style={styles.identityRow} section="identityRow">
            <Text style={styles.identity}>
              Firmware: {firmwareVersion ?? '—'}
            </Text>
          </WorkbenchBlock>
        </WorkbenchBlock>
        {failure ? (
          <WorkbenchBlock style={styles.error} section="error">
            <Text style={styles.errorText}>{failure}</Text>
          </WorkbenchBlock>
        ) : null}
        <WorkbenchBlock style={styles.toolbar} section="toolbar">
          <TextInput
            value={query}
            onChangeText={setQuery}
            accessibilityLabel="Presets zoeken"
            placeholder="Zoek op naam, auteur of trefwoord"
            placeholderTextColor={colors.textMuted}
            style={styles.search}
            editable={!cliOpen}
          />
          <Pressable
            testID="presets-reload"
            style={styles.reload}
            onPress={() => loadCatalog().catch(() => undefined)}
            disabled={loading || cliOpen}
          >
            <Text style={styles.reloadText}>
              {loading ? 'Laden…' : 'Lijst vernieuwen'}
            </Text>
          </Pressable>
        </WorkbenchBlock>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        >
          <Pressable
            onPress={() => setCategory('ALL')}
            style={[styles.chip, category === 'ALL' && styles.chipOn]}
          >
            <Text style={styles.chipText}>{'Alles'}</Text>
          </Pressable>
          {ALL_CATEGORIES.map(item => (
            <Pressable
              key={item}
              onPress={() => setCategory(item)}
              style={[styles.chip, category === item && styles.chipOn]}
            >
              <Text style={styles.chipText}>{CATEGORY_LABEL[item]}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <WorkbenchBlock style={styles.workspace} section="workspace">
          <WorkbenchBlock style={styles.list} section="list">
            <Text style={styles.sectionTitle}>
              {'Compatibele presets ('}
              {filtered.length})
            </Text>
            {filtered.slice(0, 160).map(preset => (
              <Pressable
                key={preset.fullPath}
                testID={`preset-${preset.fullPath}`}
                onPress={() => choosePreset(preset).catch(() => undefined)}
                style={[
                  styles.preset,
                  selected?.fullPath === preset.fullPath && styles.presetOn,
                ]}
              >
                <WorkbenchBlock style={styles.badges} section="badges">
                  <Text style={styles.badge}>
                    {CATEGORY_LABEL[preset.category]}
                  </Text>
                  <Text
                    style={[
                      styles.badge,
                      preset.status === 'EXPERIMENTAL' && styles.badgeWarn,
                    ]}
                  >
                    {STATUS_LABEL[preset.status]}
                  </Text>
                </WorkbenchBlock>
                <Text style={styles.presetTitle}>{preset.title}</Text>
                <Text style={styles.meta}>
                  {preset.author ? `${preset.author} · ` : ''}
                  {preset.firmwareVersions.join(', ')}
                </Text>
              </Pressable>
            ))}
          </WorkbenchBlock>
          <WorkbenchBlock style={styles.detail} section="detail">
            <Text style={styles.sectionTitle}>
              {'Wijzigingen bekijken'}
            </Text>
            {detailsLoading ? (
              <Text style={styles.hint}>
                {
                  'Preset downloaden en bestand controleren…'
                }
              </Text>
            ) : null}
            {!loaded ? (
              <Text style={styles.hint}>
                {'Selecteer een preset om de opties en wijzigingen te bekijken.'}
              </Text>
            ) : (
              <>
                <Text style={styles.detailTitle}>{loaded.summary.title}</Text>
                {loaded.document.descriptions.map((line, index) => (
                  <Text key={index} style={styles.description}>
                    {line || ' '}
                  </Text>
                ))}
                {loaded.completeWarning ? (
                  <WorkbenchBlock style={styles.warning} section="warning">
                    <Text style={styles.warningText}>
                      {loaded.completeWarning}
                    </Text>
                  </WorkbenchBlock>
                ) : null}
                {loaded.document.options.length ? (
                  <WorkbenchBlock style={styles.options} section="options">
                    <Text style={styles.subhead}>{'Keuzes.'}</Text>
                    {loaded.document.options.map(option => (
                      <Pressable
                        key={option.name}
                        testID={`preset-option-${option.name}`}
                        onPress={() => toggleOption(option.name)}
                        accessibilityRole={
                          option.exclusive ? 'radio' : 'checkbox'
                        }
                        accessibilityLabel={option.name}
                        accessibilityState={{
                          checked: selectedOptions.has(option.name),
                          selected: selectedOptions.has(option.name),
                        }}
                        aria-checked={selectedOptions.has(option.name)}
                        style={[
                          styles.option,
                          selectedOptions.has(option.name) && styles.optionOn,
                        ]}
                      >
                        <Icon
                          name={
                            selectedOptions.has(option.name)
                              ? 'circle-check'
                              : 'circle'
                          }
                          size={20}
                          color={
                            selectedOptions.has(option.name)
                              ? colors.accentStrong
                              : colors.textMuted
                          }
                        />
                        <WorkbenchBlock
                          style={styles.optionCopy}
                          section="optionCopy"
                        >
                          <Text style={styles.optionName}>{option.name}</Text>
                          {option.group ? (
                            <Text style={styles.meta}>
                              {option.group}
                              {option.exclusive ? '• Eén keuze' : ''}
                            </Text>
                          ) : null}
                        </WorkbenchBlock>
                      </Pressable>
                    ))}
                  </WorkbenchBlock>
                ) : null}
                <WorkbenchBlock
                  style={styles.commandSummary}
                  section="commandSummary"
                >
                  <Text style={styles.commandCount}>{commands.length}</Text>
                  <Text style={styles.hint}>
                    {'CLI-opdrachten voor de geselecteerde opties'}
                  </Text>
                </WorkbenchBlock>
                <Pressable
                  testID="presets-backup"
                  style={[styles.primary, cliOpen && styles.disabled]}
                  disabled={cliOpen}
                  onPress={() => createBackup().catch(() => undefined)}
                >
                  <Text style={styles.primaryText}>
                    {backupReady
                      ? 'diff all is opgeslagen.'
                      : 'Back-up opslaan (diff all)'}
                  </Text>
                </Pressable>
                <Pressable
                  testID="presets-apply"
                  style={[
                    styles.apply,
                    (!backupReady || cliOpen || !commands.length) &&
                      styles.disabled,
                  ]}
                  disabled={!backupReady || cliOpen || !commands.length}
                  onPress={confirmApply}
                >
                  <Text style={styles.applyText}>
                    {'Preset tijdelijk toepassen'}
                  </Text>
                </Pressable>
              </>
            )}
          </WorkbenchBlock>
        </WorkbenchBlock>
        {progress.total ? (
          <WorkbenchBlock style={styles.progress} section="progress">
            <WorkbenchBlock
              style={[
                styles.progressFill,
                {
                  width: `${Math.round(
                    (progress.done * 100) / progress.total,
                  )}%`,
                },
              ]}
              section="progressFill"
            />
            <Text style={styles.progressText}>
              {progress.done}/{progress.total}
            </Text>
          </WorkbenchBlock>
        ) : null}
        {cliOpen ? (
          <WorkbenchBlock
            style={styles.decision}
            accessibilityRole="alert"
            section="decision"
          >
            <Text style={styles.decisionTitle}>
              {batch?.errors.length
                ? 'Opslaan geblokkeerd door CLI-fouten'
                : 'Preset tijdelijk actief'}
            </Text>
            {batch?.errors.map((item, index) => (
              <Text key={index} style={styles.cliError}>
                {item.command}:{' '}
                {item.response.replace(/\s+/g, ' ').slice(0, 240)}
              </Text>
            ))}
            <WorkbenchBlock
              style={styles.decisionActions}
              section="decisionActions"
            >
              <Pressable
                testID="presets-discard"
                style={styles.cancel}
                onPress={() => closeWithoutSave().catch(() => undefined)}
              >
                <Text style={styles.cancelText}>
                  {'Afsluiten zonder opslaan'}
                </Text>
              </Pressable>
              <Pressable
                testID="presets-save"
                style={[
                  styles.save,
                  Boolean(batch?.errors.length) && styles.disabled,
                ]}
                disabled={Boolean(batch?.errors.length)}
                onPress={() => save().catch(() => undefined)}
              >
                <Text style={styles.saveText}>
                  {'FC opslaan en herstarten'}
                </Text>
              </Pressable>
            </WorkbenchBlock>
          </WorkbenchBlock>
        ) : null}
        <WorkbenchBlock style={styles.status} section="status">
          <Text style={styles.statusText}>{status}</Text>
        </WorkbenchBlock>
        <Text style={styles.hardware}>
          {t('hardwareVerification.behaviourTitle')}{' '}
          {
            'Controleer de afstelling met een test op de werkbank zonder propellers.'
          }
        </Text>
      </WorkbenchScrollView>
    </WorkbenchBlock>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    width: '100%',
    alignSelf: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  hero: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    gap: spacing.xs,
  },
  eyebrow: {
    ...typography.caption,
    color: colors.accentStrong,
    fontWeight: '700',
    writingDirection: 'ltr',
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    writingDirection: 'ltr',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    writingDirection: 'ltr',
    maxWidth: PROSE_MEASURE,
  },
  identityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  identity: {
    ...typography.caption,
    color: colors.accentStrong,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  error: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    // Was weight+colour with no token, so the blocked-session message
    // rendered in the system fallback font. Measured in a browser.
    ...typography.bodyStrong,
    color: colors.error,
    writingDirection: 'ltr',
  },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  search: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 190,
    minWidth: 0,
    maxWidth: '100%',
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    textAlign: 'left',
  },
  reload: {
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.accentSoft,
  },
  reloadText: { ...typography.label, color: colors.accentStrong },
  categories: { gap: spacing.xs, paddingVertical: spacing.xs },
  chip: {
    /* The eleven category chips. These declared NO height at all - their
       42px fell out of paddingVertical plus the label's line box - so a
       source search for a sub-44 `minHeight` finds nothing here while
       every one of them renders under the floor. Only a rendered
       measurement catches this shape, which is why the floor is now
       stated rather than inferred from padding.

       `justifyContent` keeps the label optically centred once the box is
       taller than the text needs. */
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  chipOn: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentStrong,
  },
  chipText: { ...typography.label, color: colors.textPrimary },
  workspace: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  list: { flexGrow: 1, flexShrink: 1, flexBasis: 340, maxWidth: '100%', gap: spacing.sm },
  detail: {
    flexGrow: 2,
    flexShrink: 1,
    flexBasis: 480,
    maxWidth: '100%',
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    writingDirection: 'ltr',
  },
  preset: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    gap: spacing.xs,
  },
  presetOn: {
    borderColor: colors.accentStrong,
    backgroundColor: colors.accentSoft,
  },
  badges: { flexDirection: 'row', gap: spacing.xs },
  badge: {
    ...typography.caption,
    color: colors.accentStrong,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.pill,
  },
  badgeWarn: { color: colors.warning, backgroundColor: colors.warningSoft },
  presetTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
    maxWidth: PROSE_MEASURE,
  },
  hint: {
    ...typography.body,
    color: colors.textMuted,
    writingDirection: 'ltr',
    maxWidth: PROSE_MEASURE,
  },
  detailTitle: {
    ...typography.sectionTitle,
    color: colors.accentStrong,
    writingDirection: 'ltr',
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    writingDirection: 'ltr',
    maxWidth: PROSE_MEASURE,
  },
  warning: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.backgroundRaised,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  warningText: { color: colors.warning, writingDirection: 'ltr' },
  options: { gap: spacing.xs },
  subhead: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '700',
    writingDirection: 'ltr',
    maxWidth: PROSE_MEASURE,
  },
  option: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  optionOn: {
    borderColor: colors.accentStrong,
    backgroundColor: colors.accentSoft,
  },
  optionCopy: { flex: 1 },
  optionName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  commandSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  commandCount: { ...typography.display, color: colors.accentStrong },
  primary: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentStrong,
  },
  primaryText: { ...typography.label, color: colors.accentStrong },
  apply: {
    minHeight: 50,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.accent,
  },
  applyText: { ...typography.label, color: colors.textPrimary },
  disabled: { opacity: 0.4 },
  progress: {
    height: 28,
    borderRadius: radii.pill,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    justifyContent: 'center',
  },
  progressFill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: colors.accent,
  },
  progressText: {
    textAlign: 'center',
    color: colors.textPrimary,
    fontWeight: '700',
  },
  decision: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.warning,
    gap: spacing.sm,
  },
  decisionTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    writingDirection: 'ltr',
  },
  cliError: {
    ...typography.caption,
    color: colors.error,
    writingDirection: 'ltr',
  },
  decisionActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cancel: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  cancelText: { color: colors.error, fontWeight: '700' },
  save: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.accent,
  },
  saveText: { color: colors.accentText, fontWeight: '700' },
  status: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.accentSoft,
  },
  statusText: {
    ...typography.label,
    color: colors.accentStrong,
    textAlign: 'center',
    writingDirection: 'ltr',
  },
  hardware: {
    ...typography.caption,
    color: colors.warning,
    textAlign: 'center',
    writingDirection: 'ltr',
    maxWidth: PROSE_MEASURE,
  },
});
