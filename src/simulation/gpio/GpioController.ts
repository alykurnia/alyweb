import { VirtualPinState, PinMode, DigitalState } from '../types/simulation';
import { createDefaultPinState } from './PinState';
import { ComponentPin } from '@/types/circuit';
import { COMPONENT_DEFINITIONS } from '@/lib/component-definitions';

export interface BoardGpioProfile {
  name: string;
  maxVoltage: number; // 3.3 or 5.0
  adcBits: number; // 12 (0-4095) or 10 (0-1023)
  inputOnlyPins: string[]; // e.g. ['pin-vp', 'pin-vn', 'pin-d34', 'pin-d35']
  pwmPins: string[]; // Pins capable of hardware PWM
  analogPins: string[]; // Pins capable of ADC
  bootStrappingPins: string[]; // Pins with boot state sensitivity
}

export const ESP32_GPIO_PROFILE: BoardGpioProfile = {
  name: 'ESP32 DevKit V1',
  maxVoltage: 3.3,
  adcBits: 12, // 0 - 4095
  inputOnlyPins: ['pin-vp', 'pin-vn', 'pin-d34', 'pin-d35', 'pin-gpio34', 'pin-gpio35', 'pin-gpio36', 'pin-gpio39'],
  pwmPins: [
    'pin-d2', 'pin-d4', 'pin-d5', 'pin-d12', 'pin-d13', 'pin-d14', 'pin-d15',
    'pin-d16', 'pin-d17', 'pin-d18', 'pin-d19', 'pin-d21', 'pin-d22', 'pin-d23',
    'pin-d25', 'pin-d26', 'pin-d27', 'pin-d32', 'pin-d33',
    'pin-gpio2', 'pin-gpio4', 'pin-gpio5', 'pin-gpio12', 'pin-gpio13', 'pin-gpio14', 'pin-gpio15',
    'pin-gpio16', 'pin-gpio17', 'pin-gpio18', 'pin-gpio19', 'pin-gpio21', 'pin-gpio22', 'pin-gpio23',
    'pin-gpio25', 'pin-gpio26', 'pin-gpio27', 'pin-gpio32', 'pin-gpio33'
  ],
  analogPins: ['pin-vp', 'pin-vn', 'pin-d34', 'pin-d35', 'pin-d32', 'pin-d33', 'pin-d25', 'pin-d26', 'pin-d27', 'pin-d14', 'pin-d12'],
  bootStrappingPins: ['pin-d0', 'pin-d2', 'pin-d15'],
};

export const ARDUINO_UNO_GPIO_PROFILE: BoardGpioProfile = {
  name: 'Arduino Uno R3',
  maxVoltage: 5.0,
  adcBits: 10, // 0 - 1023
  inputOnlyPins: [],
  pwmPins: ['pin-d3', 'pin-d5', 'pin-d6', 'pin-d9', 'pin-d10', 'pin-d11'],
  analogPins: ['pin-a0', 'pin-a1', 'pin-a2', 'pin-a3', 'pin-a4', 'pin-a5'],
  bootStrappingPins: [],
};

export const ESP8266_GPIO_PROFILE: BoardGpioProfile = {
  name: 'ESP8266 NodeMCU',
  maxVoltage: 3.3,
  adcBits: 10, // 0 - 1023
  inputOnlyPins: ['pin-a0'],
  pwmPins: ['pin-d1', 'pin-d2', 'pin-d5', 'pin-d6', 'pin-d7', 'pin-d8'],
  analogPins: ['pin-a0'],
  bootStrappingPins: ['pin-d3', 'pin-d4', 'pin-d8'],
};

export class GpioController {
  public readonly id: string;
  public readonly boardTypeId: string;
  private pins: Map<string, VirtualPinState> = new Map();
  public readonly profile: BoardGpioProfile;

  constructor(
    arg1: string,
    arg2?: string | ComponentPin[],
    arg3?: ComponentPin[]
  ) {
    let boardTypeId: string;
    let boardPins: ComponentPin[] | undefined;

    if (typeof arg2 === 'string') {
      this.id = arg1;
      boardTypeId = arg2;
      boardPins = arg3;
    } else {
      this.id = arg1;
      boardTypeId = arg1;
      boardPins = arg2;
    }

    this.boardTypeId = boardTypeId;

    if (boardTypeId === 'arduino-uno') {
      this.profile = ARDUINO_UNO_GPIO_PROFILE;
    } else if (boardTypeId === 'esp8266-nodemcu') {
      this.profile = ESP8266_GPIO_PROFILE;
    } else {
      this.profile = ESP32_GPIO_PROFILE;
    }

    const resolvedPins =
      boardPins && Array.isArray(boardPins)
        ? boardPins
        : COMPONENT_DEFINITIONS[boardTypeId]?.pins || [];

    // Initialize all pins from board definitions
    resolvedPins.forEach((p) => {
      this.pins.set(p.id, createDefaultPinState(p.id, p.name, p.pinNumber));
    });

    if (boardTypeId === 'esp32-devkit') {
      const aliasMap: Record<string, string> = {
        'pin-gpio34': 'pin-d34',
        'pin-gpio35': 'pin-d35',
        'pin-gpio36': 'pin-vp',
        'pin-gpio39': 'pin-vn',
        'pin-gpio2': 'pin-d2',
        'pin-gpio4': 'pin-d4',
        'pin-gpio18': 'pin-d18',
      };
      for (const [alias, realId] of Object.entries(aliasMap)) {
        if (!this.pins.has(alias)) {
          const realPin = this.pins.get(realId);
          if (realPin) {
            this.pins.set(alias, realPin);
          } else {
            this.pins.set(alias, createDefaultPinState(alias, alias.replace('pin-', '').toUpperCase()));
          }
        }
      }
    }
  }

