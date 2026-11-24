import { WebSocket } from 'ws';
import {
  HardwareMessage,
  DeviceInfoPayload,
  isCommandStale,
  ESP32_HARDWARE_PINS,
  AckMessage,
  ErrorMessage,
  TelemetryMessage,
} from '../protocol/types';

export interface DeviceSession {
  deviceId: string;
  name: string;
  token: string;
  boardType: string;
  firmwareVersion?: string;
  ipAddress?: string;
  rssi?: number;
  uptimeSeconds?: number;
  lastHeartbeat: number;
  socket?: WebSocket;
  isConnected: boolean;
  capabilities: string[];
}

export class DeviceRegistry {
  private devices: Map<string, DeviceSession> = new Map();
  private webClients: Set<WebSocket> = new Set();
  private heartbeatIntervalTimer: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_TIMEOUT_MS = 15000;

  constructor() {
    this.startHeartbeatMonitor();
  }

  /**
   * Pre-register or pair a device with a secret pairing token.
   */
  public registerDevice(deviceId: string, token: string, name?: string, boardType: string = 'esp32-devkit'): DeviceSession {
    const existing = this.devices.get(deviceId);
    if (existing) {
      existing.token = token;
      if (name) existing.name = name;
      existing.boardType = boardType;
      return existing;
    }

    const session: DeviceSession = {
      deviceId,
      name: name || `ESP32 (${deviceId})`,
      token,
      boardType,
      lastHeartbeat: 0,
      isConnected: false,
      capabilities: [],
    };
    this.devices.set(deviceId, session);
    return session;
  }

  public getDevice(deviceId: string): DeviceSession | undefined {
    return this.devices.get(deviceId);
  }

  public getAllDevices(): DeviceSession[] {
    return Array.from(this.devices.values());
  }

  public removeDevice(deviceId: string): boolean {
    const session = this.devices.get(deviceId);
    if (session && session.socket) {
      session.socket.close(1000, 'Device un-paired from bridge');
    }
    return this.devices.delete(deviceId);
  }

  /**
   * Add a web browser client connection (IoT Lab Next.js app)
   */
  public addWebClient(ws: WebSocket): void {
    this.webClients.add(ws);
    // Send current device roster to newly connected web client
    this.broadcastToWebClients({
      type: 'device_roster',
      devices: this.getDeviceRosterPayload(),
    });
  }

  public removeWebClient(ws: WebSocket): void {
    this.webClients.delete(ws);
  }

  /**
   * Handle handshake from physical ESP32 device
   */
  public handleDeviceHandshake(
    deviceId: string,
    token: string,
    firmwareVersion: string,
    boardType: string,
    capabilities: string[],
    ws: WebSocket,
    ipAddress?: string
  ): { success: boolean; error?: string } {
    let session = this.devices.get(deviceId);

    // If device not pre-registered, verify token if pairing mode is open or require pre-pairing
    if (!session) {
      // Auto-register device if token is non-empty (or default lab token)
      if (token && token.trim().length > 0) {
        session = this.registerDevice(deviceId, token, undefined, boardType);
      } else {
        return { success: false, error: 'Device not registered and no valid token provided' };
      }
    }

    if (session.token !== token) {
      return { success: false, error: 'Invalid pairing token. Handshake rejected.' };
    }

    // Attach socket
    if (session.socket && session.socket !== ws) {
      try {
        session.socket.close(1000, 'Superceded by new connection');
      } catch {
        // Ignore
      }
    }

    session.socket = ws;
    session.isConnected = true;
    session.firmwareVersion = firmwareVersion;
    session.boardType = boardType || session.boardType;
    session.capabilities = capabilities;
    session.ipAddress = ipAddress;
    session.lastHeartbeat = Date.now();

    // Broadcast device connected event to web clients
    this.broadcastToWebClients({
      type: 'device_connected',
      device: this.toPublicDeviceInfo(session),
    });

    return { success: true };
  }

  /**
   * Process heartbeat received from physical device
   */
  public handleDeviceHeartbeat(deviceId: string, uptime: number, rssi?: number, freeHeap?: number): void {
    const session = this.devices.get(deviceId);
    if (!session) return;

    session.lastHeartbeat = Date.now();
    session.uptimeSeconds = uptime;
    session.rssi = rssi;

    this.broadcastToWebClients({
      type: 'device_heartbeat',
      deviceId,
      uptime,
      rssi,
      freeHeap,
      timestamp: Date.now(),
    });
  }

