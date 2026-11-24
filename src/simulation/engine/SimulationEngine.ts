import { CircuitNode, CircuitEdge } from '../../types/circuit';
import {
  SimulationState,
  SimulationLogEntry,
  CircuitValidationIssue,
  VirtualPinState,
  SensorModelData,
  ActuatorModelData,
  DisplayModelData,
  PinMode,
  DigitalState,
} from '../types/simulation';
import { SimulationEventBus } from '../events/SimulationEventBus';
import { SimulationClock } from './SimulationClock';
import { CircuitValidator } from '../validation/CircuitValidator';
import { GpioController } from '../gpio/GpioController';

// Sensors
import { BaseSensorModel } from '../sensors/BaseSensorModel';
import { DHT22Model } from '../sensors/DHT22Model';
import { DHT11Model } from '../sensors/DHT11Model';
import { UltrasonicModel } from '../sensors/UltrasonicModel';
import { SoilMoistureModel } from '../sensors/SoilMoistureModel';
import { DS18B20Model } from '../sensors/DS18B20Model';
import { MQ135Model } from '../sensors/MQ135Model';
import { BH1750Model } from '../sensors/BH1750Model';
import { BMP280Model } from '../sensors/BMP280Model';

// Actuators
import { BaseActuatorModel } from '../actuators/BaseActuatorModel';
import { LEDModel } from '../actuators/LEDModel';
import { RelayModel } from '../actuators/RelayModel';
import { ServoModel } from '../actuators/ServoModel';
import { BuzzerModel } from '../actuators/BuzzerModel';

// Displays
import { LCD1602Model } from '../displays/LCD1602Model';
import { OLEDModel } from '../displays/OLEDModel';

export class SimulationEngine {
  public readonly eventBus: SimulationEventBus = new SimulationEventBus();
  public readonly clock: SimulationClock;

  private state: SimulationState = 'idle';
  private nodes: CircuitNode[] = [];
  private edges: CircuitEdge[] = [];
  private validationIssues: CircuitValidationIssue[] = [];

  // Active models
  private mcuControllers: Map<string, GpioController> = new Map();
  private sensorModels: Map<string, BaseSensorModel> = new Map();
  private actuatorModels: Map<string, BaseActuatorModel> = new Map();
  private displayModels: Map<string, LCD1602Model | OLEDModel> = new Map();

  // Internal log buffer
  private logs: SimulationLogEntry[] = [];
  private logIdCounter: number = 0;

  // Track previous actuator states to log only on transitions
  private prevActuatorStates: Map<string, string> = new Map();

  constructor() {
    this.clock = new SimulationClock((elapsedMs, dt) => this.onTick(elapsedMs, dt));
  }

  public getState(): SimulationState {
    return this.state;
  }

  public getValidationIssues(): CircuitValidationIssue[] {
    return this.validationIssues;
  }

  public getLogs(): SimulationLogEntry[] {
    return this.logs;
  }

