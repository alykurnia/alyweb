import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { SimulationEngine } from '../engine/SimulationEngine';
import { CircuitNode, CircuitEdge } from '@/types/circuit';
import { COMPONENT_DEFINITIONS } from '@/lib/component-definitions';

describe('SimulationEngine Lifecycle & Integration Unit Tests', () => {
  it('loads circuit, checks power, and executes step ticks', () => {
    const engine = new SimulationEngine();

    const nodes: CircuitNode[] = [
      {
        id: 'esp32-1',
        type: 'esp32Node',
        position: { x: 0, y: 0 },
        data: {
          label: 'ESP32 DevKit V1',
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
          label: 'Red LED',
          componentTypeId: 'led',
          componentDefinition: COMPONENT_DEFINITIONS['led'],
          properties: {},
        },
      },
      {
        id: 'sonar-1',
        type: 'sensorNode',
        position: { x: 300, y: 200 },
        data: {
          label: 'HC-SR04 Sonar',
          componentTypeId: 'hc-sr04',
          componentDefinition: COMPONENT_DEFINITIONS['hc-sr04'],
          properties: {},
        },
      },
    ];

    // Connect Sonar VCC to 3V3, GND to GND, and LED to GPIO 4
    const edges: CircuitEdge[] = [
      {
        id: 'e1',
        source: 'esp32-1',
        sourceHandle: 'pin-3v3',
        target: 'sonar-1',
        targetHandle: 'pin-vcc',
        data: { signalType: 'power_vcc', wireColor: '#ef4444', sourcePinName: '3V3', targetPinName: 'VCC' },
      },
      {
        id: 'e2',
        source: 'esp32-1',
        sourceHandle: 'pin-gnd-1',
        target: 'sonar-1',
        targetHandle: 'pin-gnd',
        data: { signalType: 'power_gnd', wireColor: '#10b981', sourcePinName: 'GND', targetPinName: 'GND' },
      },
      {
        id: 'e3',
        source: 'esp32-1',
        sourceHandle: 'pin-d4',
        target: 'led-1',
        targetHandle: 'pin-anode',
        data: { signalType: 'gpio_digital', wireColor: '#3b82f6', sourcePinName: 'D4', targetPinName: 'Anode' },
      },
    ];

    engine.loadCircuit(nodes, edges);

    // Initial state
    assert.strictEqual(engine.getState(), 'idle');

    // Start simulation
    const started = engine.start();
    assert.strictEqual(started, true);
    assert.strictEqual(engine.getState(), 'running');

    // Sonar should be powered
    const sensors = engine.getAllSensorData();
    const sonarData = sensors.find((s) => s.id === 'sonar-1');
    assert.ok(sonarData);
    assert.strictEqual(sonarData?.isPowered, true);

    // Toggle Pin D4 on ESP32 to HIGH
    engine.togglePin('esp32-1', 'pin-d4');

    // LED should be ON
    const actuators = engine.getAllActuatorData();
    const ledData = actuators.find((a) => a.id === 'led-1');
    assert.ok(ledData);
    assert.strictEqual(ledData?.state.isOn, true);
    assert.strictEqual(ledData?.state.brightness, 100);

    // Pause and Resume
    engine.pause();
    assert.strictEqual(engine.getState(), 'paused');

    engine.resume();
    assert.strictEqual(engine.getState(), 'running');

    // Stop and Reset
    engine.stop();
    assert.strictEqual(engine.getState(), 'stopped');

    engine.reset();
    assert.strictEqual(engine.getState(), 'idle');
  });

  it('aborts start when FATAL short circuit is detected', () => {
    const engine = new SimulationEngine();

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

    const edges: CircuitEdge[] = [
      {
        id: 'e-short',
        source: 'esp32-1',
        sourceHandle: 'pin-3v3',
        target: 'esp32-1',
        targetHandle: 'pin-gnd-1',
        data: { signalType: 'power_vcc', wireColor: '#ef4444', sourcePinName: '3V3', targetPinName: 'GND' },
      },
    ];

    engine.loadCircuit(nodes, edges);
    const started = engine.start();
    assert.strictEqual(started, false);
    assert.strictEqual(engine.getState(), 'error');

    const logs = engine.getLogs();
    assert.ok(logs.some((l) => l.level === 'ERROR' && l.message.includes('SIMULATION ABORTED')));
  });
});
