import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import land from './worldLand.json';
import { Button } from '../controls';
import { colors, typography } from '../../theme';
export function OfflinePositionMap({
  latitude,
  longitude,
}: {
  latitude?: number;
  longitude?: number;
}): React.JSX.Element {
  const [zoom, setZoom] = useState(1);
  const valid =
    latitude !== undefined &&
    longitude !== undefined &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180;
  const w = 360 / zoom,
    h = 180 / zoom,
    cx = valid ? longitude + 180 : 180,
    cy = valid ? 90 - latitude : 90;
  const x = Math.max(0, Math.min(360 - w, cx - w / 2)),
    y = Math.max(0, Math.min(180 - h, cy - h / 2));
  return (
    <View style={styles.root} testID="gps-offline-map">
      <Svg
        testID="gps-map-svg"
        width="100%"
        height={300}
        viewBox={`${x} ${y} ${w} ${h}`}
        preserveAspectRatio="xMidYMid meet"
        accessibilityLabel={
          valid
            ? 'GPS-positie op offline wereldkaart'
            : 'Offline wereldkaart · wachten op geldige GPS-positie'
        }
      >
        <Path d="M0 0H360V180H0Z" fill="#121D2B" />
        {Array.from({ length: 11 }, (_, i) => (
          <Line
            key={`lon${i}`}
            x1={(i + 1) * 30}
            x2={(i + 1) * 30}
            y1={0}
            y2={180}
            stroke="#293A50"
            strokeWidth={0.3 / zoom}
          />
        ))}
        {Array.from({ length: 5 }, (_, i) => (
          <Line
            key={`lat${i}`}
            x1={0}
            x2={360}
            y1={(i + 1) * 30}
            y2={(i + 1) * 30}
            stroke="#293A50"
            strokeWidth={0.3 / zoom}
          />
        ))}
        {land.map((d, i) => (
          <Path
            key={i}
            d={d}
            fillRule="evenodd"
            fill="#34465C"
            stroke="#60758C"
            strokeWidth={0.22 / zoom}
          />
        ))}
        {valid ? (
          <>
            <Circle
              cx={cx}
              cy={cy}
              r={3.2 / zoom}
              fill="#F4B917"
              opacity={0.24}
            />
            <Circle
              testID="gps-map-position"
              cx={cx}
              cy={cy}
              r={1.4 / zoom}
              fill="#F4B917"
              stroke="#11151E"
              strokeWidth={0.5 / zoom}
            />
          </>
        ) : null}
      </Svg>
      <View style={styles.controls}>
        <Text style={styles.caption}>Offline kaart · Natural Earth</Text>
        <Button
          label="−"
          variant="secondary"
          disabled={zoom === 1}
          onPress={() => setZoom(z => Math.max(1, z / 2))}
          testID="gps-map-zoom-out"
        />
        <Button
          label="+"
          variant="secondary"
          disabled={zoom === 8}
          onPress={() => setZoom(z => Math.min(8, z * 2))}
          testID="gps-map-zoom-in"
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    width: '100%',
    minWidth: 0,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 6,
    overflow: 'hidden',
  },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8 },
  caption: { ...typography.caption, color: colors.textMuted, flex: 1 },
});
