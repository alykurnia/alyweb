import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { CircuitValidator } from '../validation/CircuitValidator';
import { CircuitNode, CircuitEdge } from '@/types/circuit';
import { COMPONENT_DEFINITIONS } from '@/lib/component-definitions';

describe('CircuitValidator Simulation Unit Tests', () => {
  it('detects FATAL short circuit between VCC and GND', () => {
    const nodes: CircuitNode[] = [
      {
        id: 'esp32-1',
        type: 'esp32Node',
        position: { x: 0, y: 0 },
        data: {
          label: 'ESP32 DevKit',
          componentTypeId: 'esp32-devkit',
          componentDefinition: COMPONENT_DEFINITIONS['esp32-devkit'],
          properties: {},
        },
      },
    ];

    // Wire connecting 3V3 rail directly to GND
    const edges: CircuitEdge[] = [
      {
        id: 'edge-short',
        source: 'esp32-1',
        sourceHandle: 'pin-3v3',
        target: 'esp32-1',
        targetHandle: 'pin-gnd-1',
        data: {
          signalType: 'power_vcc',
          wireColor: '#ef4444',
          sourcePinName: '3V3',
          targetPinName: 'GND',
        },
      },
    ];

    const issues = CircuitValidator.validate(nodes, edges);
    const fatal = issues.find((i) => i.severity === 'FATAL');
    assert.ok(fatal, 'Expected a FATAL short-circuit issue');
    assert.strictEqual(fatal?.rule, 'RULE_SHORT_CIRCUIT');
  });

  it('detects missing VCC/GND warnings for active sensors', () => {
    const nodes: CircuitNode[] = [
      {
        id: 'esp32-1',
        type: 'esp32Node',
        position: { x: 0, y: 0 },
        data: {
          label: 'ESP32 DevKit',
          componentTypeId: 'esp32-devkit',
          componentDefinition: COMPONENT_DEFINITIONS['esp32-devkit'],
          properties: {},
        },
      },
      {
        id: 'dht-1',
        type: 'sensorNode',
        position: { x: 300, y: 0 },
        data: {
          label: 'DHT22 Sensor',
          componentTypeId: 'dht22',
          componentDefinition: COMPONENT_DEFINITIONS['dht22'],
          properties: {},
        },
      },
    ];

    // Only DATA is connected, VCC and GND are missing
    const edges: CircuitEdge[] = [
      {
        id: 'edge-data',
        source: 'dht-1',
        sourceHandle: 'pin-data',
        target: 'esp32-1',
        targetHandle: 'pin-d4',
        data: {
          signalType: 'gpio_digital',
          wireColor: '#3b82f6',
          sourcePinName: 'DATA',
          targetPinName: 'D4',
        },
      },
    ];

    const issues = CircuitValidator.validate(nodes, edges);
    const missingVcc = issues.find((i) => i.rule === 'RULE_MISSING_VCC');
    const missingGnd = issues.find((i) => i.rule === 'RULE_MISSING_GND');

    assert.ok(missingVcc, 'Should report missing VCC for DHT22');
    assert.ok(missingGnd, 'Should report missing GND for DHT22');
    assert.strictEqual(missingVcc?.severity, 'WARNING');
  });

  it('detects ERROR when ESP32 input-only pin attempts to drive an actuator', () => {
    const nodes: CircuitNode[] = [
      {
        id: 'esp32-1',
        type: 'esp32Node',
        position: { x: 0, y: 0 },
        data: {
          label: 'ESP32 DevKit',
          componentTypeId: 'esp32-devkit',
          componentDefinition: COMPONENT_DEFINITIONS['esp32-devkit'],
          properties: {},
        },
      },
      {
        id: 'led-1',
        type: 'actuatorNode',
        position: { x: 300, y: 0 },
        data: {
          label: 'LED Red',
          componentTypeId: 'led',
          componentDefinition: COMPONENT_DEFINITIONS['led'],
          properties: {},
        },
      },
    ];

    // Connect input-only GPIO 34 to LED anode
    const edges: CircuitEdge[] = [
      {
        id: 'edge-invalid',
        source: 'esp32-1',
        sourceHandle: 'pin-gpio34',
        target: 'led-1',
        targetHandle: 'pin-anode',
        data: {
          signalType: 'gpio_digital',
          wireColor: '#ef4444',
          sourcePinName: 'GPIO 34',
          targetPinName: 'Anode',
        },
      },
    ];

    const issues = CircuitValidator.validate(nodes, edges);
    const inputOnlyIssue = issues.find((i) => i.rule === 'RULE_ESP32_INPUT_ONLY');
    assert.ok(inputOnlyIssue, 'Should detect ESP32 input-only violation');
    assert.strictEqual(inputOnlyIssue?.severity, 'ERROR');
  });
});
