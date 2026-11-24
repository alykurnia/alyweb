import { BaseSensorModel } from './BaseSensorModel';

export class UltrasonicModel extends BaseSensorModel {
  public distance: number = 25.0; // cm, range: 2 to 400
  public lastTriggerTime: number = 0;
  public echoState: 'HIGH' | 'LOW' = 'LOW';

  constructor(id: string, name: string = 'HC-SR04 Ultrasonic') {
    super(id, name, 'hc-sr04');
  }

  public setProperty(key: string, value: number | string | boolean): void {
    if (key === 'distance') {
      this.distance = Math.max(2, Math.min(400, Number(value)));
    }
  }

  public triggerPulse(timestamp: number): void {
    this.lastTriggerTime = timestamp;
  }

  public getEchoDurationUs(): number {
    // Standard HC-SR04 formula: round-trip time in microseconds (approx 58 µs per cm)
    return Math.round(this.distance * 58);
  }

  public getReadings(): Record<string, number | string | boolean> {
    if (!this.isPowered) {
      return { distance: 0, echoUs: 0, status: 'UNPOWERED' };
    }
    const echoUs = this.getEchoDurationUs();
    return {
      distance: Number(this.distance.toFixed(1)),
      echoUs,
      echoDurationUs: echoUs,
      status: 'OK',
    };
  }

  public getConfigRanges() {
    return {
      distance: { min: 2, max: 400, step: 1, unit: 'cm', label: 'Obstacle Distance' },
    };
  }
}