  /**
   * Process device disconnection
   */
  public handleDeviceDisconnect(deviceId: string, reason?: string): void {
    const session = this.devices.get(deviceId);
    if (!session) return;

    session.isConnected = false;
    session.socket = undefined;

    this.broadcastToWebClients({
      type: 'device_disconnected',
      deviceId,
      reason: reason || 'Connection closed',
      timestamp: Date.now(),
    });
  }

  /**
   * Forward telemetry from ESP32 to web clients
   */
  public handleTelemetry(message: TelemetryMessage): void {
    const session = this.devices.get(message.device_id);
    if (session) {
      session.lastHeartbeat = Date.now();
    }
    this.broadcastToWebClients(message);
  }

  /**
   * Forward ACK or Error response from device to web clients
   */
  public handleDeviceAckOrError(message: AckMessage | ErrorMessage): void {
    this.broadcastToWebClients(message);
  }

  /**
   * Route a command from the Web Client to the Physical Device
   */
  public routeCommandToDevice(message: HardwareMessage): { success: boolean; error?: string } {
    // 1. Check if command is stale first
    if (isCommandStale(message.timestamp)) {
      return { success: false, error: `Command ${message.message_id} is stale (older than 5000ms). Rejected.` };
    }

    const session = this.devices.get(message.device_id);
    if (!session || !session.isConnected || !session.socket || session.socket.readyState !== WebSocket.OPEN) {
      return { success: false, error: `Device "${message.device_id}" is not connected to the local bridge` };
    }

    // Hardware pin safety checks for gpio_write
    if (message.type === 'gpio_write') {
      const pin = message.payload.pin;
      if (ESP32_HARDWARE_PINS.INPUT_ONLY.includes(pin)) {
        return { success: false, error: `Hardware Violation: GPIO ${pin} is input-only on ESP32` };
      }
    }

    try {
      session.socket.send(JSON.stringify(message));
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Failed to transmit command: ${msg}` };
    }
  }

  /**
   * Broadcast message to all connected web browser sessions
   */
  public broadcastToWebClients(data: unknown): void {
    const raw = typeof data === 'string' ? data : JSON.stringify(data);
    for (const client of this.webClients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(raw);
        } catch {
          // Ignore failed send
        }
      }
    }
  }

  private startHeartbeatMonitor(): void {
    this.heartbeatIntervalTimer = setInterval(() => {
      const now = Date.now();
      for (const [deviceId, session] of this.devices.entries()) {
        if (session.isConnected && session.lastHeartbeat > 0) {
          if (now - session.lastHeartbeat > this.HEARTBEAT_TIMEOUT_MS) {
            session.isConnected = false;
            if (session.socket) {
              try {
                session.socket.terminate();
              } catch {
                // Ignore
              }
              session.socket = undefined;
            }
            this.broadcastToWebClients({
              type: 'device_disconnected',
              deviceId,
              reason: 'Heartbeat timeout (device offline)',
              timestamp: now,
            });
          }
        }
      }
    }, 5000);
  }

  public destroy(): void {
    if (this.heartbeatIntervalTimer) {
      clearInterval(this.heartbeatIntervalTimer);
      this.heartbeatIntervalTimer = null;
    }
    for (const session of this.devices.values()) {
      if (session.socket) {
        try {
          session.socket.close(1000, 'Bridge shutting down');
        } catch {}
      }
    }
    for (const client of this.webClients) {
      try {
        client.close(1000, 'Bridge shutting down');
      } catch {}
    }
  }

  public getDeviceRosterPayload(): unknown[] {
    return Array.from(this.devices.values()).map((s) => this.toPublicDeviceInfo(s));
  }

  private toPublicDeviceInfo(session: DeviceSession) {
    return {
      deviceId: session.deviceId,
      name: session.name,
      boardType: session.boardType,
      firmwareVersion: session.firmwareVersion || 'Unknown',
      ipAddress: session.ipAddress,
      rssi: session.rssi,
      uptimeSeconds: session.uptimeSeconds,
      isConnected: session.isConnected,
      capabilities: session.capabilities,
      lastSeen: session.lastHeartbeat,
    };
  }
}