  /**
   * Load and parse a circuit topology.
   */
  public loadCircuit(nodes: CircuitNode[], edges: CircuitEdge[]): void {
    this.nodes = nodes;
    this.edges = edges;

    // Reset models
    this.mcuControllers.clear();
    this.sensorModels.clear();
    this.actuatorModels.clear();
    this.displayModels.clear();
    this.prevActuatorStates.clear();

    // Instantiate MCU Controllers
    for (const node of nodes) {
      const typeId = node.data.componentTypeId;

      if (['esp32-devkit', 'arduino-uno', 'esp8266-nodemcu'].includes(typeId)) {
        this.mcuControllers.set(node.id, new GpioController(typeId, node.data.componentDefinition?.pins));
      } else if (typeId === 'dht22') {
        this.sensorModels.set(node.id, new DHT22Model(node.id, node.data.label));
      } else if (typeId === 'dht11') {
        this.sensorModels.set(node.id, new DHT11Model(node.id, node.data.label));
      } else if (typeId === 'hc-sr04' || typeId === 'ultrasonic') {
        this.sensorModels.set(node.id, new UltrasonicModel(node.id, node.data.label));
      } else if (typeId === 'soil-moisture') {
        this.sensorModels.set(node.id, new SoilMoistureModel(node.id, node.data.label));
      } else if (typeId === 'ds18b20') {
        this.sensorModels.set(node.id, new DS18B20Model(node.id, node.data.label));
      } else if (typeId === 'mq135') {
        this.sensorModels.set(node.id, new MQ135Model(node.id, node.data.label));
      } else if (typeId === 'bh1750') {
        this.sensorModels.set(node.id, new BH1750Model(node.id, node.data.label));
      } else if (typeId === 'bmp280') {
        this.sensorModels.set(node.id, new BMP280Model(node.id, node.data.label));
      } else if (typeId === 'led') {
        this.actuatorModels.set(node.id, new LEDModel(node.id, node.data.label));
      } else if (typeId === 'relay' || typeId === 'relay-module') {
        this.actuatorModels.set(node.id, new RelayModel(node.id, node.data.label));
      } else if (typeId === 'servo' || typeId === 'servo-sg90') {
        this.actuatorModels.set(node.id, new ServoModel(node.id, node.data.label));
      } else if (typeId === 'buzzer') {
        this.actuatorModels.set(node.id, new BuzzerModel(node.id, node.data.label));
      } else if (typeId === 'lcd1602' || typeId === 'lcd-16x2-i2c') {
        this.displayModels.set(node.id, new LCD1602Model(node.id, node.data.label));
      } else if (typeId === 'oled' || typeId === 'oled-096-i2c') {
        this.displayModels.set(node.id, new OLEDModel(node.id, node.data.label));
      }
    }

    // Run structural and voltage validation
    this.validationIssues = CircuitValidator.validate(this.nodes, this.edges);
    this.eventBus.emit('validation_issues', this.validationIssues);

    this.evaluatePowerDistribution();
    this.mapCircuitConnections();
  }

  /**
   * Start simulation
   */
  public start(): boolean {
    if (this.nodes.length === 0) {
      this.addLog('WARNING', 'Cannot start simulation: Circuit workspace is empty.');
      return false;
    }

    // Check for FATAL validation issues
    const fatalIssue = this.validationIssues.find((i) => i.severity === 'FATAL');
    if (fatalIssue) {
      this.setState('error');
      this.addLog('ERROR', `SIMULATION ABORTED: ${fatalIssue.message}`);
      return false;
    }

    this.setState('running');
    this.clock.start();
    this.addLog('INFO', `Simulation started. Initialized ${this.nodes.length} components and ${this.edges.length} wires.`);

    return true;
  }

  public pause(): void {
    if (this.state !== 'running') return;
    this.clock.pause();
    this.setState('paused');
    this.addLog('INFO', 'Simulation paused.');
  }

  public resume(): void {
    if (this.state !== 'paused') return;
    this.clock.resume();
    this.setState('running');
    this.addLog('INFO', 'Simulation resumed.');
  }

  public stop(): void {
    this.clock.stop();
    this.setState('stopped');
    this.addLog('INFO', 'Simulation stopped.');
  }

  public reset(): void {
    this.clock.reset();
    this.setState('idle');
    this.logs = [];
    this.prevActuatorStates.clear();
    this.loadCircuit(this.nodes, this.edges);
    this.addLog('INFO', 'Simulation reset to initial state.');
  }

  public setSpeed(speed: number): void {
    this.clock.setSpeed(speed);
    this.addLog('INFO', `Simulation speed set to ${speed}x.`);
  }

  /**
   * Set user-configurable property on a sensor (e.g. Temperature slider, distance slider).
   */
  public setSensorProperty(sensorId: string, property: string, value: number | string | boolean): void {
    const sensor = this.sensorModels.get(sensorId);
    if (sensor) {
      sensor.setProperty(property, value);
      this.eventBus.emit('sensor_updated', sensor.toModelData());
      this.addLog('SENSOR', `${sensor.name}: ${property} set to ${value}`, sensor.id);
    }
  }

  /**
   * Manually toggle a virtual GPIO pin state (e.g., HIGH/LOW) for interactive testing.
   */
  public togglePin(mcuNodeId: string, pinId: string): void {
    const mcu = this.mcuControllers.get(mcuNodeId);
    if (!mcu) return;

    const currentPin = mcu.getPin(pinId);
    if (!currentPin) return;

    if (currentPin.mode !== 'OUTPUT' && currentPin.mode !== 'PWM_OUTPUT') {
      const modeResult = mcu.setPinMode(pinId, 'OUTPUT');
      if (!modeResult.success) {
        this.addLog('ERROR', modeResult.error || `Failed to set ${pinId} to OUTPUT`, mcuNodeId, pinId);
        return;
      }
    }

    const nextVal = currentPin.digitalValue === 'HIGH' ? 'LOW' : 'HIGH';
    mcu.digitalWrite(pinId, nextVal);
    this.addLog('GPIO', `${mcu.boardName} ${currentPin.pinName} set to ${nextVal}`, mcuNodeId, pinId);

    // Immediate propagation to connected actuators
    this.propagateSignals();
  }

