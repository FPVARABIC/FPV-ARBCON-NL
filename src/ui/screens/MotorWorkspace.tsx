import { MotorSlider } from '../components/motors/MotorSlider';
/**
 * P3 - THE PROFESSIONAL MOTOR WORKSPACE.
 *
 * The primary Motors experience: enable motor control, move Motor 1..N
 * independently, drive them together with Master, stop with one tap.
 * Arabic-first, RTL-native, no long press, no heartbeat, no fixed
 * magnitude, no one-motor-at-a-time rule.
 *
 * SAFETY INVISIBLE, CAPABILITY VISIBLE. Every protection P2 built -
 * disarmed evidence, the FC-side arming restriction, stop domination,
 * last-value-wins coalescing, delayed-ACK invalidation, session and
 * lifecycle teardown - runs underneath this component without asking the
 * operator to acknowledge it. The screen shows ONE persistent warning and
 * otherwise gets out of the way.
 *
 * THE UI OWNS NOTHING SAFETY-CRITICAL. It renders the snapshot, and it
 * calls exactly four facade operations: setMotorValue, setMaster,
 * stopAll, and begin/end session. There is no UI-side queue, no timer, no
 * heartbeat and no protocol import - the controller's coalescing is the
 * only send discipline, and the boundary scan keeps encoders and leases
 * unreachable from here.
 *
 * NO PHYSICAL CLAIMS. Values shown are DESIRED command values (القيمة
 * المطلوبة). An acknowledgement is protocol metadata; nothing here says a
 * motor is turning or has stopped. Physical behaviour remains REQUIRES
 * HARDWARE TEST.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { MotorTestControllerSnapshot } from '../../core/state/motorTestController';
import type { MotorTestValueDomain } from '../../core/firmware-adapters/betaflightMotorDomainV147';
import {
  motorSessionIsTransitioning,
  motorSessionSwitchValue,
  type MotorSessionState,
} from '../../core/state/motorSessionPresentation';
import { ToggleSwitch } from '../components/controls/ToggleSwitch';
import { Button } from '../components/controls/Button';
import { PROSE_MEASURE, colors, radii, spacing, typography } from '../theme';

/* ------------------------------------------------------------------ *
 * The narrow port this workspace may call
 * ------------------------------------------------------------------ */

/**
 * Exactly the facade slice the workspace needs. Deliberately narrower
 * than MotorTestOperatorPort so a test can prove the workspace CANNOT
 * reach pulseMotor, renewPulseHold or any legacy operation.
 */
export interface MotorWorkspacePort {
  setMotorValue(
    motorIndex: number,
    value: number,
  ): { readonly kind: 'ACCEPTED' | 'REFUSED' };
  setMaster(value: number): { readonly kind: 'ACCEPTED' | 'REFUSED' };
  stopAll(): string;
  beginSession(): Promise<unknown>;
  endSession(): Promise<unknown>;
}

export interface MotorWorkspaceProps {
  readonly snapshot: MotorTestControllerSnapshot | undefined;
  readonly port: MotorWorkspacePort | undefined;
  /**
   * TWO AUTHORITIES, NOT ONE - and the reason they are separate is a
   * defect, not a preference.
   *
   * `sessionState` is CONTROLLER TRUTH (see motorSessionPresentation.ts):
   * whether an FC test session exists, with the configuration lease, the
   * arming restriction and the telemetry pause that implies. It is derived
   * from the published phase, never from a boolean this screen owns, because
   * the boolean version rendered READY for a session the controller had
   * already closed.
   *
   * `enabled` is MOTOR CONTROL: permission to put a value on an output
   * INSIDE that session. It is an operator intent and may legitimately be
   * false while the session is wide open.
   *
   * Session ON never turns a motor. Motor Control ON never implies a value
   * above stop. Neither sentence is a UI convention - both are enforced
   * below and proven in MotorWorkspace.test.tsx.
   */
  readonly sessionState: MotorSessionState;
  readonly onSessionChange: (next: boolean) => void;
  /** True once the operator's motor-control intent is granted. */
  readonly enabled: boolean;
  readonly onEnableChange: (next: boolean) => void;
  /**
   * A screen-level reason motor control may not be ENABLED right now -
   * M-F3 §34/§35's topology interlock ("the drafted or saved-but-not-
   * rebooted airframe is not the one the firmware is flying"). When set,
   * the enable switch is disabled and this exact sentence renders beside
   * it, so the refusal is never a control that silently does nothing.
   * UI-level and fail-closed: it can only ever REMOVE the ability to
   * enable, never grant one, and no controller gate reads it.
   */
  readonly enableBlockedReason?: string;
  /** Compact width stacks the master row; wide puts controls side-by-side. */
  readonly compact?: boolean;
}

