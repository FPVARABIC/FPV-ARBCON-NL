import React, { useEffect, useState } from 'react';
import OrientationHero from './OrientationHero';
import { deriveOrientationViewState } from '../../../core/state/orientationViewModel';
import {
  useSetupAttitude,
  useSetupConnected,
} from '../../../platforms/react-native/protocol/setupPresentation';
import { useObservedAirframe } from '../../session/useObservedAirframe';
import { sceneAirframeFor } from '../../orientation3d/airframeSceneModel';
import type { SetupUiSessionKey } from '../../../platforms/react-native/protocol';
/** Read-only presentation of the canonical attitude cache, shared with Setup. */
export default function SensorOrientation({
  sessionKey,
  active,
}: {
  sessionKey: SetupUiSessionKey;
  active: boolean;
}): React.JSX.Element {
  const attitude = useSetupAttitude(sessionKey.sessionId, active),
    connected = useSetupConnected(sessionKey.sessionId);
  const observed = useObservedAirframe(
    connected ? sessionKey.sessionId : undefined,
  );
  const [offset, setOffset] = useState({ rollDeg: 0, pitchDeg: 0, yawDeg: 0 });
  useEffect(
    () => setOffset({ rollDeg: 0, pitchDeg: 0, yawDeg: 0 }),
    [sessionKey.sessionId, sessionKey.generation],
  );
  return (
    <OrientationHero
      orientationView={deriveOrientationViewState(attitude, offset)}
      airframe={sceneAirframeFor(observed)}
      hasSeenResetHint
      canReset={connected && attitude.status === 'FRESH'}
      onResetHintShown={() => undefined}
      onResetView={() => {
        const raw = deriveOrientationViewState(attitude);
        if (connected && raw.status === 'LIVE')
          setOffset({ rollDeg: 0, pitchDeg: 0, yawDeg: raw.yawDeg });
      }}
    />
  );
}
