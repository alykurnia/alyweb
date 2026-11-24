import { BaseSensorModel } from './BaseSensorModel';

export class DHT11Model extends BaseSensorModel {
  public temperature: number = 24.0; // °C, range: 0 to 50
  public humidity: number = 50.0; // %, range: 20 to 90

  constructor(id: string, name: string = 'DHT11 Sensor') {
    super(id, name, 'dht11');
  }

  public setProperty(key: string, value: number | string | boolean): void {
    if (key === 'temperature') {
      this.temperature = Math.max(0, Math.min(50, Number(value)));
    } else if (key === 'humidity') {
      this.humidity = Math.max(20, Math.min(90, Number(value)));
    }
  }

  public getReadings(): Record<string, number | string | boolean> {
    if (!this.isPowered) {
      return { temperature: 0, humidity: 0, status: 'UNPOWERED' };
    }
    return {
      temperature: Math.round(this.temperature),
      humidity: Math.round(this.humidity),
      status: 'OK',
    };
  }

  public getConfigRanges() {
    return {
      temperature: { min: 0, max: 50, step: 1, unit: '°C', label: 'Temperature' },
      humidity: { min: 20, max: 90, step: 1, unit: '%', label: 'Humidity' },
    };
  }
}
