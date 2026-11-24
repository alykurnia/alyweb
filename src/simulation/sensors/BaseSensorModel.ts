import { SensorModelData } from '../types/simulation';

export abstract class BaseSensorModel {
  public readonly id: string;
  public readonly name: string;
  public readonly typeId: string;
  public isPowered: boolean = false;
  public powerVoltage: number = 0;

  constructor(id: string, name: string, typeId: string) {
    this.id = id;
    this.name = name;
    this.typeId = typeId;
  }

  public setPower(powered: boolean, voltage: number): void {
    this.isPowered = powered;
    this.powerVoltage = voltage;
  }

  public abstract setProperty(key: string, value: number | string | boolean): void;
  public abstract getReadings(): Record<string, number | string | boolean>;
  public abstract getConfigRanges(): Record<string, { min: number; max: number; step: number; unit: string; label: string }>;

  public toModelData(): SensorModelData {
    return {
      id: this.id,
      name: this.name,
      typeId: this.typeId,
      isPowered: this.isPowered,
      powerVoltage: this.powerVoltage,
      readings: this.getReadings(),
      configRanges: this.getConfigRanges(),
    };
  }
}
