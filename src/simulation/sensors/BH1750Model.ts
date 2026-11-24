import { BaseSensorModel } from './BaseSensorModel';

export class BH1750Model extends BaseSensorModel {
  public lux: number = 450; // Lux, range 0 to 65535 lx
  public readonly i2cAddress: string = '0x23';

  constructor(id: string, name: string = 'BH1750 Light Sensor') {
    super(id, name, 'bh1750');
  }

  public setProperty(key: string, value: number | string | boolean): void {
    if (key === 'lux' || key === 'light') {
      this.lux = Math.max(0, Math.min(65535, Math.round(Number(value))));
    }
  }

  public getReadings(): Record<string, number | string | boolean> {
    if (!this.isPowered) {
      return { lux: 0, status: 'UNPOWERED', i2cAddress: this.i2cAddress };
    }
    return {
      lux: this.lux,
      status: 'OK',
      i2cAddress: this.i2cAddress,
    };
  }

  public getConfigRanges() {
    return {
      lux: { min: 0, max: 65535, step: 25, unit: 'lx', label: 'Illuminance (Lux)' },
    };
  }
}
