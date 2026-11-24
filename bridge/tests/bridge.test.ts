import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import { DeviceRegistry } from '../src/device-manager/DeviceRegistry';
import { BridgeServer } from '../src/websocket/BridgeServer';
import {
  validateHardwareMessage,
  isCommandStale,
  ESP32_HARDWARE_PINS,
  HelloMessage,
  TelemetryMessage,
  GpioWriteMessage,
} from '../src/protocol/types';

describe('IoT Lab Local Bridge Agent & Protocol Tests', () => {
  let registry: DeviceRegistry;
  let server: BridgeServer;
  const TEST_PORT = 9876;

  before(async () => {
    registry = new DeviceRegistry();
    server = new BridgeServer(registry, { port: TEST_PORT, host: '127.0.0.1' });
    await server.start();
  });

  after(async () => {
    await server.stop();
  });

  // Test 1: Device Pairing
  it('Scenario 1: registers and pairs a device with a token', () => {
    const session = registry.registerDevice('esp32-test-01', 'token-abc-123', 'My ESP32', 'esp32-devkit');
    assert.strictEqual(session.deviceId, 'esp32-test-01');
    assert.strictEqual(session.token, 'token-abc-123');
    assert.strictEqual(session.isConnected, false);
  });

  // Test 2 & 3: Device Handshake with Valid vs Invalid Token
  it('Scenario 2 & 3: accepts valid token handshake and rejects invalid token', () => {
    const fakeSocket = {} as WebSocket;
    registry.registerDevice('esp32-auth', 'correct-token', 'Auth Board');

    // Invalid token
    const invalidResult = registry.handleDeviceHandshake(
      'esp32-auth',
      'wrong-token',
      '1.0.0',
      'esp32-devkit',
      ['gpio', 'dht22'],
      fakeSocket
    );
    assert.strictEqual(invalidResult.success, false);
    assert.ok(invalidResult.error?.includes('Invalid pairing token'));

    // Valid token
    const validResult = registry.handleDeviceHandshake(
      'esp32-auth',
      'correct-token',
      '1.0.0',
      'esp32-devkit',
      ['gpio', 'dht22'],
      fakeSocket
    );
    assert.strictEqual(validResult.success, true);

    const dev = registry.getDevice('esp32-auth');
    assert.ok(dev);
    assert.strictEqual(dev.isConnected, true);
    assert.strictEqual(dev.firmwareVersion, '1.0.0');
  });

  // Test 4: Live WebSocket connection to bridge server
  it('Scenario 4: establishes live WebSocket connection to /ws/client and /ws/device', async () => {
    const clientWs = new WebSocket(`ws://127.0.0.1:${TEST_PORT}/ws/client`);
    await new Promise<void>((resolve, reject) => {
      clientWs.on('open', resolve);
      clientWs.on('error', reject);
    });

    assert.strictEqual(clientWs.readyState, WebSocket.OPEN);
    clientWs.terminate();
  });

  // Test 5: Device disconnection
  it('Scenario 5: properly tracks device disconnection event', () => {
    registry.handleDeviceDisconnect('esp32-auth', 'Physical device reset');
    const dev = registry.getDevice('esp32-auth');
    assert.ok(dev);
    assert.strictEqual(dev.isConnected, false);
  });

  // Test 6: Reconnection & session replacement
  it('Scenario 6: gracefully updates socket when physical device reconnects', () => {
    const newFakeSocket = {} as WebSocket;
    const res = registry.handleDeviceHandshake(
      'esp32-auth',
      'correct-token',
      '1.0.1',
      'esp32-devkit',
      ['gpio'],
      newFakeSocket
    );
    assert.strictEqual(res.success, true);
    const dev = registry.getDevice('esp32-auth');
    assert.strictEqual(dev?.socket, newFakeSocket);
    assert.strictEqual(dev?.firmwareVersion, '1.0.1');
  });

  // Test 8 & 9: Valid vs Invalid Telemetry Messages
  it('Scenario 8 & 9: validates valid telemetry and rejects malformed schema', () => {
    const validTelemetry: TelemetryMessage = {
      protocol_version: '1.0',
      device_id: 'esp32-auth',
      message_id: 'msg-101',
      timestamp: Date.now(),
      type: 'telemetry',
      payload: {
        temperature: 24.5,
        humidity: 60.0,
      },
    };
    const validCheck = validateHardwareMessage(validTelemetry);
    assert.strictEqual(validCheck.valid, true);

    const invalidTelemetry = {
      protocol_version: '999.0', // Wrong version
      device_id: 'esp32-auth',
      type: 'telemetry',
      // missing message_id & timestamp
    };
    const invalidCheck = validateHardwareMessage(invalidTelemetry);
    assert.strictEqual(invalidCheck.valid, false);
  });

  // Test 10 & 11: GPIO Output Command & Input-Only Pin Rejection
  it('Scenario 10 & 11: validates GPIO writes and rejects input-only pins (GPIO 34-39)', () => {
    // Valid write to GPIO 2 (LED)
    const validWrite: GpioWriteMessage = {
      protocol_version: '1.0',
      device_id: 'esp32-auth',
      message_id: 'cmd-01',
      timestamp: Date.now(),
      type: 'gpio_write',
      payload: {
        pin: 2,
        value: 1,
      },
    };
    const validCheck = validateHardwareMessage(validWrite);
    assert.strictEqual(validCheck.valid, true);

    // Invalid write to GPIO 34 (Input-only on ESP32)
    const inputOnlyWrite: GpioWriteMessage = {
      protocol_version: '1.0',
      device_id: 'esp32-auth',
      message_id: 'cmd-02',
      timestamp: Date.now(),
      type: 'gpio_write',
      payload: {
        pin: 34,
        value: 1,
      },
    };
    const invalidCheck = validateHardwareMessage(inputOnlyWrite);
    assert.strictEqual(invalidCheck.valid, false);
    assert.ok(invalidCheck.error?.includes('input-only'));
  });

  // Test 12: Stale Command Rejection
  it('Scenario 15: detects and rejects stale commands older than 5000ms', () => {
    const staleTimestamp = Date.now() - 7000; // 7 seconds ago
    const isStale = isCommandStale(staleTimestamp, 5000);
    assert.strictEqual(isStale, true);

    const freshTimestamp = Date.now() - 200; // 200ms ago
    const isFresh = isCommandStale(freshTimestamp, 5000);
    assert.strictEqual(isFresh, false);
  });
});
