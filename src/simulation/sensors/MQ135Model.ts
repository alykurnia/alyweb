import { BaseSensorModel } from './BaseSensorModel';

export class MQ135Model extends BaseSensorModel {
  public gasPpm: number = 120; // PPM, range: 10 to 1000
  public thresholdPpm: number = 350;

  public get ppm(): number {
    return this.gasPpm;
  }

  constructor(id: string, name: string = 'MQ-135 Gas Sensor') {
    super(id, name, 'mq135');
  }

  public setProperty(key: string, value: number | string | boolean): void {
    if (key === 'gasPpm' || key === 'ppm') {
      this.gasPpm = Math.max(10, Math.min(1000, Number(value)));
    } else if (key === 'threshold') {
      this.thresholdPpm = Math.max(50, Math.min(800, Number(value)));
    }
  }

  public getAnalogVoltage(vref: number = 5.0): number {
    if (!this.isPowered) return 0;
    // Normalized voltage between 0.4V (clean) to 4.2V (high concentration)
    const factor = Math.min(1, Math.max(0, (this.gasPpm - 10) / 990));
    return Number((0.4 + factor * (vref - 0.8)).toFixed(2));
  }

  public getDigitalOut(): 'HIGH' | 'LOW' {
    if (!this.isPowered) return 'LOW';
    // Active LOW or HIGH comparator when gas exceeds threshold
    return this.gasPpm >= this.thresholdPpm ? 'HIGH' : 'LOW';
  }

  public get airQuality(): 'EXCELLENT' | 'FAIR' | 'POOR' | 'HAZARDOUS' {
    if (this.gasPpm < 150) return 'EXCELLENT';
    if (this.gasPpm < 400) return 'FAIR';
    if (this.gasPpm < 700) return 'POOR';
    return 'HAZARDOUS';
  }

  public getReadings(): Record<string, number | string | boolean> {
    if (!this.isPowered) {
      return { ppm: 0, analogVoltage: 0, digitalAlert: false, airQuality: 'UNKNOWN', status: 'UNPOWERED' };
    }
    const voltage = this.getAnalogVoltage(this.powerVoltage || 5.0);
    return {
      ppm: Math.round(this.gasPpm),
      analogVoltage: voltage,
      digitalAlert: this.getDigitalOut() === 'HIGH',
      airQuality: this.airQuality,
      status: 'OK',
    };
  }

  public getConfigRanges() {
    return {
      ppm: { min: 10, max: 1000, step: 10, unit: 'PPM', label: 'Air Gas Concentration' },
    };
  }
}

