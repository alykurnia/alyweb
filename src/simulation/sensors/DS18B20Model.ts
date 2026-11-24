import { BaseSensorModel } from './BaseSensorModel';

export class DS18B20Model extends BaseSensorModel {
  public temperature: number = 25.0; // °C, range: -55 to 125

  constructor(id: string, name: string = 'DS18B20 Temp Probe') {
    super(id, name, 'ds18b20');
  }

  public setProperty(key: string, value: number | string | boolean): void {
    if (key === 'temperature') {
      this.temperature = Math.max(-55, Math.min(125, Number(value)));
    }
  }

  public getReadings(): Record<string, number | string | boolean> {
    if (!this.isPowered) {
      return { temperature: -127.0, status: 'UNPOWERED' };
    }
    return {
      temperature: Number(this.temperature.toFixed(2)),
      romAddress: '28-FF-4A-32-01-16-04-E2',
      status: 'OK',
    };
  }

  public getConfigRanges() {
    return {
      temperature: { min: -55, max: 125, step: 0.25, unit: '°C', label: 'Probe Temperature' },
    };
  }
}
