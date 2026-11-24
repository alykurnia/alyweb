export type DeviceConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export interface GpioPinState {
  pin: number;
  mode: 'INPUT' | 'INPUT_PULLUP' | 'OUTPUT' | 'PWM' | 'ANALOG';
  value: number; // 0, 1, or 0-255 (PWM)
  voltage?: number;
  lastUpdated?: number;
}

export interface TelemetryPoint {
  timestamp: number;
  temperature?: number;
  humidity?: number;
  soil_moisture?: number;
  distance?: number;
  light_lux?: number;
  pressure?: number;
  gas_ppm?: number;
  [key: string]: unknown;
}

export interface RegisteredDevice {
  deviceId: string;
  name: string;
  token: string;
  boardType: string;
  status: DeviceConnectionStatus;
  firmwareVersion: string;
  ipAddress?: string;
  macAddress?: string;
  rssi?: number;
  uptimeSeconds?: number;
  lastSeen?: number;
  latencyMs?: number;
  capabilities: string[];
  pinStates: Record<number, GpioPinState>;
  telemetryHistory: TelemetryPoint[];
  currentTelemetry?: TelemetryPoint;
}

export interface HardwareModeConfig {
  enabled: boolean;
  activeDeviceId: string | null;
  confirmedAt?: number;
}