  /**
   * Set PWM duty cycle on a pin (0 to 255).
   */
  public setPinPwm(mcuNodeId: string, pinId: string, duty: number): void {
    const mcu = this.mcuControllers.get(mcuNodeId);
    if (!mcu) return;

    mcu.analogWrite(pinId, duty);
    this.propagateSignals();
  }

  /**
   * Returns the ID of the first active MCU in the circuit, if any.
   */
  public getFirstMcuId(): string | undefined {
    const first = this.mcuControllers.keys().next();
    return first.done ? undefined : first.value;
  }

  /**
   * Returns the board type of the first active MCU in the circuit, if any.
   */
  public getFirstMcuBoardType(): string | undefined {
    const first = this.mcuControllers.values().next();
    return first.done ? undefined : first.value.boardTypeId;
  }

  /**
   * Resolve an MCU controller and pin ID from pin number (e.g. 2, "2", "GPIO2", "pin-d2", "A0").
   */
  public resolveMcuAndPin(pin?: number | string, mcuNodeId?: string): { mcu: GpioController; pinId: string } | null {
    let mcu: GpioController | undefined;
    if (mcuNodeId) {
      mcu = this.mcuControllers.get(mcuNodeId);
    }
    if (!mcu) {
      const firstEntry = this.mcuControllers.entries().next();
      if (!firstEntry.done) {
        mcu = firstEntry.value[1];
      }
    }
    if (!mcu || pin === undefined || pin === null) return null;

    const rawStr = String(pin).trim().toLowerCase();
    const cleanNum = rawStr.replace(/^(gpio|pin-|d|a)/, '');

    const candidates = [
      rawStr,
      `pin-${rawStr}`,
      `pin-d${cleanNum}`,
      `pin-gpio${cleanNum}`,
      `pin-a${cleanNum}`,
      cleanNum,
    ];

    for (const cand of candidates) {
      const p = mcu.getPin(cand);
      if (p) return { mcu, pinId: cand };
    }

    for (const p of mcu.getAllPins()) {
      if (
        String(p.pinNumber) === cleanNum ||
        p.pinName.toLowerCase() === rawStr ||
        p.pinName.toLowerCase() === `d${cleanNum}` ||
        p.pinName.toLowerCase() === `gpio${cleanNum}` ||
        p.pinName.toLowerCase() === `a${cleanNum}`
      ) {
        return { mcu, pinId: p.pinId };
      }
    }

    return null;
  }

  /**
   * Arduino runtime API: pinMode()
   */
  public arduinoPinMode(pin: number | string, mode: PinMode, mcuNodeId?: string): boolean {
    const target = this.resolveMcuAndPin(pin, mcuNodeId);
    if (!target) return false;
    const res = target.mcu.setPinMode(target.pinId, mode);
    return res.success;
  }

  /**
   * Arduino runtime API: digitalWrite()
   */
  public arduinoDigitalWrite(pin: number | string, val: DigitalState, mcuNodeId?: string): boolean {
    const target = this.resolveMcuAndPin(pin, mcuNodeId);
    if (!target) return false;
    const res = target.mcu.digitalWrite(target.pinId, val);
    if (res.success) {
      this.propagateSignals();
    }
    return res.success;
  }

  /**
   * Arduino runtime API: digitalRead()
   */
  public arduinoDigitalRead(pin: number | string, mcuNodeId?: string): DigitalState {
    const target = this.resolveMcuAndPin(pin, mcuNodeId);
    if (!target) return 'LOW';

    const pinState = target.mcu.getPin(target.pinId);
    if (pinState) {
      let connectedSensorId = pinState.connectedTo?.componentId;
      if (!connectedSensorId) {
        const edge = this.edges.find(
          (e) =>
            (e.targetHandle === target.pinId && this.sensorModels.has(e.source)) ||
            (e.sourceHandle === target.pinId && this.sensorModels.has(e.target))
        );
        if (edge) {
          connectedSensorId = this.sensorModels.has(edge.source) ? edge.source : edge.target;
        }
      }

      if (connectedSensorId) {
        const sensor = this.sensorModels.get(connectedSensorId);
        if (sensor && 'getDigitalOut' in sensor && typeof (sensor as any).getDigitalOut === 'function') {
          pinState.digitalValue = (sensor as any).getDigitalOut();
        }
      }
    }

    return target.mcu.digitalRead(target.pinId);
  }

