export interface BoardDefinition {
  id: 'esp32-devkit' | 'arduino-uno' | 'esp8266-nodemcu';
  name: string;
  tagline: string;
  fqbn: string;
  architecture: string;
  core: string;
  flashSize: string;
  sramSize: string;
  clockSpeed: string;
  voltage: number;
  adcBits: number;
  pwmPins: string[];
  inputOnlyPins: string[];
  toolchain: string;
  description: string;
}

export const SUPPORTED_BOARDS: Record<string, BoardDefinition> = {
  'esp32-devkit': {
    id: 'esp32-devkit',
    name: 'ESP32 DevKit V1',
    tagline: 'Tensilica Xtensa Dual-Core 32-bit MCU',
    fqbn: 'esp32:esp32:esp32da',
    architecture: 'xtensa-esp32',
    core: 'esp32:esp32',
    flashSize: '4 MB SPI Flash',
    sramSize: '520 KB SRAM',
    clockSpeed: '240 MHz',
    voltage: 3.3,
    adcBits: 12,
    pwmPins: ['2', '4', '5', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '23', '25', '26', '27', '32', '33'],
    inputOnlyPins: ['34', '35', '36', '39'],
    toolchain: 'xtensa-esp32-elf-g++',
    description: 'High-performance Wi-Fi & Bluetooth IoT SoC with 16 PWM timer channels and dual 12-bit ADCs.',
  },
  'arduino-uno': {
    id: 'arduino-uno',
    name: 'Arduino Uno R3',
    tagline: 'Microchip ATmega328P 8-bit AVR MCU',
    fqbn: 'arduino:avr:uno',
    architecture: 'avr',
    core: 'arduino:avr',
    flashSize: '32 KB Flash',
    sramSize: '2 KB SRAM',
    clockSpeed: '16 MHz',
    voltage: 5.0,
    adcBits: 10,
    pwmPins: ['3', '5', '6', '9', '10', '11'],
    inputOnlyPins: [],
    toolchain: 'avr-g++',
    description: 'Industry-standard 8-bit prototyping microcontroller with 14 digital I/O pins and 6 analog inputs.',
  },
  'esp8266-nodemcu': {
    id: 'esp8266-nodemcu',
    name: 'ESP8266 NodeMCU V2',
    tagline: 'Tensilica L106 32-bit RISC Wi-Fi MCU',
    fqbn: 'esp8266:esp8266:nodemcuv2',
    architecture: 'xtensa-lx106',
    core: 'esp8266:esp8266',
    flashSize: '4 MB Flash',
    sramSize: '80 KB SRAM',
    clockSpeed: '80 MHz',
    voltage: 3.3,
    adcBits: 10,
    pwmPins: ['D1', 'D2', 'D5', 'D6', 'D7', 'D8'],
    inputOnlyPins: ['A0'],
    toolchain: 'xtensa-lx106-elf-g++',
    description: 'Low-cost Wi-Fi enabled microcontroller suited for compact IoT telemetry nodes.',
  },
};

export interface ProjectFile {
  id: string;
  name: string;
  type: 'ino' | 'cpp' | 'h' | 'json';
  content: string;
  isMain?: boolean;
  readOnly?: boolean;
}

export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export interface DiagnosticItem {
  file: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  severity: DiagnosticSeverity;
  message: string;
  source?: string;
}

export type CompilationStatus =
  | 'idle'
  | 'compiling'
  | 'compiled'
  | 'error'
  | 'backend_unavailable';

export interface CompilationResult {
  success: boolean;
  backendAvailable: boolean;
  status: CompilationStatus;
  output: string;
  diagnostics: DiagnosticItem[];
  binarySize?: {
    flashUsed: number;
    flashTotal: number;
    ramUsed: number;
    ramTotal: number;
  };
  executionReady: boolean;
  notice?: string;
}

export interface SerialMessage {
  id: string;
  timestamp: number;
  text: string;
  type: 'rx' | 'tx' | 'info' | 'error';
  baudRate: number;
  source?: 'simulation' | 'hardware';
  deviceId?: string;
}