/* ------------------------------------------------------------------ *
 * Session phase presentation
 * ------------------------------------------------------------------ */

export type MotorWorkspacePhase =
  | 'DISABLED'
  | 'ENABLING'
  | 'READY'
  | 'STOPPING'
  | 'RECOVERY_REQUIRED'
  | 'UNSUPPORTED_3D_ANALOG';

export function deriveWorkspacePhase(
  snapshot: MotorTestControllerSnapshot | undefined,
  enabled: boolean,
): MotorWorkspacePhase {
  if (snapshot?.motorRuntimeScope && !snapshot.motorRuntimeScope.eligible) {
    return 'UNSUPPORTED_3D_ANALOG';
  }
  if (!enabled) {
    return 'DISABLED';
  }
  if (snapshot === undefined || snapshot.outcome.kind === 'PENDING') {
    return 'ENABLING';
  }
  if (snapshot.outcome.kind === 'READY') {
    return snapshot.phase === 'CLOSING' ? 'STOPPING' : 'READY';
  }
  // BLOCKED / FAILED_CLOSED after an enable attempt.
  return 'RECOVERY_REQUIRED';
}

/** i18n keys, not literals: PART AF keeps operator copy in the catalogue. */
const SESSION_STATE_KEY: Record<MotorSessionState, string> = {
  OFF: 'motorsScreen.sessionStateOff',
  OPENING: 'motorsScreen.sessionStateOpening',
  ON: 'motorsScreen.sessionStateOn',
  CLOSING: 'motorsScreen.sessionStateClosing',
  ERROR: 'motorsScreen.sessionStateError',
  UNKNOWN: 'motorsScreen.sessionStateUnknown',
};

/**
 * MEANING IS NEVER CARRIED BY COLOUR ALONE. Every session state also
 * publishes a text label (above) and this shape token, so the row is
 * readable in greyscale and to a screen reader.
 */
function sessionToneStyle(state: MotorSessionState) {
  switch (state) {
    case 'ON':
      return styles.stateChipOn;
    case 'ERROR':
    case 'UNKNOWN':
      return styles.stateChipUncertain;
    case 'OPENING':
    case 'CLOSING':
      return styles.stateChipBusy;
    case 'OFF':
      return styles.stateChipOff;
  }
}

/* ------------------------------------------------------------------ *
 * Slider
 * ------------------------------------------------------------------ */

/**
 * A PanResponder track slider - no external dependency, works on native
 * and react-native-web. The DESIRED value updates immediately with the
 * gesture; the controller's last-value-wins coalescing is the only send
 * discipline, so no timer or queue exists here.
 *
 * DIRECTION. The track is deliberately rendered LTR (min on the left)
 * even in RTL: throttle scales are a technical axis, like a number line,
 * and mirroring them per-locale would make عكسي/أمامي swap sides between
 * builds. Labels around it stay RTL.
 */

/* ------------------------------------------------------------------ *
 * Workspace
 * ------------------------------------------------------------------ */