  /**
   * Arduino runtime API: analogWrite() (PWM)
   */
  public arduinoAnalogWrite(pin: number | string, duty: number, mcuNodeId?: string): boolean {
    const target = this.resolveMcuAndPin(pin, mcuNodeId);
    if (!target) return false;
    const res = target.mcu.analogWrite(target.pinId, duty);
    if (res.success) {
      this.propagateSignals();
    }
    return res.success;
  }

  /**
   * Arduino runtime API: analogRead()
   */
  public arduinoAnalogRead(pin: number | string, mcuNodeId?: string): number {
    const target = this.resolveMcuAndPin(pin, mcuNodeId);
    if (!target) return 0;

    const pinState = target.mcu.getPin(target.pinId);
    if (pinState) {
      let connectedSensorId = pinState.connectedTo?.componentId;
      if (!connectedSensorId) {
        const edge = this.edges.find(
          (e) =>
            (e.targetHandle === target.pinId && this.sensorModels.has(e.source)) ||
            (e.sourceHandle === target.pinId && this.sensorModels.has(e.target))
        );
        if (edge) {
          connectedSensorId = this.sensorModels.has(edge.source) ? edge.source : edge.target;
        }
      }

      if (connectedSensorId) {
        const sensor = this.sensorModels.get(connectedSensorId);
        if (sensor) {
          let sensorVoltage = 0;
          if ('getAnalogVoltage' in sensor && typeof (sensor as any).getAnalogVoltage === 'function') {
            sensorVoltage = (sensor as any).getAnalogVoltage(target.mcu.profile.maxVoltage);
          } else {
            const readings = sensor.getReadings();
            sensorVoltage = Number(readings.analogVoltage || readings.voltage || 0);
          }
          target.mcu.setAnalogVoltage(target.pinId, sensorVoltage);
        }
      }
    }

    return target.mcu.analogRead(target.pinId);
  }

  /**
   * Retrieve all live sensor states.
   */
  public getAllSensorData(): SensorModelData[] {
    return Array.from(this.sensorModels.values()).map((s) => s.toModelData());
  }

  /**
   * Retrieve all live actuator states.
   */
  public getAllActuatorData(): ActuatorModelData[] {
    return Array.from(this.actuatorModels.values()).map((a) => a.toModelData());
  }

  /**
   * Retrieve all live display states.
   */
  public getAllDisplayData(): DisplayModelData[] {
    return Array.from(this.displayModels.values()).map((d) => d.toModelData());
  }

  /**
   * Retrieve all MCU pins.
   */
  public getAllMcuPins(): Record<string, VirtualPinState[]> {
    const res: Record<string, VirtualPinState[]> = {};
    this.mcuControllers.forEach((mcu, id) => {
      res[id] = mcu.getAllPins();
    });
    return res;
  }

  // -------------------------------------------------------------
  // Internal Simulation Cycles
  // -------------------------------------------------------------

  private onTick(elapsedMs: number, dt: number): void {
    if (this.state !== 'running') return;

    // 1. Power rail distribution
    this.evaluatePowerDistribution();

    // 2. Sensor reading update
    for (const sensor of this.sensorModels.values()) {
      this.eventBus.emit('sensor_updated', sensor.toModelData());
    }

    // 3. Autonomous interactive MCU loop based on active sensors and circuit wiring
    this.runAutonomousMcuLoop(elapsedMs);

    // 4. Signal propagation: MCU outputs -> connected Actuators & Displays
    this.propagateSignals();

    // 5. Update Displays with real live telemetry
    this.updateDisplays();

    // 6. Emit tick event with formatted time
    this.eventBus.emit('tick', {
      elapsedMs,
      dt,
      timeFormatted: this.clock.getFormattedTime(),
    });
  }

