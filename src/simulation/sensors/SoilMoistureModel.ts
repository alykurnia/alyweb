import { BaseSensorModel } from './BaseSensorModel';

export class SoilMoistureModel extends BaseSensorModel {
  public moisturePercent: number = 45.0; // %, range: 0 to 100

  constructor(id: string, name: string = 'Soil Moisture Probe') {
    super(id, name, 'soil-moisture');
  }

  public setProperty(key: string, value: number | string | boolean): void {
    if (key === 'moisture' || key === 'moisturePercent') {
      this.moisturePercent = Math.max(0, Math.min(100, Number(value)));
    }
  }

  public getAnalogVoltage(vref: number = 3.3): number {
    if (!this.isPowered) return 0;
    // Capacitive sensor inverse voltage curve: 100% wet = ~1.0V, 0% dry = ~3.0V
    const minV = 0.9;
    const maxV = Math.min(3.0, vref * 0.9);
    return Number((maxV - (this.moisturePercent / 100) * (maxV - minV)).toFixed(2));
  }

  public getReadings(): Record<string, number | string | boolean> {
    if (!this.isPowered) {
      return { moisture: 0, voltage: 0, analogVoltage: 0, status: 'UNPOWERED' };
    }
    const voltage = this.getAnalogVoltage(this.powerVoltage || 3.3);
    return {
      moisture: Number(this.moisturePercent.toFixed(1)),
      voltage,
      analogVoltage: voltage,
      status: 'OK',
    };
  }

  public getConfigRanges() {
    return {
      moisture: { min: 0, max: 100, step: 1, unit: '%', label: 'Soil Moisture Level' },
    };
  }
}

