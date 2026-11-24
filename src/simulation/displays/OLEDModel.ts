import { DisplayModelData } from '../types/simulation';

export class OLEDModel {
  public readonly id: string;
  public readonly name: string;
  public readonly typeId: string = 'oled';
  public isPowered: boolean = false;
  public powerVoltage: number = 0;
  public readonly i2cAddress: string = '0x3C';
  public lines: string[] = [
    'IoT Lab Engine',
    'SSD1306 128x64',
    'Status: ACTIVE',
    'Sensors: OK',
  ];

  constructor(id: string, name: string = 'OLED 0.96 I2C', i2cAddress: string = '0x3C') {
    this.id = id;
    this.name = name;
    this.i2cAddress = i2cAddress;
  }

  public setPower(powered: boolean, voltage: number): void {
    this.isPowered = powered;
    this.powerVoltage = voltage;
  }

  public writeLine(row: number, text: string): void {
    if (row >= 0 && row < 4) {
      this.lines[row] = text.slice(0, 20);
    }
  }

  public setLines(lines: string[]): void {
    this.lines = lines.slice(0, 4).map((l) => l.slice(0, 20));
  }

  public clear(): void {
    this.lines = ['', '', '', ''];
  }

  public toModelData(): DisplayModelData {
    return {
      id: this.id,
      name: this.name,
      typeId: this.typeId,
      isPowered: this.isPowered,
      lines: [...this.lines],
      i2cAddress: this.i2cAddress,
    };
  }
}