  /**
   * Determine power rail delivery (VCC & GND) for every component in the circuit.
   */
  private evaluatePowerDistribution(): void {
    const hasPowerSource =
      this.mcuControllers.size > 0 ||
      this.nodes.some((n) => n.data.componentDefinition?.category === 'power');

    for (const [id, sensor] of this.sensorModels.entries()) {
      const isConnectedToVcc = this.edges.some(
        (e) =>
          (e.target === id && e.targetHandle?.includes('vcc')) ||
          (e.source === id && e.sourceHandle?.includes('vcc'))
      );
      const isConnectedToGnd = this.edges.some(
        (e) =>
          (e.target === id && e.targetHandle?.includes('gnd')) ||
          (e.source === id && e.sourceHandle?.includes('gnd'))
      );

      const isPowered = hasPowerSource && isConnectedToVcc && isConnectedToGnd;
      sensor.setPower(isPowered, isPowered ? 3.3 : 0);
    }

    for (const [id, actuator] of this.actuatorModels.entries()) {
      if (actuator.typeId === 'led') {
        // LED is powered directly by Anode-Cathode potential difference
        actuator.setPower(true, 3.3);
      } else {
        const isConnectedToVcc = this.edges.some(
          (e) =>
            (e.target === id && e.targetHandle?.includes('vcc')) ||
            (e.source === id && e.sourceHandle?.includes('vcc'))
        );
        const isConnectedToGnd = this.edges.some(
          (e) =>
            (e.target === id && e.targetHandle?.includes('gnd')) ||
            (e.source === id && e.sourceHandle?.includes('gnd'))
        );
        const isPowered = hasPowerSource && isConnectedToVcc && isConnectedToGnd;
        actuator.setPower(isPowered, isPowered ? 5.0 : 0);
      }
    }

    for (const [id, display] of this.displayModels.entries()) {
      const isConnectedToVcc = this.edges.some(
        (e) =>
          (e.target === id && e.targetHandle?.includes('vcc')) ||
          (e.source === id && e.sourceHandle?.includes('vcc'))
      );
      const isConnectedToGnd = this.edges.some(
        (e) =>
          (e.target === id && e.targetHandle?.includes('gnd')) ||
          (e.source === id && e.sourceHandle?.includes('gnd'))
      );
      const isPowered = hasPowerSource && isConnectedToVcc && isConnectedToGnd;
      display.setPower(isPowered, isPowered ? 5.0 : 0);
    }
  }

  /**
   * Connect and configure pin maps between MCU and components.
   */
  private mapCircuitConnections(): void {
    const nodeMap = new Map<string, CircuitNode>(this.nodes.map((n) => [n.id, n]));

    for (const [mcuId, mcu] of this.mcuControllers.entries()) {
      const mcuEdges = this.edges.filter((e) => e.source === mcuId || e.target === mcuId);

      for (const edge of mcuEdges) {
        const isMcuSource = edge.source === mcuId;
        const mcuPinId = isMcuSource ? edge.sourceHandle : edge.targetHandle;
        const otherNodeId = isMcuSource ? edge.target : edge.source;
        const otherPinId = isMcuSource ? edge.targetHandle : edge.sourceHandle;

        if (!mcuPinId || !otherNodeId || !otherPinId) continue;

        const otherNode = nodeMap.get(otherNodeId);
        if (!otherNode) continue;

        const otherPin = otherNode.data.componentDefinition?.pins?.find((p) => p.id === otherPinId);

        // Configure default pin modes on the MCU according to what is connected
        if (otherNode.data.componentDefinition?.category === 'actuator') {
          // Actuator control pins are driven by MCU outputs
          if (!mcu.isInputOnly(mcuPinId)) {
            if (mcu.isPwmCapable(mcuPinId)) {
              mcu.setPinMode(mcuPinId, 'PWM_OUTPUT');
            } else {
              mcu.setPinMode(mcuPinId, 'OUTPUT');
            }
          }
        } else if (otherNode.data.componentDefinition?.category === 'sensor') {
          // Sensor reading pins feed into MCU inputs
          if (otherPin?.type === 'gpio_analog') {
            mcu.setPinMode(mcuPinId, 'ANALOG_INPUT');
          } else {
            mcu.setPinMode(mcuPinId, 'INPUT');
          }
        }

        mcu.setConnectedTarget(mcuPinId, {
          componentId: otherNodeId,
          componentName: otherNode.data.label,
          pinId: otherPinId,
          pinName: otherPin?.name || otherPinId,
        });
      }
    }
  }

