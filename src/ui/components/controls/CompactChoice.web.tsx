import React from 'react';
import { SelectField } from './SelectField';
type Props = {
  accessibilityLabel: string;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  disabled?: boolean;
  testID?: string;
  options: readonly {
    key: string;
    label: string;
    disabled?: boolean;
    note?: string;
    testID?: string;
  }[];
};
export function CompactChoice({
  accessibilityLabel,
  selectedKey,
  onSelect,
  disabled,
  options,
  testID,
}: Props): React.JSX.Element {
  return (
    <SelectField
      label={accessibilityLabel}
      selectedKey={selectedKey}
      onSelect={onSelect}
      disabled={disabled}
      options={options.map(o => ({ ...o, description: o.note }))}
      testID={testID}
    />
  );
}
