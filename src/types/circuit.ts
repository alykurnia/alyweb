import { Node, Edge } from '@xyflow/react';

export type PinType =
  | 'power_vcc'
  | 'power_gnd'
  | 'gpio_digital'
  | 'gpio_pwm'
  | 'gpio_analog'
  | 'comm_i2c'
  | 'comm_spi'
  | 'comm_uart'
  | 'comm_onewire'
  | 'passive';

export type VoltageLevel = '3.3V' | '5V' | '12V' | 'GND' | 'VARIABLE';

export type PinDirection = 'input' | 'output' | 'bidirectional';

export interface ComponentPin {
  id: string; // e.g. "pin-vcc", "pin-gpio21"
  name: string; // e.g. "3V3", "GND", "GPIO21"
  label?: string; // Optional longer label
  type: PinType;
  voltage: VoltageLevel;
  direction: PinDirection;
  position: 'left' | 'right' | 'top' | 'bottom';
  description?: string;
  pinNumber?: number | string;
}

export type ComponentCategory =
  | 'microcontroller'
  | 'sensor'
  | 'actuator'
  | 'display'
  | 'communication'
  | 'passive'
  | 'power';

export interface ComponentDefinition {
  typeId: string; // e.g. "esp32-devkit", "dht22", "arduino-uno"
  name: string;
  category: ComponentCategory;
  nodeType: 'esp32Node' | 'arduinoNode' | 'sensorNode' | 'actuatorNode' | 'displayNode' | 'genericNode';
  description: string;
  dimensions: { width: number; height: number };
  pins: ComponentPin[];
  defaultProperties: Record<string, unknown>;
  voltage: string;
  iconName: string;
}

export interface CircuitNodeData {
  label: string;
  componentTypeId: string;
  componentDefinition: ComponentDefinition;
  properties: Record<string, unknown>;
  customColor?: string;
  [key: string]: unknown;
}

export interface CircuitEdgeData {
  signalType: PinType;
  wireColor: string;
  sourcePinName: string;
  targetPinName: string;
  sourceVoltage?: string;
  targetVoltage?: string;
  isCompatible?: boolean;
  warning?: string;
  [key: string]: unknown;
}

export type CircuitNode = Node<CircuitNodeData>;
export type CircuitEdge = Edge<CircuitEdgeData>;

export interface CircuitExportData {
  version: string;
  projectName: string;
  savedAt: string;
  nodes: CircuitNode[];
  edges: CircuitEdge[];
}
