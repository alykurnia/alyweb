import { ActuatorModelData, DigitalState } from '../types/simulation';

export interface ActuatorInputSignal {
  digital: DigitalState;
  pwmDuty?: number; // 0 - 255
  voltage?: number; // Volts
  frequency?: number; // Hz
}

export abstract class BaseActuatorModel {
  public readonly id: string;
  public readonly name: string;
  public readonly typeId: string;
  public isPowered: boolean = true; // Many components derive power directly from signal or separate VCC
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

  public abstract updateFromSignal(signal: ActuatorInputSignal): void;
  public abstract getState(): Record<string, number | string | boolean>;

  public toModelData(): ActuatorModelData {
    return {
      id: this.id,
      name: this.name,
      typeId: this.typeId,
      isPowered: this.isPowered,
      state: this.getState(),
    };
  }
}
