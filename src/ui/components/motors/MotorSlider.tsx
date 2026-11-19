import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import type { MotorSliderProps } from './motorSliderTypes';
const THUMB_SIZE = 28;
export function MotorSlider({
  label,
  accessibilityLabel,
  min,
  max,
  stopValue,
  neutral,
  value,
  disabled,
  onChange,
  testID,
}: MotorSliderProps): React.JSX.Element {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  const trackStartX = useRef(0);
  const span = Math.max(1, max - min);
  const fraction = (Math.min(Math.max(value, min), max) - min) / span;

  const valueFromX = useCallback(
    (pageX: number): number => {
      const width = trackWidthRef.current;
      if (width <= 0) {
        return value;
      }
      const raw = (pageX - trackStartX.current) / width;
      const clamped = Math.min(Math.max(raw, 0), 1);
      return Math.round(min + clamped * span);
    },
    [min, span, value],
  );

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: event => {
          onChange(valueFromX(event.nativeEvent.pageX));
        },
        onPanResponderMove: event => {
          onChange(valueFromX(event.nativeEvent.pageX));
        },
      }),
    [disabled, onChange, valueFromX],
  );

  const onTrackLayout = useCallback((event: LayoutChangeEvent) => {
    trackWidthRef.current = event.nativeEvent.layout.width;
    setTrackWidth(event.nativeEvent.layout.width);
  }, []);

  const neutralFraction =
    neutral !== undefined ? (neutral - min) / span : undefined;

  return (
    <View style={sliderStyles.row} testID={testID}>
      <View style={sliderStyles.headerRow}>
        <Text style={sliderStyles.label}>{label}</Text>
        <Text style={sliderStyles.value} testID={`${testID}-value`}>
          {String(value)}
        </Text>
      </View>
      <View
        style={[
          sliderStyles.trackTouch,
          disabled && sliderStyles.trackDisabled,
        ]}
        onLayout={onTrackLayout}
        // Measured in page coordinates once per gesture start would race
        // scrolling; pageX relative to a ref captured on layout is stable
        // enough for a test bench control.
        ref={node => {
          (
            node as unknown as {
              measure?: (
                callback: (
                  x: number,
                  y: number,
                  w: number,
                  h: number,
                  pageX?: number,
                ) => void,
              ) => void;
            } | null
          )?.measure?.((_x, _y, _w, _h, pageX) => {
            trackStartX.current = pageX ?? 0;
          });
        }}
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min, max, now: value }}
        accessibilityState={{ disabled }}
        {...responder.panHandlers}
      >
        <View style={sliderStyles.trackLine} />
        {neutralFraction !== undefined && trackWidth > 0 ? (
          <View
            style={[
              sliderStyles.neutralTick,
              { left: Math.max(0, neutralFraction * trackWidth - 1) },
            ]}
          />
        ) : null}
        {trackWidth > 0 ? (
          <View
            style={[
              sliderStyles.thumb,
              { left: Math.max(0, fraction * trackWidth - THUMB_SIZE / 2) },
              disabled && sliderStyles.thumbDisabled,
            ]}
          />
        ) : null}
      </View>
      {neutral !== undefined ? (
        <View style={sliderStyles.threeDLegend} {...({ dir: 'ltr' } as object)}>
          {/* LTR axis: reverse left of neutral, forward right of it.
              THE ORDER OF THESE THREE IS PHYSICAL, NOT EDITORIAL. The
              thumb is placed with absolute `left` from
              (value - min) / span, and the gesture maps a larger pageX to
              a larger value, so the LEFT end of the track commands
              REVERSE and the RIGHT end commands FORWARD - measured
              identical under both document directions.

              The row must therefore not reverse with the text. It used to
              say so with `direction: 'ltr'` in the stylesheet, which
              react-native-web drops, so under RTL this legend printed
              أمامي at the left end - naming FORWARD on the end that
              commands REVERSE. Measured at 390/768/1366: order was
              [أمامي, محايد, عكسي] under RTL against [عكسي, محايد, أمامي]
              under LTR, while the thumb offsets were identical in both.
              `dir` is a forwarded DOM prop and is ignored off the web. */}
          <Text style={sliderStyles.legendText}>{'Ondersteboven'}</Text>
          <Text style={sliderStyles.legendText}>
            {'Neutraal / stop '}
            {String(stopValue)}
          </Text>
          <Text style={sliderStyles.legendText}>{'Voor'}</Text>
        </View>
      ) : null}
    </View>
  );
}
const sliderStyles = StyleSheet.create({
  row: { gap: spacing.xs, paddingVertical: spacing.xs },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 15,
  },
  value: {
    ...typography.mono,
    color: colors.textPrimary,
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  trackTouch: {
    height: 44,
    justifyContent: 'center',
    // The technical axis stays LTR in RTL builds - see MotorSlider docs.
    direction: 'ltr',
  },
  trackDisabled: { opacity: 0.45 },
  trackLine: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
  },
  neutralTick: {
    position: 'absolute',
    width: 2,
    height: 18,
    borderRadius: 1,
    backgroundColor: colors.textSecondary,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  thumbDisabled: { backgroundColor: colors.borderStrong },
  threeDLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
});
