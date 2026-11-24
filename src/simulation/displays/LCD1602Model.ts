import { DisplayModelData } from '../types/simulation';

export class LCD1602Model {
  public readonly id: string;
  public readonly name: string;
  public readonly typeId: string = 'lcd1602';
  public isPowered: boolean = false;
  public powerVoltage: number = 0;
  public readonly i2cAddress: string = '0x27';
  public isBacklightOn: boolean = true;
  public line1: string = 'IoT Lab Ready';
  public line2: string = 'System Online';

  constructor(id: string, name: string = 'LCD 16x2 I2C', i2cAddress: string = '0x27') {
    this.id = id;
    this.name = name;
    this.i2cAddress = i2cAddress;
  }

  public setPower(powered: boolean, voltage: number): void {
    this.isPowered = powered;
    this.powerVoltage = voltage;
  }

  public writeLine(row: 0 | 1, text: string): void {
    const formatted = text.slice(0, 16).padEnd(16, ' ');
    if (row === 0) {
      this.line1 = formatted;
    } else {
      this.line2 = formatted;
    }
  }

  public clear(): void {
    this.line1 = ' '.repeat(16);
    this.line2 = ' '.repeat(16);
  }

  public setBacklight(on: boolean): void {
    this.isBacklightOn = on;
  }

  public toModelData(): DisplayModelData {
    return {
      id: this.id,
      name: this.name,
      typeId: this.typeId,
      isPowered: this.isPowered,
      lines: [this.line1, this.line2],
      i2cAddress: this.i2cAddress,
    };
  }
}
