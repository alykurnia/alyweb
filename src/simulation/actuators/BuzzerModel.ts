import { BaseActuatorModel, ActuatorInputSignal } from './BaseActuatorModel';

export class BuzzerModel extends BaseActuatorModel {
  public isSounding: boolean = false;
  public frequency: number = 2048; // Hz (typical piezo resonant frequency)
  public toneName: string = 'Beep';

  constructor(id: string, name: string = 'Buzzer') {
    super(id, name, 'buzzer');
  }

  public updateFromSignal(signal: ActuatorInputSignal): void {
    if (!this.isPowered) {
      this.isSounding = false;
      return;
    }

    if (signal.digital === 'HIGH' || (signal.pwmDuty && signal.pwmDuty > 0)) {
      this.isSounding = true;
      if (signal.frequency && signal.frequency > 0) {
        this.frequency = signal.frequency;
        this.toneName = `${this.frequency} Hz`;
      } else {
        this.frequency = 2048;
        this.toneName = '2048 Hz Beep';
      }
    } else {
      this.isSounding = false;
    }
  }

  public getState(): Record<string, number | string | boolean> {
    return {
      isSounding: this.isSounding,
      frequency: this.frequency,
      toneName: this.toneName,
      isPowered: this.isPowered,
    };
  }
}
