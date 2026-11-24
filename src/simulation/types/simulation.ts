export type SimulationState =
  | 'idle'
  | 'starting'
  | 'running'
  | 'paused'
  | 'stopped'
  | 'error';

export type LogLevel = 'INFO' | 'GPIO' | 'SENSOR' | 'ACTUATOR' | 'WARNING' | 'ERROR';

export interface SimulationLogEntry {
  id: string;
  timestamp: number; // Elapsed ms
  timeFormatted: string; // e.g. "00:04.250"
  level: LogLevel;
  componentId?: string;
  pin?: string;
  message: string;
}

export type PinMode =
  | 'INPUT'
  | 'OUTPUT'
  | 'INPUT_PULLUP'
  | 'ANALOG_INPUT'
  | 'PWM_OUTPUT';

export type DigitalState = 'HIGH' | 'LOW';

export interface VirtualPinState {
  pinId: string; // Handle id, e.g. "pin-d4"
  pinName: string; // Display name, e.g. "D4" or "GPIO4"
  pinNumber?: number | string;
  mode: PinMode;
  digitalValue: DigitalState;
  analogValue: number; // 0 - 4095 for ESP32, 0 - 1023 for Arduino
  voltage: number; // Electrical voltage in Volts (0.0 to 5.0)
  pwmDuty: number; // 0 - 255
  frequency?: number; // PWM / Clock frequency in Hz
  connectedTo?: {
    componentId: string;
    componentName: string;
    pinId: string;
    pinName: string;
  };
}

export type ValidationSeverity = 'WARNING' | 'ERROR' | 'FATAL';

export interface CircuitValidationIssue {
  id: string;
  severity: ValidationSeverity;
  componentId?: string;
  componentName?: string;
  pinId?: string;
  pinName?: string;
  message: string;
  rule: string;
  approximationNote?: string;
}

export interface SensorModelData {
  id: string;
  name: string;
  typeId: string;
  isPowered: boolean;
  powerVoltage: number;
  readings: Record<string, number | string | boolean>;
  configRanges: Record<string, { min: number; max: number; step: number; unit: string; label: string }>;
}

export interface ActuatorModelData {
  id: string;
  name: string;
  typeId: string;
  isPowered: boolean;
  state: Record<string, number | string | boolean>;
}

export interface DisplayModelData {
  id: string;
  name: string;
  typeId: string;
  isPowered: boolean;
  lines: string[];
  i2cAddress: string;
}
