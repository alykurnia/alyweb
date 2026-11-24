import { BaseActuatorModel, ActuatorInputSignal } from './BaseActuatorModel';

export class RelayModel extends BaseActuatorModel {
  public isEnergized: boolean = false;
  public triggerType: 'active-low' | 'active-high' = 'active-low';
  public contactState: 'NO_OPEN_NC_CLOSED' | 'NO_CLOSED_NC_OPEN' = 'NO_OPEN_NC_CLOSED';
  public clickCount: number = 0;

  constructor(id: string, name: string = 'Relay Module', triggerType: 'active-low' | 'active-high' = 'active-low') {
    super(id, name, 'relay');
    this.triggerType = triggerType;
  }

  public setTriggerType(type: 'active-low' | 'active-high'): void {
    this.triggerType = type;
  }

  public updateFromSignal(signal: ActuatorInputSignal): void {
    if (!this.isPowered) {
      this.isEnergized = false;
      this.contactState = 'NO_OPEN_NC_CLOSED';
      return;
    }

    const wasEnergized = this.isEnergized;

    if (this.triggerType === 'active-low') {
      this.isEnergized = signal.digital === 'LOW';
    } else {
      this.isEnergized = signal.digital === 'HIGH';
    }

    this.contactState = this.isEnergized ? 'NO_CLOSED_NC_OPEN' : 'NO_OPEN_NC_CLOSED';

    if (!wasEnergized && this.isEnergized) {
      this.clickCount++;
    }
  }

  public getState(): Record<string, number | string | boolean> {
    return {
      isEnergized: this.isEnergized,
      triggerType: this.triggerType,
      contactState: this.contactState,
      clickCount: this.clickCount,
      isPowered: this.isPowered,
    };
  }
}
