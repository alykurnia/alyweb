import {
  SimulationState,
  SimulationLogEntry,
  VirtualPinState,
  CircuitValidationIssue,
  SensorModelData,
  ActuatorModelData,
  DisplayModelData,
} from '../types/simulation';

export interface SimulationTickPayload {
  elapsedMs: number;
  dt?: number;
  timeFormatted: string;
  tickCount?: number;
}

export type EventPayloadMap = {
  state_changed: SimulationState;
  tick: SimulationTickPayload;
  log: SimulationLogEntry;
  gpio_changed: { mcuId: string; pinState: VirtualPinState };
  sensor_updated: SensorModelData;
  actuator_updated: ActuatorModelData;
  display_updated: DisplayModelData;
  validation_issues: CircuitValidationIssue[];
};

export type SimulationEvent = keyof EventPayloadMap;

export class SimulationEventBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private listeners: Map<SimulationEvent, Set<(data: any) => void>> = new Map();

  public on<E extends SimulationEvent>(
    event: E,
    callback: (data: EventPayloadMap[E]) => void
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.listeners.get(event)!.add(callback as (data: any) => void);

    // Return un-subscriber
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.listeners.get(event)?.delete(callback as (data: any) => void);
    };
  }

  public emit<E extends SimulationEvent>(event: E, data: EventPayloadMap[E]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in SimulationEventBus listener for "${event}":`, err);
        }
      });
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}
