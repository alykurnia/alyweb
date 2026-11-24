import { BaseSensorModel } from './BaseSensorModel';

export class BMP280Model extends BaseSensorModel {
  public pressure: number = 1013.25; // hPa, range 300 to 1100
  public temperature: number = 24.5; // °C, range -40 to 85
  public readonly i2cAddress: string = '0x76';

  constructor(id: string, name: string = 'BMP280 Barometer') {
    super(id, name, 'bmp280');
  }

  public setProperty(key: string, value: number | string | boolean): void {
    if (key === 'pressure') {
      this.pressure = Math.max(300, Math.min(1100, Number(value)));
    } else if (key === 'temperature') {
      this.temperature = Math.max(-40, Math.min(85, Number(value)));
    }
  }

  public getReadings(): Record<string, number | string | boolean> {
    if (!this.isPowered) {
      return { pressure: 0, temperature: 0, altitude: 0, status: 'UNPOWERED', i2cAddress: this.i2cAddress };
    }
    // Standard hypsometric formula for approximate altitude in meters
    const altitude = 44330 * (1 - Math.pow(this.pressure / 1013.25, 1 / 5.255));

    return {
      pressure: Number(this.pressure.toFixed(2)),
      temperature: Number(this.temperature.toFixed(1)),
      altitude: Math.round(altitude),
      status: 'OK',
      i2cAddress: this.i2cAddress,
    };
  }

  public getConfigRanges() {
    return {
      pressure: { min: 300, max: 1100, step: 0.5, unit: 'hPa', label: 'Barometric Pressure' },
      temperature: { min: -40, max: 85, step: 0.5, unit: '°C', label: 'Ambient Temperature' },
    };
  }
}
