export interface MotorSliderProps {
  readonly label: string;
  readonly accessibilityLabel: string;
  readonly min: number;
  readonly max: number;
  readonly stopValue: number;
  readonly neutral?: number;
  readonly value: number;
  readonly disabled: boolean;
  readonly onChange: (value: number) => void;
  readonly testID: string;
}
