import { VirtualPinState } from '../types/simulation';

export function createDefaultPinState(
  pinId: string,
  pinName: string,
  pinNumber?: number | string
): VirtualPinState {
  return {
    pinId,
    pinName,
    pinNumber,
    mode: 'INPUT',
    digitalValue: 'LOW',
    analogValue: 0,
    voltage: 0.0,
    pwmDuty: 0,
  };
}