export function MotorWorkspace({
  snapshot,
  port,
  sessionState,
  onSessionChange,
  enabled,
  onEnableChange,
  enableBlockedReason,
  compact = false,
}: MotorWorkspaceProps): React.JSX.Element {
  const { t } = useTranslation();
  const domain: MotorTestValueDomain | undefined = snapshot?.motorDomain;
  const phase = deriveWorkspacePhase(snapshot, enabled);
  /**
   * BOTH GATES, ALWAYS. `sessionState === 'ON'` is the context and
   * `phase === 'READY'` is the motor-control permission; a command needs
   * both, so neither toggle alone can put a value on an output.
   */
  const sessionOn = sessionState === 'ON';
  const commandable =
    sessionOn &&
    phase === 'READY' &&
    port !== undefined &&
    domain !== undefined;

  const motorCount =
    domain?.motorCount ?? snapshot?.motorScope?.motorCount ?? 0;
  const min = domain?.commandDomainMin ?? 1000;
  const max = domain?.commandDomainMax ?? 2000;
  const stopValue = domain?.stopValue ?? min;
  const neutral = domain?.neutral;

  /** DESIRED values - the UI's own optimistic copy, seeded at stop. The
   * controller snapshot remains the authority; this mirror exists so the
   * thumb tracks the finger without waiting for a publish round-trip. */
  const [desired, setDesired] = useState<readonly number[]>([]);
  const desiredFor = useCallback(
    (index: number): number => desired[index] ?? stopValue,
    [desired, stopValue],
  );

  const applyMotor = useCallback(
    (index: number, value: number) => {
      if (!commandable) {
        return;
      }
      setDesired(previous => {
        const next = Array.from(
          { length: motorCount },
          (_, i) => previous[i] ?? stopValue,
        );
        next[index] = value;
        return next;
      });
      port.setMotorValue(index, value);
    },
    [commandable, motorCount, port, stopValue],
  );

  const applyMaster = useCallback(
    (value: number) => {
      if (!commandable) {
        return;
      }
      setDesired(Array.from({ length: motorCount }, () => value));
      port.setMaster(value);
    },
    [commandable, motorCount, port],
  );

  const handleStop = useCallback(() => {
    // One tap. No confirmation. Desired state snaps to the RESOLVED stop
    // value - 1500 on digital 3D, mincommand on analog - never a literal.
    setDesired(Array.from({ length: motorCount }, () => stopValue));
    port?.stopAll();
  }, [motorCount, port, stopValue]);

  /* P3: WEB ESCAPE-TO-STOP. Escape ONLY - an any-key rule would fight
   * numeric entry, keyboard navigation and assistive tech. Active only
   * while the session is commandable, and removed the moment it is not. */
  useEffect(() => {
    // The RN typings have no DOM globals; the runtime check is the guard.
    const host = globalThis as {
      addEventListener?: (t: string, l: (e: { key?: string }) => void) => void;
      removeEventListener?: (
        t: string,
        l: (e: { key?: string }) => void,
      ) => void;
    };
    if (!commandable || typeof host.addEventListener !== 'function') {
      return undefined;
    }
    const onKeyDown = (event: { key?: string }) => {
      if (event.key === 'Escape') {
        handleStop();
      }
    };
    host.addEventListener('keydown', onKeyDown);
    return () => host.removeEventListener?.('keydown', onKeyDown);
  }, [commandable, handleStop]);

  const masterValue =
    desired.length > 0 && desired.every(value => value === desired[0])
      ? desired[0]
      : stopValue;

  const sessionLabel = t(SESSION_STATE_KEY[sessionState]);
  const sessionBusy = motorSessionIsTransitioning(sessionState);

  /**
   * WHEN THE FOUR MOTORS BECOME A GRID.
   *
   * Four full-width rows cost 84px each - 336px of a column, with the
   * master and STOP pushed below them. A 2x2 grid halves that.
   *
   * NOT a single row of four, which is what a literal reading of a
   * desktop configurator would give. These are HORIZONTAL tracks: in a
   * 950px column, four across leaves each track ~215px, and a 1000-2000
   * range across 215px is 4.6 units per pixel - a safety control whose
   * smallest possible movement is five units. Two across keeps ~460px
   * and ~2.2 units per pixel, which is the precision the single-column
   * layout already had. The grid is the compaction; the track is not.
   *
   * 560 is where two columns plus their gap still clear that width.
   */
  const [cardWidth, setCardWidth] = useState(0);
  const sliderGrid = cardWidth >= 560;

  /**
   * THE SESSION ROW, rendered even when the analog-3D scope makes motor
   * control impossible. The operator still needs to see - and close - a
   * session the app opened; hiding the only OFF control behind an
   * unsupported-configuration card is how a session becomes unreachable.
   */
  const sessionRow = (
    <View style={styles.enableRow} testID="motor-session-row">
      <View style={styles.enableTextBlock}>
        <Text style={styles.sectionTitle}>
          {t('motorsScreen.sessionToggleTitle')}
        </Text>
        <View
          style={[styles.stateChip, sessionToneStyle(sessionState)]}
          testID="motor-session-state"
        >
          <Text style={styles.stateChipText}>{sessionLabel}</Text>
        </View>
        <Text style={styles.phaseText}>
          {t('motorsScreen.sessionToggleHint')}
        </Text>
      </View>
      <ToggleSwitch
        // ON is the ONLY state that reads as on. ERROR and UNKNOWN read as
        // off on the track but carry their own chip and detail line above,
        // so neither can be mistaken for a proven-closed session.
        value={motorSessionSwitchValue(sessionState)}
        onValueChange={onSessionChange}
        disabled={sessionBusy}
        accessibilityLabel={`${t(
          'motorsScreen.sessionToggleTitle',
        )} — ${sessionLabel}`}
        testID="motor-session-toggle"
      />
    </View>
  );

  if (phase === 'UNSUPPORTED_3D_ANALOG') {
    return (
      <View style={styles.card} testID="motor-workspace-unsupported">
        {sessionRow}
        <Text style={styles.sectionTitle}>
          {t('motorsScreen.controlToggleTitle')}
        </Text>
        <Text style={styles.unsupportedText}>
          {
            'Een motortest is niet beschikbaar voor deze analoge 3D-configuratie: de vereiste uitgangsgrenzen kunnen niet uit deze firmwareversie worden gelezen.'
          }
        </Text>
      </View>
    );
  }

  return (
    <View
      style={styles.card}
      testID="motor-workspace"
      /* MEASURED, NOT ASSUMED. This component is placed inside a column
         whose width is a fraction of the window, so a window-width
         breakpoint would put four sliders side by side in a 420px strip.
         Its own laid-out width is the only honest input. */
      onLayout={event => setCardWidth(event.nativeEvent.layout.width)}
    >
      {sessionRow}

      {sessionState === 'ERROR' ? (
        <Text style={styles.recoveryText} testID="motor-session-error-detail">
          {t('motorsScreen.sessionErrorDetail')}
        </Text>
      ) : null}
      {sessionState === 'UNKNOWN' ? (
        <Text style={styles.recoveryText} testID="motor-session-unknown-detail">
          {t('motorsScreen.sessionUnknownDetail')}
        </Text>
      ) : null}

      {/* MOTOR CONTROL - a different authority, in its own row. */}
      <View style={[styles.enableRow, styles.controlRow]} testID="motor-control-row">
        <View style={styles.enableTextBlock}>
          <Text style={styles.sectionTitle}>
            {t('motorsScreen.controlToggleTitle')}
          </Text>
          <View
            style={[
              styles.stateChip,
              commandable ? styles.stateChipOn : styles.stateChipOff,
            ]}
            testID="motor-workspace-phase"
          >
            <Text style={styles.stateChipText}>
              {t(
                commandable
                  ? 'motorsScreen.controlStateOn'
                  : 'motorsScreen.controlStateOff',
              )}
            </Text>
          </View>
          {sessionOn && enableBlockedReason !== undefined && !enabled ? (
            <Text
              style={styles.enableBlockedText}
              testID="motor-workspace-enable-blocked"
            >
              {enableBlockedReason}
            </Text>
          ) : (
            <Text style={styles.phaseText}>
              {sessionOn
                ? t('motorsScreen.controlToggleHint')
                : t('motorsScreen.controlRequiresSession')}
            </Text>
          )}
        </View>
        <ToggleSwitch
          value={enabled && sessionOn}
          onValueChange={onEnableChange}
          // Not operational without a session - PART C. Disabled rather
          // than hidden, so the hierarchy stays visible and the operator
          // can see WHY it cannot be used. The screen-level topology
          // interlock disables ENABLING the same way - the reason renders
          // beside the switch - but never blocks turning control OFF:
          // withdrawing permission (which stops) must always work.
          disabled={
            !sessionOn ||
            phase === 'ENABLING' ||
            phase === 'STOPPING' ||
            (enableBlockedReason !== undefined && !enabled)
          }
          accessibilityLabel={`${t('motorsScreen.controlToggleTitle')} — ${t(
            commandable
              ? 'motorsScreen.controlStateOn'
              : 'motorsScreen.controlStateOff',
          )}`}
          testID="motor-workspace-enable"
        />
      </View>

      {/* The page-level banner above the workspace is THE one propeller
          warning - repeating it here would be the ritual P3 removes. */}
      {phase === 'RECOVERY_REQUIRED' ? (
        <Text style={styles.recoveryText} testID="motor-workspace-recovery">
          {
            'motoren is niet geactiveerd. Verbind het vliegtuig weer en probeer het nog eens.'
          }
        </Text>
      ) : null}

      {/* Motor sliders - rendered from the REAL motor count, labelled with
          the SAME M-number the diagram prints and pulseMotor receives. */}
      <View
        style={[styles.slidersBlock, sliderGrid && styles.slidersGrid]}
        testID="motor-slider-grid"
      >
        {Array.from({ length: motorCount }, (_, index) => (
          <View key={index} style={sliderGrid ? styles.sliderCell : undefined}>
            <MotorSlider
              label={t('motorsScreen.motorNumber', { number: index + 1 })}
              accessibilityLabel={t('motorsScreen.motorAccessibleName', {
                number: index + 1,
              })}
              min={min}
              max={max}
              stopValue={stopValue}
              neutral={neutral}
              value={desiredFor(index)}
              disabled={!commandable}
              onChange={value => applyMotor(index, value)}
              testID={`motor-slider-${index + 1}`}
            />
          </View>
        ))}
        {motorCount === 0 ? <Text style={styles.phaseText}>Geen motoruitgangen beschikbaar</Text> : null}
        <View style={[styles.masterRow, compact && styles.masterRowCompact]}>
          <MotorSlider
            label={t('motorsScreen.masterLabel')}
            accessibilityLabel={t('motorsScreen.masterAccessibleName')}
            min={min}
            max={max}
            stopValue={stopValue}
            neutral={neutral}
            value={masterValue}
            disabled={!commandable}
            onChange={applyMaster}
            testID="motor-slider-master"
          />
        </View>
      </View>

      {/* Master */}

      {/* STOP - the strongest control on the page. */}
      <View style={styles.stopBlock}>
        <Button
          label={'Stop motoren.'}
          onPress={handleStop}
          variant="danger"
          size="lg"
          /* NOT `block`. The danger is carried by the red fill, the
             wording and the position - a full-width slab added none of
             that and read as a banner rather than a control. `lg` keeps
             it the largest button on the page. */
          disabled={port === undefined}
          accessibilityLabel={'Stop motoren.'}
          testID="motor-workspace-stop"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  enableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  enableTextBlock: { flex: 1, gap: 4, alignItems: 'flex-start' },
  /* The second authority is visually subordinate to the session it lives
     inside - a divider, not a second heading of equal weight. */
  controlRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
  phaseText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  enableBlockedText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '600',
    writingDirection: 'ltr',
  },
  /* STATE IS TEXT IN A SHAPE, never colour alone: the label inside the
     chip is the truth, the border is only reinforcement. */
  stateChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  stateChipText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
    writingDirection: 'ltr',
    maxWidth: PROSE_MEASURE,
  },
  stateChipOn: {
    borderColor: colors.accentStrong,
    backgroundColor: colors.accentSoft,
  },
  stateChipOff: {
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  stateChipBusy: {
    borderColor: colors.info,
    backgroundColor: colors.surfaceRaised,
  },
  stateChipUncertain: {
    borderColor: colors.error,
    borderWidth: 2,
    backgroundColor: colors.surfaceRaised,
  },
  safetyLine: {
    ...typography.caption,
    color: colors.warning,
    maxWidth: PROSE_MEASURE,
  },
  recoveryText: {
    ...typography.body,
    color: colors.error,
    maxWidth: PROSE_MEASURE,
  },
  slidersBlock: { gap: spacing.xs },
  slidersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.md,
  },
  /* Just under half, so two fit per row with the column gap between
     them and a third can never squeeze onto the same line. */
  sliderCell: { flexGrow: 1, flexBasis: '47%', minWidth: 240 },
  masterRow: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
  },
  masterRowCompact: {},
  stopBlock: { paddingTop: spacing.xs },
  unsupportedText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    maxWidth: PROSE_MEASURE,
  },
});
