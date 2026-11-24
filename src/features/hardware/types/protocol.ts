/**
 * IoT Lab Hardware Protocol Definition (v1.0)
 * Shared between IoT Lab Web Application, Local Bridge Agent, and ESP32 Firmware.
 */

export const PROTOCOL_VERSION = '1.0';

export type HardwareMessageType =
  | 'hello'
  | 'device_info'
  | 'telemetry'
  | 'gpio_read'
  | 'gpio_write'
  | 'command'
  | 'ack'
  | 'error'
  | 'heartbeat'
  | 'disconnect';

export interface BaseHardwareMessage {
  protocol_version: string;
  device_id: string;
  message_id: string;
  timestamp: number;
  type: HardwareMessageType;
}

export interface HelloPayload {
  token: string;
  firmware_version: string;
  board_type: string;
  capabilities: string[];
}

export interface HelloMessage extends BaseHardwareMessage {
  type: 'hello';
  payload: HelloPayload;
}

export interface DeviceInfoPayload {
  board_type: string;
  chip_model?: string;
  cores?: number;
  cpu_freq_mhz?: number;
  flash_size_bytes?: number;
  free_heap_bytes?: number;
  ip_address?: string;
  mac_address?: string;
  wifi_ssid?: string;
  wifi_rssi?: number;
  firmware_version: string;
  uptime_seconds: number;
  supported_pins: number[];
  input_only_pins: number[];
  pwm_pins: number[];
  adc_pins: number[];
}

export interface DeviceInfoMessage extends BaseHardwareMessage {
  type: 'device_info';
  payload: DeviceInfoPayload;
}

export interface TelemetryPayload {
  temperature?: number;
  humidity?: number;
  soil_moisture?: number;
  distance?: number;
  light_lux?: number;
  pressure?: number;
  gas_ppm?: number;
  analog_values?: Record<string, number>;
  digital_values?: Record<string, number>;
  [key: string]: unknown;
}

export interface TelemetryMessage extends BaseHardwareMessage {
  type: 'telemetry';
  payload: TelemetryPayload;
}

export interface GpioWritePayload {
  pin: number;
  value: number; // 0 (LOW) or 1 (HIGH) or 0-255 (PWM)
  mode?: 'OUTPUT' | 'PWM';
  component_type?: 'led' | 'relay' | 'servo' | 'buzzer' | 'generic';
}

export interface GpioWriteMessage extends BaseHardwareMessage {
  type: 'gpio_write';
  payload: GpioWritePayload;
}

export interface GpioReadPayload {
  pin: number;
  mode?: 'INPUT' | 'INPUT_PULLUP' | 'ANALOG';
}

export interface GpioReadMessage extends BaseHardwareMessage {
  type: 'gpio_read';
  payload: GpioReadPayload;
}

export interface CommandPayload {
  action: string;
  params?: Record<string, unknown>;
}

export interface CommandMessage extends BaseHardwareMessage {
  type: 'command';
  payload: CommandPayload;
}

export interface AckPayload {
  reply_to: string;
  success: boolean;
  data?: unknown;
  message?: string;
}

export interface AckMessage extends BaseHardwareMessage {
  type: 'ack';
  payload: AckPayload;
}

export interface ErrorPayload {
  reply_to?: string;
  code: string;
  message: string;
  details?: unknown;
}

export interface ErrorMessage extends BaseHardwareMessage {
  type: 'error';
  payload: ErrorPayload;
}

export interface HeartbeatPayload {
  uptime_seconds: number;
  rssi?: number;
  free_heap?: number;
}

export interface HeartbeatMessage extends BaseHardwareMessage {
  type: 'heartbeat';
  payload: HeartbeatPayload;
}

export interface DisconnectPayload {
  reason: string;
}

export interface DisconnectMessage extends BaseHardwareMessage {
  type: 'disconnect';
  payload: DisconnectPayload;
}

export type HardwareMessage =
  | HelloMessage
  | DeviceInfoMessage
  | TelemetryMessage
  | GpioWriteMessage
  | GpioReadMessage
  | CommandMessage
  | AckMessage
  | ErrorMessage
  | HeartbeatMessage
  | DisconnectMessage;

