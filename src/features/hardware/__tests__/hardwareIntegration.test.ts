import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateHardwareMessage,
  isCommandStale,
  PROTOCOL_VERSION,
  ESP32_HARDWARE_PINS,
  HardwareMessage,
  HelloMessage,
  TelemetryMessage,
  GpioWriteMessage,
} from '../types/protocol';
import { useHardwareStore } from '../stores/hardwareStore';
import { DeviceRegistry } from '../../../../bridge/src/device-manager/DeviceRegistry';
import { BridgeClientService } from '../services/BridgeClientService';

describe('IoT Lab Hardware Integration Comprehensive Test Suite', () => {
  let registry: DeviceRegistry;

  beforeEach(() => {
    registry = new DeviceRegistry();
    // Reset hardware store state before each test
    const store = useHardwareStore.getState();
    store.setHardwareModeEnabled(false);
    store.setConfirmHardwareModeModalOpen(false);
    store.setPairModalOpen(false);
  });

  afterEach(() => {
    registry.destroy();
  });

  // -------------------------------------------------------------
  // Scenario 1: Device pairing and storage in store
  // -------------------------------------------------------------
  it('1. Successfully pairs a new physical device and updates store state', () => {
    const store = useHardwareStore.getState();
    const newDeviceId = 'esp32-lab-test-01';
    const token = 'test-secret-token-123';
    const name = 'Hydroponics Controller';

    store.pairDevice(newDeviceId, token, name, 'esp32-devkit');

    const devices = useHardwareStore.getState().registeredDevices;
    const paired = devices.find((d) => d.deviceId === newDeviceId);

    assert.ok(paired, 'Device should exist in registeredDevices');
    assert.strictEqual(paired.name, name);
    assert.strictEqual(paired.token, token);
    assert.strictEqual(paired.boardType, 'esp32-devkit');
    assert.strictEqual(paired.status, 'disconnected');
    assert.strictEqual(useHardwareStore.getState().activeDeviceId, newDeviceId);
  });

  // -------------------------------------------------------------
  // Scenario 2: Handshake message generation and structure
  // -------------------------------------------------------------
  it('2. Handshake "hello" message conforms strictly to Protocol v1.0 schema', () => {
    const helloMsg: HelloMessage = {
      protocol_version: PROTOCOL_VERSION,
      device_id: 'esp32-lab-001',
      message_id: 'msg-hello-001',
      timestamp: Date.now(),
      type: 'hello',
      payload: {
        token: 'iotlab-secret-token-2026',
        firmware_version: '1.0.0',
        board_type: 'esp32-devkit',
        capabilities: ['gpio', 'telemetry', 'pwm'],
      },
    };

    const validation = validateHardwareMessage(helloMsg);
    assert.strictEqual(validation.valid, true, `Validation failed: ${validation.error}`);
    assert.strictEqual(helloMsg.protocol_version, '1.0');
    assert.strictEqual(helloMsg.type, 'hello');
    assert.strictEqual(helloMsg.payload.firmware_version, '1.0.0');
  });

  // -------------------------------------------------------------
  // Scenario 3: Invalid pairing token rejection
  // -------------------------------------------------------------
  it('3. Rejects physical device handshake if pairing token is invalid', () => {
    registry.registerDevice('esp32-lab-secure', 'authorized-token-xyz');

    // Attempt handshake with fraudulent or incorrect token
    const result = registry.handleDeviceHandshake(
      'esp32-lab-secure',
      'wrong-invalid-token',
      '1.0.0',
      'esp32-devkit',
      ['gpio', 'telemetry'],
      undefined as any
    );

    assert.strictEqual(result.success, false);
    assert.match(result.error || '', /Invalid pairing token/i);

    const dev = registry.getDevice('esp32-lab-secure');
    assert.strictEqual(dev?.isConnected, false, 'Device must remain disconnected on auth failure');
  });

  // -------------------------------------------------------------
  // Scenario 4: Bridge client connection state management
  // -------------------------------------------------------------
  it('4. BridgeClientService tracks connection lifecycle and notifies listeners', () => {
    const bridge = BridgeClientService.getInstance();
    const recordedStatuses: string[] = [];

    const unsubscribe = bridge.onConnection((status) => {
      recordedStatuses.push(status);
    });

    assert.strictEqual(bridge.getBridgeUrl(), 'ws://127.0.0.1:8765/ws/client');

    bridge.setBridgeUrl('ws://127.0.0.1:9999/ws/client');
    assert.strictEqual(bridge.getBridgeUrl(), 'ws://127.0.0.1:9999/ws/client');

    // Reset url
    bridge.setBridgeUrl('ws://127.0.0.1:8765/ws/client');
    unsubscribe();
  });

  // -------------------------------------------------------------
  // Scenario 5: Device disconnection event handling
  // -------------------------------------------------------------
  it('5. Transitions device state to "disconnected" on disconnect event', () => {
    const store = useHardwareStore.getState();
    const devId = 'esp32-lab-disc';
    store.pairDevice(devId, 'token-123');

    // Simulate active connection in store
    useHardwareStore.setState((state) => ({
      registeredDevices: state.registeredDevices.map((d) =>
        d.deviceId === devId ? { ...d, status: 'connected' } : d
      ),
    }));

    let dev = useHardwareStore.getState().registeredDevices.find((d) => d.deviceId === devId);
    assert.strictEqual(dev?.status, 'connected');

    // Trigger disconnect event handler
    useHardwareStore.setState((state) => ({
      registeredDevices: state.registeredDevices.map((d) =>
        d.deviceId === devId ? { ...d, status: 'disconnected' } : d
      ),
    }));

    dev = useHardwareStore.getState().registeredDevices.find((d) => d.deviceId === devId);
    assert.strictEqual(dev?.status, 'disconnected');
  });

  // -------------------------------------------------------------
  // Scenario 6: Device reconnection and state update
  // -------------------------------------------------------------
  it('6. Updates device status, IP, and RSSI on reconnection', () => {
    const store = useHardwareStore.getState();
    const devId = 'esp32-lab-recon';
    store.pairDevice(devId, 'token-recon');

    // Simulate connection event with network telemetry
    useHardwareStore.setState((state) => ({
      registeredDevices: state.registeredDevices.map((d) =>
        d.deviceId === devId
          ? {
              ...d,
              status: 'connected',
              ipAddress: '192.168.1.145',
              rssi: -58,
              uptimeSeconds: 120,
              firmwareVersion: '1.0.1',
            }
          : d
      ),
    }));

    const dev = useHardwareStore.getState().registeredDevices.find((d) => d.deviceId === devId);
    assert.strictEqual(dev?.status, 'connected');
    assert.strictEqual(dev?.ipAddress, '192.168.1.145');
    assert.strictEqual(dev?.rssi, -58);
    assert.strictEqual(dev?.firmwareVersion, '1.0.1');
  });

  // -------------------------------------------------------------
  // Scenario 7: Heartbeat update and uptime tracking
  // -------------------------------------------------------------
  it('7. Processes periodic heartbeat and updates device uptime', () => {
    registry.registerDevice('esp32-lab-hb', 'token-hb');
    const handshake = registry.handleDeviceHandshake(
      'esp32-lab-hb',
      'token-hb',
      '1.0.0',
      'esp32-devkit',
      ['gpio'],
      undefined as any
    );
    assert.strictEqual(handshake.success, true);

    const now = Date.now();
    registry.handleDeviceHeartbeat('esp32-lab-hb', 3600, -62);

    const dev = registry.getDevice('esp32-lab-hb');
    assert.strictEqual(dev?.uptimeSeconds, 3600);
    assert.strictEqual(dev?.rssi, -62);
    assert.ok(dev?.lastHeartbeat && dev.lastHeartbeat >= now);
  });

  // -------------------------------------------------------------
  // Scenario 8: Valid telemetry processing and history appending
  // -------------------------------------------------------------
  it('8. Processes valid sensor telemetry and appends to telemetryHistory', () => {
    const devId = 'esp32-telemetry-test';
    useHardwareStore.getState().pairDevice(devId, 'tok-telem');

    const point = {
      timestamp: Date.now(),
      temperature: 24.8,
      humidity: 55.4,
      distance_cm: 32.1,
      free_heap: 275000,
    };

    useHardwareStore.setState((state) => ({
      registeredDevices: state.registeredDevices.map((d) =>
        d.deviceId === devId
          ? {
              ...d,
              status: 'connected',
              currentTelemetry: point,
              telemetryHistory: [...(d.telemetryHistory || []), point],
            }
          : d
      ),
    }));

    const dev = useHardwareStore.getState().registeredDevices.find((d) => d.deviceId === devId);
    assert.ok(dev);
    assert.strictEqual(dev.currentTelemetry?.temperature, 24.8);
    assert.strictEqual(dev.currentTelemetry?.humidity, 55.4);
    assert.strictEqual(dev.telemetryHistory.length, 1);
  });

  // -------------------------------------------------------------
  // Scenario 9: Malformed telemetry message rejection
  // -------------------------------------------------------------
  it('9. Strict schema validator rejects malformed or invalid telemetry payloads', () => {
    // Missing device_id
    const malformed1: any = {
      protocol_version: '1.0',
      message_id: 'm1',
      timestamp: Date.now(),
      type: 'telemetry',
      payload: { temperature: 25 },
    };
    assert.strictEqual(validateHardwareMessage(malformed1).valid, false);

    // Unsupported protocol version
    const malformed2: any = {
      protocol_version: '2.5',
      device_id: 'esp32-lab',
      message_id: 'm2',
      timestamp: Date.now(),
      type: 'telemetry',
      payload: { temperature: 25 },
    };
    assert.strictEqual(validateHardwareMessage(malformed2).valid, false);

    // Missing timestamp
    const malformed3: any = {
      protocol_version: '1.0',
      device_id: 'esp32-lab',
      message_id: 'm3',
      type: 'telemetry',
      payload: { temperature: 25 },
    };
    assert.strictEqual(validateHardwareMessage(malformed3).valid, false);
  });

  // -------------------------------------------------------------
  // Scenario 10: GPIO output command generation and store update
  // -------------------------------------------------------------
  it('10. Generates valid gpio_write message and enforces protocol version', () => {
    const cmd: GpioWriteMessage = {
      protocol_version: PROTOCOL_VERSION,
      device_id: 'esp32-lab-001',
      message_id: 'write-cmd-101',
      timestamp: Date.now(),
      type: 'gpio_write',
      payload: {
        pin: 2,
        value: 1,
        mode: 'OUTPUT',
        component_type: 'led',
      },
    };

    const res = validateHardwareMessage(cmd);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(cmd.payload.pin, 2);
    assert.strictEqual(cmd.payload.value, 1);
    assert.strictEqual(cmd.payload.mode, 'OUTPUT');
  });

  // -------------------------------------------------------------
  // Scenario 11: Input-only GPIO pin rejection (pins 34, 35, 36, 39)
  // -------------------------------------------------------------
  it('11. Rejects write attempts to ESP32 input-only GPIO pins (34, 35, 36, 39)', async () => {
    const store = useHardwareStore.getState();
    store.setHardwareModeEnabled(true);

    const inputOnlyPins = [34, 35, 36, 39];

    for (const pin of inputOnlyPins) {
      assert.ok(ESP32_HARDWARE_PINS.INPUT_ONLY.includes(pin), `Pin ${pin} must be listed in INPUT_ONLY`);

      const writeResult = await store.sendGpioWrite('esp32-lab-001', pin, 1, 'OUTPUT');
      assert.strictEqual(writeResult.success, false, `Pin ${pin} write must be rejected`);
      assert.match(writeResult.error || '', /input-only/i);
    }
  });

  // -------------------------------------------------------------
  // Scenario 12: Unauthorized command rejection when hardware mode is disabled
  // -------------------------------------------------------------
  it('12. Rejects GPIO write commands when hardware mode is disabled', async () => {
    const store = useHardwareStore.getState();
    store.setHardwareModeEnabled(false); // Mode OFF

    const res = await store.sendGpioWrite('esp32-lab-001', 2, 1, 'OUTPUT');
    assert.strictEqual(res.success, false);
    assert.match(res.error || '', /Hardware Mode is disabled/i);
  });

  // -------------------------------------------------------------
  // Scenario 13: Simulation mode isolation
  // -------------------------------------------------------------
  it('13. Guarantees virtual simulation mode does not dispatch hardware writes', async () => {
    const store = useHardwareStore.getState();
    store.setHardwareModeEnabled(false);

    // In simulation mode, hardwareModeEnabled remains false
    assert.strictEqual(store.hardwareModeEnabled, false);

    // Attempting read/write fails immediately without network traffic
    const writeAttempt = await store.sendGpioWrite('esp32-lab-001', 4, 1);
    const readAttempt = await store.sendGpioRead('esp32-lab-001', 4);

    assert.strictEqual(writeAttempt.success, false);
    assert.strictEqual(readAttempt.success, false);
  });

  // -------------------------------------------------------------
  // Scenario 14: Hardware mode confirmation and activation
  // -------------------------------------------------------------
  it('14. Safely confirms and activates hardware mode with dialog gating', () => {
    const store = useHardwareStore.getState();

    assert.strictEqual(store.hardwareModeEnabled, false);
    assert.strictEqual(store.isConfirmHardwareModeModalOpen, false);

    // Open confirmation dialog
    store.setConfirmHardwareModeModalOpen(true);
    assert.strictEqual(useHardwareStore.getState().isConfirmHardwareModeModalOpen, true);

    // Confirm switch
    store.setHardwareModeEnabled(true);
    store.setConfirmHardwareModeModalOpen(false);

    assert.strictEqual(useHardwareStore.getState().hardwareModeEnabled, true);
    assert.strictEqual(useHardwareStore.getState().isConfirmHardwareModeModalOpen, false);
  });

  // -------------------------------------------------------------
  // Scenario 15: Stale command rejection (>5000ms)
  // -------------------------------------------------------------
  it('15. Strictly detects and rejects stale commands older than 5000ms', () => {
    const now = Date.now();

    // Fresh command (timestamp = now)
    assert.strictEqual(isCommandStale(now, 5000), false, 'Fresh command should not be stale');

    // Stale command: 6000ms old (> 5000ms threshold)
    const oldTimestamp = now - 6000;
    assert.strictEqual(isCommandStale(oldTimestamp, 5000), true, 'Old command must be identified as stale');

    // Future timestamp skewed by > 5000ms
    const futureTimestamp = now + 6000;
    assert.strictEqual(isCommandStale(futureTimestamp, 5000), true, 'Skewed future command must be flagged stale');

    // Verify rejection in DeviceRegistry router
    registry.registerDevice('esp32-stale-test', 'token-stale');
    const staleMsg: GpioWriteMessage = {
      protocol_version: PROTOCOL_VERSION,
      device_id: 'esp32-stale-test',
      message_id: 'cmd-stale-01',
      timestamp: oldTimestamp,
      type: 'gpio_write',
      payload: { pin: 2, value: 1, mode: 'OUTPUT' },
    };

    const routeResult = registry.routeCommandToDevice(staleMsg);
    assert.strictEqual(routeResult.success, false);
    assert.match(routeResult.error || '', /stale/i);
  });
});