  /**
   * Autonomous IoT Controller behavior:
   * Provides realistic interaction when components are wired together.
   */
  private runAutonomousMcuLoop(elapsedMs: number): void {
    for (const [, mcu] of this.mcuControllers.entries()) {
      // Find connected ultrasonic sensor
      const ultrasonic = Array.from(this.sensorModels.values()).find(
        (s) => s.typeId === 'hc-sr04' && s.isPowered
      ) as UltrasonicModel | undefined;

      // Find connected soil sensor
      const soil = Array.from(this.sensorModels.values()).find(
        (s) => s.typeId === 'soil-moisture' && s.isPowered
      ) as SoilMoistureModel | undefined;

      // 1. If HC-SR04 obstacle distance < 20cm, automatically trigger connected alerts (e.g. buzzer / LED)
      if (ultrasonic) {
        const dist = ultrasonic.distance;
        for (const pin of mcu.getAllPins()) {
          if (pin.connectedTo) {
            const targetActuator = this.actuatorModels.get(pin.connectedTo.componentId);
            if (targetActuator) {
              if (targetActuator.typeId === 'servo') {
                // Map distance (2-200cm) to servo angle (0-180deg)
                const angle = Math.round(Math.min(180, Math.max(0, (dist / 100) * 180)));
                mcu.analogWrite(pin.pinId, Math.round((angle / 180) * 255));
              } else if (targetActuator.typeId === 'led' || targetActuator.typeId === 'buzzer') {
                // Trigger warning if obstacle is close (< 25cm)
                if (dist <= 25) {
                  mcu.digitalWrite(pin.pinId, 'HIGH');
                }
              }
            }
          }
        }
      }

      // 2. If Soil Moisture is low (< 30%), trigger relay (pump activation)
      if (soil) {
        const moisture = soil.moisturePercent;
        for (const pin of mcu.getAllPins()) {
          if (pin.connectedTo) {
            const targetActuator = this.actuatorModels.get(pin.connectedTo.componentId);
            if (targetActuator && targetActuator.typeId === 'relay') {
              // Dry soil -> energize relay (active LOW or HIGH)
              mcu.digitalWrite(pin.pinId, moisture < 35 ? 'LOW' : 'HIGH');
            }
          }
        }
      }

      // 3. Heartbeat blink demo on default onboard LED (GPIO 2 on ESP32, Pin 13 on Arduino)
      const heartbeatPin = mcu.getPin('pin-gpio2') || mcu.getPin('pin-d13');
      if (heartbeatPin && heartbeatPin.mode === 'OUTPUT' && !heartbeatPin.connectedTo) {
        const isBlinkHigh = Math.floor(elapsedMs / 1000) % 2 === 0;
        mcu.digitalWrite(heartbeatPin.pinId, isBlinkHigh ? 'HIGH' : 'LOW');
      }
    }
  }

  /**
   * Propagate MCU output pins to connected Actuators.
   */
  private propagateSignals(): void {
    for (const [, mcu] of this.mcuControllers.entries()) {
      for (const pin of mcu.getAllPins()) {
        if (!pin.connectedTo) continue;

        const actuator = this.actuatorModels.get(pin.connectedTo.componentId);
        if (!actuator) continue;

        // Propagate digital & PWM values
        actuator.updateFromSignal({
          digital: pin.digitalValue,
          pwmDuty: pin.pwmDuty,
          voltage: pin.voltage,
          frequency: pin.frequency,
        });

        const stateJson = JSON.stringify(actuator.getState());
        const prevState = this.prevActuatorStates.get(actuator.id);

        if (prevState !== stateJson) {
          this.prevActuatorStates.set(actuator.id, stateJson);
          this.eventBus.emit('actuator_updated', actuator.toModelData());

          // Log significant state changes
          if (actuator.typeId === 'led') {
            const led = actuator as LEDModel;
            this.addLog(
              'ACTUATOR',
              `LED "${led.name}" turned ${led.isOn ? 'ON (Brightness: ' + led.brightness + '%)' : 'OFF'}`,
              actuator.id
            );
          } else if (actuator.typeId === 'relay') {
            const relay = actuator as RelayModel;
            this.addLog(
              'ACTUATOR',
              `Relay "${relay.name}" ${relay.isEnergized ? 'ENERGIZED (Contacts Closed)' : 'DE-ENERGIZED (Contacts Open)'}`,
              actuator.id
            );
          } else if (actuator.typeId === 'servo') {
            const servo = actuator as ServoModel;
            this.addLog('ACTUATOR', `Servo "${servo.name}" rotated to ${servo.angle}°`, actuator.id);
          } else if (actuator.typeId === 'buzzer') {
            const buzzer = actuator as BuzzerModel;
            if (buzzer.isSounding) {
              this.addLog('ACTUATOR', `Buzzer "${buzzer.name}" active (${buzzer.frequency} Hz)`, actuator.id);
            }
          }
        }
      }
    }
  }