/**
 * ESP32 DevKit V1 Hardware Pin Constants
 */
export const ESP32_HARDWARE_PINS = {
  ALL_PINS: [0, 2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33, 34, 35, 36, 39],
  INPUT_ONLY: [34, 35, 36, 39], // GPIO 34-39 have no output drivers or internal pullups
  BOOTSTRAPPING: [0, 2, 15],     // Affect bootloader mode on startup
  PWM_CAPABLE: [2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33],
  ADC_PINS: [32, 33, 34, 35, 36, 39, 25, 26, 27, 14, 12, 13, 4, 2, 15],
  SAFE_OUTPUT_PINS: [2, 4, 5, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33],
};

/**
 * Message Validation Function
 */
export function validateHardwareMessage(msg: unknown): { valid: boolean; error?: string } {
  if (!msg || typeof msg !== 'object') {
    return { valid: false, error: 'Message must be a non-null object' };
  }

  const m = msg as Record<string, unknown>;

  if (typeof m.protocol_version !== 'string' || m.protocol_version !== PROTOCOL_VERSION) {
    return { valid: false, error: `Invalid or unsupported protocol_version. Expected "${PROTOCOL_VERSION}"` };
  }

  if (typeof m.device_id !== 'string' || m.device_id.trim().length === 0) {
    return { valid: false, error: 'device_id must be a non-empty string' };
  }

  if (typeof m.message_id !== 'string' || m.message_id.trim().length === 0) {
    return { valid: false, error: 'message_id must be a non-empty string' };
  }

  if (typeof m.timestamp !== 'number' || isNaN(m.timestamp) || m.timestamp <= 0) {
    return { valid: false, error: 'timestamp must be a valid positive epoch millisecond number' };
  }

  const validTypes: HardwareMessageType[] = [
    'hello',
    'device_info',
    'telemetry',
    'gpio_read',
    'gpio_write',
    'command',
    'ack',
    'error',
    'heartbeat',
    'disconnect',
  ];

  if (typeof m.type !== 'string' || !validTypes.includes(m.type as HardwareMessageType)) {
    return { valid: false, error: `Invalid message type "${m.type}". Must be one of: ${validTypes.join(', ')}` };
  }

  if (!m.payload || typeof m.payload !== 'object') {
    return { valid: false, error: 'payload must be a non-null object' };
  }

  // Type-specific payload validations
  const payload = m.payload as Record<string, unknown>;

  if (m.type === 'hello') {
    if (typeof payload.token !== 'string' || payload.token.trim().length === 0) {
      return { valid: false, error: 'hello payload requires a non-empty token' };
    }
    if (typeof payload.firmware_version !== 'string') {
      return { valid: false, error: 'hello payload requires firmware_version' };
    }
  }

  if (m.type === 'gpio_write') {
    if (typeof payload.pin !== 'number' || isNaN(payload.pin)) {
      return { valid: false, error: 'gpio_write requires a valid numeric pin number' };
    }
    if (ESP32_HARDWARE_PINS.INPUT_ONLY.includes(payload.pin)) {
      return { valid: false, error: `Hardware Violation: GPIO ${payload.pin} is input-only on ESP32 DevKit` };
    }
    if (typeof payload.value !== 'number' || isNaN(payload.value) || payload.value < 0) {
      return { valid: false, error: 'gpio_write requires a non-negative numeric value (0, 1, or 0-255)' };
    }
  }

  if (m.type === 'gpio_read') {
    if (typeof payload.pin !== 'number' || isNaN(payload.pin)) {
      return { valid: false, error: 'gpio_read requires a valid numeric pin number' };
    }
  }

  return { valid: true };
}

/**
 * Check if command timestamp is stale (older than maxAgeMs, default 5000ms)
 */
export function isCommandStale(timestamp: number, maxAgeMs: number = 5000): boolean {
  const now = Date.now();
  return (now - timestamp > maxAgeMs) || (timestamp - now > maxAgeMs);
}
