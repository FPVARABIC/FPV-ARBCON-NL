export interface SelectOption<K extends string = string> {
  key: K;
  label: string;
  /** Secondary line under the label — e.g. a technical identifier. */
  description?: string;
  disabled?: boolean;
}

export interface SelectFieldProps<K extends string = string> {
  label: string;
  options: ReadonlyArray<SelectOption<K>>;
  selectedKey: K | null;
  onSelect: (key: K) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Optional helper line under the field. */
  helper?: string;
  testID?: string;
}
