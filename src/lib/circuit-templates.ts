import { CircuitNode, CircuitEdge } from '@/types/circuit';
import { COMPONENT_DEFINITIONS } from './component-definitions';

export interface CircuitTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CircuitNode[];
  edges: CircuitEdge[];
}

export const CIRCUIT_TEMPLATES: CircuitTemplate[] = [
  {
    id: 'esp32-dht-oled',
    name: 'ESP32 Weather Station (DHT22 + OLED)',
    description: 'ESP32 DevKit reading temperature & humidity from DHT22 and displaying live metrics on an SSD1306 OLED.',
    nodes: [
      {
        id: 'node-esp32-1',
        type: 'esp32Node',
        position: { x: 100, y: 80 },
        data: {
          label: 'ESP32 DevKit V1 (Main MCU)',
          componentTypeId: 'esp32-devkit',
          componentDefinition: COMPONENT_DEFINITIONS['esp32-devkit'],
          properties: { ...COMPONENT_DEFINITIONS['esp32-devkit'].defaultProperties },
        },
      },
      {
        id: 'node-dht22-1',
        type: 'sensorNode',
        position: { x: 420, y: 80 },
        data: {
          label: 'DHT22 Environmental Sensor',
          componentTypeId: 'dht22',
          componentDefinition: COMPONENT_DEFINITIONS['dht22'],
          properties: { ...COMPONENT_DEFINITIONS['dht22'].defaultProperties },
        },
      },
      {
        id: 'node-oled-1',
        type: 'displayNode',
        position: { x: 420, y: 280 },
        data: {
          label: 'OLED Display (SSD1306)',
          componentTypeId: 'oled-096-i2c',
          componentDefinition: COMPONENT_DEFINITIONS['oled-096-i2c'],
          properties: { ...COMPONENT_DEFINITIONS['oled-096-i2c'].defaultProperties },
        },
      },
    ],
    edges: [
      // DHT22 VCC -> ESP32 3V3
      {
        id: 'edge-dht-vcc',
        source: 'node-esp32-1',
        target: 'node-dht22-1',
        sourceHandle: 'pin-3v3',
        targetHandle: 'pin-vcc',
        type: 'circuitEdge',
        data: {
          signalType: 'power_vcc',
          wireColor: '#EF4444',
          sourcePinName: '3V3',
          targetPinName: 'VCC',
          isCompatible: true,
        },
      },
      // DHT22 GND -> ESP32 GND
      {
        id: 'edge-dht-gnd',
        source: 'node-esp32-1',
        target: 'node-dht22-1',
        sourceHandle: 'pin-gnd-1',
        targetHandle: 'pin-gnd',
        type: 'circuitEdge',
        data: {
          signalType: 'power_gnd',
          wireColor: '#1E293B',
          sourcePinName: 'GND',
          targetPinName: 'GND',
          isCompatible: true,
        },
      },
      // DHT22 DATA -> ESP32 GPIO4 (D4)
      {
        id: 'edge-dht-data',
        source: 'node-dht22-1',
        target: 'node-esp32-1',
        sourceHandle: 'pin-data',
        targetHandle: 'pin-d4',
        type: 'circuitEdge',
        data: {
          signalType: 'comm_onewire',
          wireColor: '#10B981',
          sourcePinName: 'DATA',
          targetPinName: 'D4',
          isCompatible: true,
        },
      },
      // OLED SDA -> ESP32 GPIO21 (D21)
      {
        id: 'edge-oled-sda',
        source: 'node-oled-1',
        target: 'node-esp32-1',
        sourceHandle: 'pin-sda',
        targetHandle: 'pin-d21',
        type: 'circuitEdge',
        data: {
          signalType: 'comm_i2c',
          wireColor: '#10B981',
          sourcePinName: 'SDA',
          targetPinName: 'D21',
          isCompatible: true,
        },
      },
      // OLED SCL -> ESP32 GPIO22 (D22)
      {
        id: 'edge-oled-scl',
        source: 'node-oled-1',
        target: 'node-esp32-1',
        sourceHandle: 'pin-scl',
        targetHandle: 'pin-d22',
        type: 'circuitEdge',
        data: {
          signalType: 'comm_i2c',
          wireColor: '#10B981',
          sourcePinName: 'SCL',
          targetPinName: 'D22',
          isCompatible: true,
        },
      },
    ],
  },
  {
    id: 'arduino-sonar-alarm',
    name: 'Arduino Sonar Distance Alarm',
    description: 'Arduino Uno with HC-SR04 Ultrasonic Sonar and Piezo Buzzer proximity threshold alarm.',
    nodes: [
      {
        id: 'node-uno-1',
        type: 'arduinoNode',
        position: { x: 100, y: 80 },
        data: {
          label: 'Arduino Uno R3',
          componentTypeId: 'arduino-uno',
          componentDefinition: COMPONENT_DEFINITIONS['arduino-uno'],
          properties: { ...COMPONENT_DEFINITIONS['arduino-uno'].defaultProperties },
        },
      },
      {
        id: 'node-sonar-1',
        type: 'sensorNode',
        position: { x: 440, y: 70 },
        data: {
          label: 'HC-SR04 Ultrasonic',
          componentTypeId: 'hc-sr04',
          componentDefinition: COMPONENT_DEFINITIONS['hc-sr04'],
          properties: { ...COMPONENT_DEFINITIONS['hc-sr04'].defaultProperties },
        },
      },
      {
        id: 'node-buzzer-1',
        type: 'actuatorNode',
        position: { x: 440, y: 270 },
        data: {
          label: 'Piezo Alarm Buzzer',
          componentTypeId: 'buzzer',
          componentDefinition: COMPONENT_DEFINITIONS['buzzer'],
          properties: { ...COMPONENT_DEFINITIONS['buzzer'].defaultProperties },
        },
      },
    ],
    edges: [
      // Sonar VCC -> Arduino 5V
      {
        id: 'edge-sonar-vcc',
        source: 'node-uno-1',
        target: 'node-sonar-1',
        sourceHandle: 'pin-5v',
        targetHandle: 'pin-vcc',
        type: 'circuitEdge',
        data: {
          signalType: 'power_vcc',
          wireColor: '#EF4444',
          sourcePinName: '5V',
          targetPinName: 'VCC',
          isCompatible: true,
        },
      },
      // Sonar TRIG -> Arduino D9 (~PWM)
      {
        id: 'edge-sonar-trig',
        source: 'node-uno-1',
        target: 'node-sonar-1',
        sourceHandle: 'pin-d9',
        targetHandle: 'pin-trig',
        type: 'circuitEdge',
        data: {
          signalType: 'gpio_digital',
          wireColor: '#F59E0B',
          sourcePinName: '~D9',
          targetPinName: 'TRIG',
          isCompatible: true,
        },
      },
      // Sonar ECHO -> Arduino D10 (~PWM)
      {
        id: 'edge-sonar-echo',
        source: 'node-sonar-1',
        target: 'node-uno-1',
        sourceHandle: 'pin-echo',
        targetHandle: 'pin-d10',
        type: 'circuitEdge',
        data: {
          signalType: 'gpio_digital',
          wireColor: '#F59E0B',
          sourcePinName: 'ECHO',
          targetPinName: '~D10',
          isCompatible: true,
        },
      },
      // Buzzer Pos -> Arduino D3 (~PWM)
      {
        id: 'edge-buzzer-pos',
        source: 'node-uno-1',
        target: 'node-buzzer-1',
        sourceHandle: 'pin-d3',
        targetHandle: 'pin-pos',
        type: 'circuitEdge',
        data: {
          signalType: 'gpio_pwm',
          wireColor: '#F59E0B',
          sourcePinName: '~D3',
          targetPinName: 'Positive (+)',
          isCompatible: true,
        },
      },
    ],
  },
];