  /**
   * Update connected LCD and OLED displays with live sensor telemetry.
   */
  private updateDisplays(): void {
    // Gather summary readings
    const sensorList = Array.from(this.sensorModels.values()).filter((s) => s.isPowered);
    const dht = sensorList.find((s) => s.typeId === 'dht22' || s.typeId === 'dht11') as
      | DHT22Model
      | DHT11Model
      | undefined;
    const ultrasonic = sensorList.find((s) => s.typeId === 'hc-sr04') as UltrasonicModel | undefined;
    const soil = sensorList.find((s) => s.typeId === 'soil-moisture') as SoilMoistureModel | undefined;
    const mq = sensorList.find((s) => s.typeId === 'mq135') as MQ135Model | undefined;
    const bh = sensorList.find((s) => s.typeId === 'bh1750') as BH1750Model | undefined;
    const bmp = sensorList.find((s) => s.typeId === 'bmp280') as BMP280Model | undefined;

    for (const display of this.displayModels.values()) {
      if (!display.isPowered) {
        display.clear();
        this.eventBus.emit('display_updated', display.toModelData());
        continue;
      }

      if (display.typeId === 'lcd1602') {
        const lcd = display as LCD1602Model;
        if (dht) {
          lcd.writeLine(0, `T:${dht.temperature}C H:${dht.humidity}%`);
        } else if (soil) {
          lcd.writeLine(0, `Soil Moist:${soil.moisturePercent}%`);
        } else if (mq) {
          lcd.writeLine(0, `Air Qual:${mq.ppm}ppm`);
        } else {
          lcd.writeLine(0, 'IoT Lab Active');
        }

        if (ultrasonic) {
          lcd.writeLine(1, `Dist: ${ultrasonic.distance} cm`);
        } else if (bh) {
          lcd.writeLine(1, `Light: ${bh.lux} lx`);
        } else if (bmp) {
          lcd.writeLine(1, `Press: ${bmp.pressure}hPa`);
        } else {
          lcd.writeLine(1, 'Sensors Online');
        }

        this.eventBus.emit('display_updated', lcd.toModelData());
      } else if (display.typeId === 'oled') {
        const oled = display as OLEDModel;
        const lines: string[] = ['-- IoT Lab SSD1306 --'];

        if (dht) {
          lines.push(`Temp: ${dht.temperature}C | Hum: ${dht.humidity}%`);
        }
        if (ultrasonic) {
          lines.push(`Distance: ${ultrasonic.distance} cm`);
        }
        if (soil) {
          lines.push(`Soil Moisture: ${soil.moisturePercent}%`);
        }
        if (mq) {
          lines.push(`Gas MQ135: ${mq.ppm} PPM`);
        }
        if (bh) {
          lines.push(`Lux: ${bh.lux} lx`);
        }
        if (bmp) {
          lines.push(`Pres: ${bmp.pressure} hPa`);
        }

        while (lines.length < 4) {
          lines.push('System: OK');
        }

        oled.setLines(lines);
        this.eventBus.emit('display_updated', oled.toModelData());
      }
    }
  }

  private setState(newState: SimulationState): void {
    this.state = newState;
    this.eventBus.emit('state_changed', newState);
  }

  private addLog(
    level: 'INFO' | 'GPIO' | 'SENSOR' | 'ACTUATOR' | 'WARNING' | 'ERROR',
    message: string,
    componentId?: string,
    pin?: string
  ): void {
    const entry: SimulationLogEntry = {
      id: `log-${++this.logIdCounter}`,
      timestamp: this.clock.getElapsedMs(),
      timeFormatted: this.clock.getFormattedTime(),
      level,
      componentId,
      pin,
      message,
    };
    this.logs.push(entry);
    if (this.logs.length > 500) {
      this.logs.shift();
    }
    this.eventBus.emit('log', entry);
  }
}
