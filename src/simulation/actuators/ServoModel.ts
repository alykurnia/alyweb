import { BaseActuatorModel, ActuatorInputSignal } from './BaseActuatorModel';

export class ServoModel extends BaseActuatorModel {
  public angle: number = 90; // Default center 90 degrees (0 to 180)
  public targetAngle: number = 90;

  constructor(id: string, name: string = 'Servo Motor') {
    super(id, name, 'servo');
  }

  public setAngle(angle: number): void {
    this.targetAngle = Math.max(0, Math.min(180, Math.round(angle)));
    this.angle = this.targetAngle;
  }

  public updateFromSignal(signal: ActuatorInputSignal): void {
    if (!this.isPowered) {
      return;
    }

    // If PWM duty is provided (0 - 255)
    if (typeof signal.pwmDuty === 'number' && signal.pwmDuty >= 0) {
      // Map standard 8-bit PWM (0-255) to 0-180 degrees
      this.targetAngle = Math.max(0, Math.min(180, Math.round((signal.pwmDuty / 255) * 180)));
      this.angle = this.targetAngle;
    } else if (signal.digital === 'HIGH') {
      this.targetAngle = 180;
      this.angle = 180;
    } else {
      this.targetAngle = 0;
      this.angle = 0;
    }
  }

  public getState(): Record<string, number | string | boolean> {
    return {
      angle: this.angle,
      targetAngle: this.targetAngle,
      isPowered: this.isPowered,
    };
  }
}
