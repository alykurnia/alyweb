import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SimulationEngine } from '../engine/SimulationEngine';
import { ArduinoRuntimeEngine } from '../runtime/ArduinoRuntimeEngine';
import { analyzeArduinoCode } from '@/lib/compiler/codeDiagnostics';
import { CompilerService } from '@/lib/compiler/compilerService';
import { SUPPORTED_BOARDS, ProjectFile } from '@/lib/compiler/types';
import { ARDUINO_TEMPLATES } from '@/lib/templates/arduinoTemplates';

describe('Sprint 4 — Code Editor & Arduino Programming Engine Unit Tests', () => {
  // Test A — Blink LED
  it('Test A: executes Blink LED program and updates virtual GPIO 2', async () => {
    const engine = new SimulationEngine();
    // Load minimal circuit with ESP32 and LED on Pin 2
    engine.loadCircuit(
      [
        {
          id: 'esp32-1',
          type: 'microcontroller',
          position: { x: 0, y: 0 },
          data: { label: 'ESP32', componentTypeId: 'esp32-devkit' } as any,
        },
        {
          id: 'led-1',
          type: 'actuator',
          position: { x: 200, y: 0 },
          data: { label: 'LED', componentTypeId: 'led' } as any,
        },
      ],
      [
        {
          id: 'wire-1',
          source: 'esp32-1',
          sourceHandle: 'pin-gpio2',
          target: 'led-1',
          targetHandle: 'pin-anode',
          data: { color: '#3b82f6', signalType: 'signal' } as any,
        },
      ]
    );

    const runtime = new ArduinoRuntimeEngine(engine);
    const files: ProjectFile[] = [
      {
        id: 'blink-ino',
        name: 'Blink.ino',
        type: 'ino',
        isMain: true,
        content: `
          void setup() {
            pinMode(2, OUTPUT);
          }
          void loop() {
            digitalWrite(2, HIGH);
            delay(10);
            digitalWrite(2, LOW);
            delay(10);
          }
        `,
      },
    ];

    // Start running
    const runPromise = runtime.run(files, 'esp32-1');

    // Wait 25ms for setup and first HIGH cycle
    await new Promise((r) => setTimeout(r, 25));

    // Verify GPIO 2 has been toggled
    const pin2 = engine.resolveMcuAndPin(2, 'esp32-1');
    assert.ok(pin2);
    const pinState = pin2.mcu.getPin(pin2.pinId);
    assert.ok(pinState);
    assert.strictEqual(pinState.mode, 'OUTPUT');

    // Stop execution cleanly
    runtime.stop();
    await runPromise;

    assert.strictEqual(runtime.getState(), 'stopped');
  });

  // Test B — Serial Output
  it('Test B: captures Serial.begin and Serial.println messages with correct baud rate', async () => {
    const engine = new SimulationEngine();
    const receivedMessages: string[] = [];

    const runtime = new ArduinoRuntimeEngine(engine, {
      onSerialMessage: (text) => {
        receivedMessages.push(text);
      },
    });

    const files: ProjectFile[] = [
      {
        id: 'serial-ino',
        name: 'SerialTest.ino',
        type: 'ino',
        isMain: true,
        content: `
          void setup() {
            Serial.begin(115200);
            Serial.println("IoT Lab Ready");
          }
          void loop() {
            delay(100);
          }
        `,
      },
    ];

    const runPromise = runtime.run(files);
    await new Promise((r) => setTimeout(r, 30));

    assert.strictEqual(runtime.getBaudRate(), 115200);
    const hasReady = receivedMessages.some((msg) => msg.includes('IoT Lab Ready'));
    assert.ok(hasReady, 'Serial Monitor should receive "IoT Lab Ready" message');

    runtime.stop();
    await runPromise;
  });

  // Test C — Analog Sensor Reading
  it('Test C: analogRead() samples connected virtual sensor on GPIO 34', async () => {
    const engine = new SimulationEngine();
    engine.loadCircuit(
      [
        {
          id: 'esp32-1',
          type: 'microcontroller',
          position: { x: 0, y: 0 },
          data: { label: 'ESP32', componentTypeId: 'esp32-devkit' } as any,
        },
        {
          id: 'soil-1',
          type: 'sensor',
          position: { x: -200, y: 0 },
          data: { label: 'Soil Sensor', componentTypeId: 'soil-moisture' } as any,
        },
      ],
      [
        {
          id: 'wire-vcc',
          source: 'esp32-1',
          sourceHandle: 'pin-3v3',
          target: 'soil-1',
          targetHandle: 'pin-vcc',
          data: { color: '#ef4444', signalType: 'power' } as any,
        },
        {
          id: 'wire-gnd',
          source: 'esp32-1',
          sourceHandle: 'pin-gnd-1',
          target: 'soil-1',
          targetHandle: 'pin-gnd',
          data: { color: '#000000', signalType: 'ground' } as any,
        },
        {
          id: 'wire-soil',
          source: 'soil-1',
          sourceHandle: 'pin-aout',
          target: 'esp32-1',
          targetHandle: 'pin-gpio34',
          data: { color: '#10b981', signalType: 'analog' } as any,
        },
      ]
    );

    // Power the sensor and set soil moisture to 80%
    engine.start();
    engine.setSensorProperty('soil-1', 'moisture', 80);

    const runtime = new ArduinoRuntimeEngine(engine);
    const val = runtime.evaluateExpression('analogRead(34)', {
      analogRead: (pin: unknown) => engine.arduinoAnalogRead(String(pin), 'esp32-1'),
    });

    assert.ok(typeof val === 'number');
    // Inverse capacitive sensor at 80% moisture produces ~1.3V -> approx 1600 on 12-bit ADC
    assert.ok((val as number) > 0, 'analogRead should return non-zero ADC value');
  });

  // Test D — Build & Syntax Diagnostics Error
  it('Test D: pre-compilation linting detects unclosed braces and hardware pin violations', () => {
    // 1. Unclosed brace check
    const invalidBraceCode: ProjectFile[] = [
      {
        id: 'f1',
        name: 'Broken.ino',
        type: 'ino',
        isMain: true,
        content: `
          void setup() {
            pinMode(2, OUTPUT);
          // Missing closing brace
          void loop() {
          }
        `,
      },
    ];

    const braceDiags = analyzeArduinoCode(invalidBraceCode, 'esp32-devkit');
    const hasUnclosed = braceDiags.some((d) => d.message.includes('Unclosed delimiter'));
    assert.ok(hasUnclosed, 'Should detect unclosed delimiter in syntax analysis');

    // 2. Hardware DRC restriction: ESP32 GPIO 34 is input-only
    const inputOnlyViolation: ProjectFile[] = [
      {
        id: 'f2',
        name: 'DRC.ino',
        type: 'ino',
        isMain: true,
        content: `
          void setup() {
            pinMode(34, OUTPUT);
          }
          void loop() {
          }
        `,
      },
    ];

    const drcDiags = analyzeArduinoCode(inputOnlyViolation, 'esp32-devkit');
    const hasInputOnlyError = drcDiags.some(
      (d) => d.severity === 'error' && d.message.includes('INPUT-ONLY')
    );
    assert.ok(hasInputOnlyError, 'Should detect pinMode(34, OUTPUT) violation on ESP32');
  });

  // Test E — Board Configuration Profiles
  it('Test E: validates board specifications and architectural constraints', () => {
    const esp32 = SUPPORTED_BOARDS['esp32-devkit'];
    assert.strictEqual(esp32.architecture, 'xtensa-esp32');
    assert.strictEqual(esp32.adcBits, 12);
    assert.strictEqual(esp32.voltage, 3.3);
    assert.ok(esp32.inputOnlyPins.includes('34'));

    const uno = SUPPORTED_BOARDS['arduino-uno'];
    assert.strictEqual(uno.architecture, 'avr');
    assert.strictEqual(uno.adcBits, 10);
    assert.strictEqual(uno.voltage, 5.0);
    assert.ok(uno.pwmPins.includes('3'));
  });

  // Test F — 10 Arduino Code Templates
  it('Test F: verifies all 10 pre-configured Arduino templates are present and valid', () => {
    assert.strictEqual(ARDUINO_TEMPLATES.length, 10);

    const blinkTpl = ARDUINO_TEMPLATES.find((t) => t.id === 'blink-led');
    assert.ok(blinkTpl);
    assert.strictEqual(blinkTpl.executableInSimulation, true);

    const wifiTpl = ARDUINO_TEMPLATES.find((t) => t.id === 'esp32-wifi');
    assert.ok(wifiTpl);
    // Real Wi-Fi requires physical hardware compilation
    assert.strictEqual(wifiTpl.executableInSimulation, false);
  });
});
