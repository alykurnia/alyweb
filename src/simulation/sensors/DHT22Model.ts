import { BaseSensorModel } from './BaseSensorModel';

export class DHT22Model extends BaseSensorModel {
  public temperature: number = 28.0; // °C, range: -40 to 80
  public humidity: number = 65.0; // %, range: 0 to 100

  constructor(id: string, name: string = 'DHT22 Sensor') {
    super(id, name, 'dht22');
  }

  public setProperty(key: string, value: number | string | boolean): void {
    if (key === 'temperature') {
      this.temperature = Math.max(-40, Math.min(80, Number(value)));
    } else if (key === 'humidity') {
      this.humidity = Math.max(0, Math.min(100, Number(value)));
    }
  }

  public getReadings(): Record<string, number | string | boolean> {
    if (!this.isPowered) {
      return { temperature: 0, humidity: 0, status: 'UNPOWERED' };
    }
    return {
      temperature: Number(this.temperature.toFixed(1)),
      humidity: Number(this.humidity.toFixed(1)),
      status: 'OK',
    };
  }

  public getConfigRanges() {
    return {
      temperature: { min: -40, max: 80, step: 0.5, unit: '°C', label: 'Ambient Temperature' },
      humidity: { min: 0, max: 100, step: 1, unit: '%', label: 'Relative Humidity' },
    };
  }
}
