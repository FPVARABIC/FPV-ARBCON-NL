import React from 'react';
import type { MotorSliderProps } from './motorSliderTypes';
/** Native HTML range keeps exact keyboard steps and is routed to the existing guarded operator. */
export function MotorSlider({
  label,
  accessibilityLabel,
  min,
  max,
  value,
  disabled,
  onChange,
  testID,
  neutral,
}: MotorSliderProps): React.JSX.Element {
  return (
    <div className="fc-motor-slider" data-testid={testID}>
      <span className="fc-motor-label">{label}</span>
      <output data-testid={`${testID}-value`}>{value}</output>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        disabled={disabled}
        aria-label={accessibilityLabel}
        onChange={e => onChange(Number(e.target.value))}
      />
      <span className="fc-motor-scale">
        {min} – {max}
      </span>
      {neutral !== undefined ? (
        <span className="fc-motor-scale">Neutraal {neutral}</span>
      ) : null}
    </div>
  );
}