  public get boardName(): string {
    return this.profile.name;
  }

  public isPwmCapable(pinId: string): boolean {
    return this.profile.pwmPins.includes(pinId);
  }

  public isInputOnly(pinId: string): boolean {
    return this.profile.inputOnlyPins.includes(pinId);
  }

  public pinMode(pinId: string, mode: PinMode): { success: boolean; error?: string } {
    const res = this.setPinMode(pinId, mode);
    if (!res.success) {
      throw new Error(res.error);
    }
    return res;
  }

  public setConnectedTarget(
    pinId: string,
    connectedTo: { componentId: string; componentName: string; pinId: string; pinName: string }
  ): void {
    this.connectPin(pinId, connectedTo);
  }

  public setPinMode(pinId: string, mode: PinMode): { success: boolean; error?: string } {
    const pin = this.pins.get(pinId);
    if (!pin) {
      return { success: false, error: `Pin "${pinId}" does not exist on this board.` };
    }

    // Hardware rule check: Input-only GPIOs cannot be OUTPUT or PWM_OUTPUT
    if ((mode === 'OUTPUT' || mode === 'PWM_OUTPUT') && this.profile.inputOnlyPins.includes(pinId)) {
      return {
        success: false,
        error: `Hardware Restriction: Pin ${pin.pinName} on ${this.profile.name} is INPUT-ONLY (GPIO 34-39 have no output drivers).`,
      };
    }

    // Check PWM capability
    if (mode === 'PWM_OUTPUT' && !this.profile.pwmPins.includes(pinId) && this.profile.name.includes('Arduino')) {
      return {
        success: false,
        error: `Hardware Restriction: Pin ${pin.pinName} on ${this.profile.name} does not support hardware PWM timer.`,
      };
    }

    pin.mode = mode;
    if (mode === 'INPUT_PULLUP') {
      pin.digitalValue = 'HIGH';
      pin.voltage = this.profile.maxVoltage;
    } else if (mode === 'INPUT') {
      pin.digitalValue = 'LOW';
      pin.voltage = 0.0;
    }
    return { success: true };
  }

  public digitalWrite(pinId: string, value: DigitalState): { success: boolean; error?: string } {
    const pin = this.pins.get(pinId);
    if (!pin) {
      return { success: false, error: `Pin "${pinId}" not found.` };
    }

    if (this.profile.inputOnlyPins.includes(pinId)) {
      return {
        success: false,
        error: `Cannot write to ${pin.pinName}: Pin is input-only.`,
      };
    }

    pin.digitalValue = value;
    pin.voltage = value === 'HIGH' ? this.profile.maxVoltage : 0.0;
    pin.pwmDuty = value === 'HIGH' ? 255 : 0;
    return { success: true };
  }

  public digitalRead(pinId: string): DigitalState {
    const pin = this.pins.get(pinId);
    if (!pin) return 'LOW';
    return pin.digitalValue;
  }

  public analogWrite(pinId: string, duty: number): { success: boolean; error?: string } {
    const pin = this.pins.get(pinId);
    if (!pin) {
      return { success: false, error: `Pin "${pinId}" not found.` };
    }

    if (this.profile.inputOnlyPins.includes(pinId)) {
      return {
        success: false,
        error: `Cannot output PWM on ${pin.pinName}: Pin is input-only.`,
      };
    }

    const clampedDuty = Math.max(0, Math.min(255, Math.round(duty)));
    pin.mode = 'PWM_OUTPUT';
    pin.pwmDuty = clampedDuty;
    pin.voltage = (clampedDuty / 255) * this.profile.maxVoltage;
    pin.digitalValue = clampedDuty > 127 ? 'HIGH' : 'LOW';
    return { success: true };
  }

  public setAnalogVoltage(pinId: string, voltage: number): void {
    const pin = this.pins.get(pinId);
    if (!pin) return;

    pin.mode = 'ANALOG_INPUT';
    const clampedVoltage = Math.max(0, Math.min(this.profile.maxVoltage, voltage));
    pin.voltage = clampedVoltage;
    const maxAdc = Math.pow(2, this.profile.adcBits) - 1;
    pin.analogValue = Math.round((clampedVoltage / this.profile.maxVoltage) * maxAdc);
    pin.digitalValue = clampedVoltage >= this.profile.maxVoltage * 0.6 ? 'HIGH' : 'LOW';
  }

  public analogRead(pinId: string): number {
    const pin = this.pins.get(pinId);
    if (!pin) return 0;
    return pin.analogValue;
  }

  public connectPin(
    pinId: string,
    connectedTo: { componentId: string; componentName: string; pinId: string; pinName: string }
  ): void {
    const pin = this.pins.get(pinId);
    if (pin) {
      pin.connectedTo = connectedTo;
    }
  }

  public disconnectPin(pinId: string): void {
    const pin = this.pins.get(pinId);
    if (pin) {
      pin.connectedTo = undefined;
    }
  }

  public getPin(pinId: string): VirtualPinState | undefined {
    return this.pins.get(pinId);
  }

  public getAllPins(): VirtualPinState[] {
    return Array.from(this.pins.values());
  }

  public reset(): void {
    this.pins.forEach((pin) => {
      pin.mode = 'INPUT';
      pin.digitalValue = 'LOW';
      pin.analogValue = 0;
      pin.voltage = 0.0;
      pin.pwmDuty = 0;
    });
  }
}

