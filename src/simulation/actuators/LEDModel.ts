import { BaseActuatorModel, ActuatorInputSignal } from './BaseActuatorModel';

export class LEDModel extends BaseActuatorModel {
  public isOn: boolean = false;
  public brightness: number = 0; // 0 to 100 (%)
  public color: string = 'red';
  public hasResistor: boolean = true;
  public isBurntOut: boolean = false;

  constructor(id: string, name: string = 'LED', color: string = 'red') {
    super(id, name, 'led');
    this.color = color;
  }

  public setColor(color: string): void {
    this.color = color;
  }

  public setHasResistor(hasResistor: boolean): void {
    this.hasResistor = hasResistor;
  }

  public updateFromSignal(signal: ActuatorInputSignal): void {
    if (this.isBurntOut) {
      this.isOn = false;
      this.brightness = 0;
      return;
    }

    // If driven by PWM duty (0-255)
    if (typeof signal.pwmDuty === 'number' && signal.pwmDuty > 0) {
      this.isOn = true;
      this.brightness = Math.round((signal.pwmDuty / 255) * 100);
    } else if (signal.digital === 'HIGH' || (signal.voltage !== undefined && signal.voltage >= 2.0)) {
      this.isOn = true;
      this.brightness = 100;
    } else {
      this.isOn = false;
      this.brightness = 0;
    }

    // Warning check: if voltage > 3.6V without current-limiting resistor, it would burn out
    if (!this.hasResistor && signal.voltage !== undefined && signal.voltage > 3.6 && this.isOn) {
      // Burned out!
      this.isBurntOut = true;
      this.isOn = false;
      this.brightness = 0;
    }
  }

  public getState(): Record<string, number | string | boolean> {
    return {
      isOn: this.isOn,
      brightness: this.brightness,
      color: this.color,
      isBurntOut: this.isBurntOut,
      hasResistor: this.hasResistor,
    };
  }
}
