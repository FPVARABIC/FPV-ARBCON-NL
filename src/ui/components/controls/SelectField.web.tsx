import React from 'react';
import type { SelectFieldProps } from './selectFieldTypes';
/** Desktop uses the browser's anchored, keyboard-operable list; mobile gets its native picker. */
export function SelectField<K extends string = string>({
  label,
  options,
  selectedKey,
  onSelect,
  placeholder = 'Kiezen…',
  disabled = false,
  helper,
  testID,
}: SelectFieldProps<K>): React.JSX.Element {
  return (
    <label className="fc-select-field">
      <span>{label}</span>
      <select
        data-testid={testID}
        aria-label={label}
        disabled={disabled}
        value={selectedKey ?? ''}
        onChange={e => onSelect(e.target.value as K)}
      >
        {selectedKey === null ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map(option => (
          <option
            key={option.key}
            value={option.key}
            disabled={option.disabled}
          >
            {option.label}
            {option.description ? ` — ${option.description}` : ''}
          </option>
        ))}
      </select>
      {helper ? <span className="fc-field-help">{helper}</span> : null}
    </label>
  );
}

export type { SelectOption, SelectFieldProps } from './selectFieldTypes';
