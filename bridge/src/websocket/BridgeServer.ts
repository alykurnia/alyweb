import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { DeviceRegistry } from '../device-manager/DeviceRegistry';
import {
  validateHardwareMessage,
  HardwareMessage,
  HelloMessage,
  HeartbeatMessage,
  TelemetryMessage,
  AckMessage,
  ErrorMessage,
  DeviceInfoMessage,
} from '../protocol/types';

export interface BridgeServerOptions {
  port?: number;
  host?: string;
  allowedOrigins?: string[];
}

export class BridgeServer {
  private server: http.Server;
  private wss: WebSocketServer;
  private registry: DeviceRegistry;
  private port: number;
  private host: string;
  private allowedOrigins: string[];

  constructor(registry: DeviceRegistry, options: BridgeServerOptions = {}) {
    this.registry = registry;
    this.port = options.port || 8765;
    this.host = options.host || '0.0.0.0';
    this.allowedOrigins = options.allowedOrigins || [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ];

    this.server = http.createServer((req, res) => {
      // Basic HTTP health check endpoint
      if (req.url === '/health' || req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'online',
            service: 'IoT Lab Local Bridge Agent',
            version: '1.0.0',
            devices_count: this.registry.getAllDevices().length,
            connected_devices: this.registry.getAllDevices().filter((d) => d.isConnected).length,
            timestamp: Date.now(),
          })
        );
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    this.wss = new WebSocketServer({ noServer: true });

    this.server.on('upgrade', (req, socket, head) => {
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const origin = req.headers.origin;

      // Allow connections
      this.wss.handleUpgrade(req, socket, head, (ws) => {
        if (url.pathname === '/ws/client') {
          this.handleClientConnection(ws, req);
        } else if (url.pathname === '/ws/device') {
          this.handleDeviceConnection(ws, req);
        } else {
          // Default: check if query param indicates client or device
          if (url.searchParams.get('role') === 'device') {
            this.handleDeviceConnection(ws, req);
          } else {
            this.handleClientConnection(ws, req);
          }
        }
      });
    });
  }

  /**
   * Handle Web Browser Client connection (IoT Lab Web App)
   */
  private handleClientConnection(ws: WebSocket, req: http.IncomingMessage): void {
    this.registry.addWebClient(ws);

    ws.on('message', (data: Buffer | string) => {
      try {
        const raw = data.toString('utf-8');
        const parsed = JSON.parse(raw);

        // Check if internal bridge command (e.g. pair_device, remove_device)
        if (parsed.type === 'bridge_pair_device') {
          const { device_id, token, name, board_type } = parsed.payload || {};
          if (device_id && token) {
            this.registry.registerDevice(device_id, token, name, board_type);
            ws.send(
              JSON.stringify({
                type: 'bridge_ack',
                action: 'pair_device',
                success: true,
                device_id,
              })
            );
          }
          return;
        }

        if (parsed.type === 'bridge_remove_device') {
          const { device_id } = parsed.payload || {};
          if (device_id) {
            this.registry.removeDevice(device_id);
            ws.send(
              JSON.stringify({
                type: 'bridge_ack',
                action: 'remove_device',
                success: true,
                device_id,
              })
            );
          }
          return;
        }

        // Validate protocol message
        const validation = validateHardwareMessage(parsed);
        if (!validation.valid) {
          ws.send(
            JSON.stringify({
              type: 'error',
              code: 'INVALID_MESSAGE_SCHEMA',
              message: validation.error,
              reply_to: parsed.message_id,
            })
          );
          return;
        }

        // Route command to target physical device
        const result = this.registry.routeCommandToDevice(parsed as HardwareMessage);
        if (!result.success) {
          ws.send(
            JSON.stringify({
              type: 'error',
              code: 'COMMAND_ROUTING_FAILED',
              message: result.error,
              reply_to: parsed.message_id,
            })
          );
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        ws.send(
          JSON.stringify({
            type: 'error',
            code: 'JSON_PARSE_ERROR',
            message: `Malformed JSON: ${msg}`,
          })
        );
      }
    });

    ws.on('close', () => {
      this.registry.removeWebClient(ws);
    });
  }

  /**
   * Handle Physical ESP32 connection
   */
  private handleDeviceConnection(ws: WebSocket, req: http.IncomingMessage): void {
    let authenticatedDeviceId: string | null = null;
    const clientIp = req.socket.remoteAddress;

    ws.on('message', (data: Buffer | string) => {
      try {
        const raw = data.toString('utf-8');
        const parsed = JSON.parse(raw);

        // Validate protocol structure
        const validation = validateHardwareMessage(parsed);
        if (!validation.valid) {
          ws.send(
            JSON.stringify({
              protocol_version: '1.0',
              device_id: parsed?.device_id || 'unknown',
              message_id: `err-${Date.now()}`,
              timestamp: Date.now(),
              type: 'error',
              payload: {
                reply_to: parsed?.message_id,
                code: 'INVALID_PROTOCOL_SCHEMA',
                message: validation.error || 'Message schema invalid',
              },
            })
          );
          return;
        }

        const msg = parsed as HardwareMessage;

        // 1. Handshake (hello)
        if (msg.type === 'hello') {
          const hello = msg as HelloMessage;
          const result = this.registry.handleDeviceHandshake(
            hello.device_id,
            hello.payload.token,
            hello.payload.firmware_version,
            hello.payload.board_type,
            hello.payload.capabilities || [],
            ws,
            clientIp
          );

          if (!result.success) {
            ws.send(
              JSON.stringify({
                protocol_version: '1.0',
                device_id: hello.device_id,
                message_id: `err-${Date.now()}`,
                timestamp: Date.now(),
                type: 'error',
                payload: {
                  reply_to: hello.message_id,
                  code: 'UNAUTHORIZED_TOKEN',
                  message: result.error || 'Pairing token rejection',
                },
              })
            );
            ws.close(4001, 'Unauthorized Pairing Token');
            return;
          }

          authenticatedDeviceId = hello.device_id;

          // Send handshake ACK
          ws.send(
            JSON.stringify({
              protocol_version: '1.0',
              device_id: hello.device_id,
              message_id: `ack-${Date.now()}`,
              timestamp: Date.now(),
              type: 'ack',
              payload: {
                reply_to: hello.message_id,
                success: true,
                message: 'Device handshake accepted. Bridge ready.',
              },
            })
          );
          return;
        }

        // Verify device has performed handshake
        if (!authenticatedDeviceId || authenticatedDeviceId !== msg.device_id) {
          ws.send(
            JSON.stringify({
              protocol_version: '1.0',
              device_id: msg.device_id,
              message_id: `err-${Date.now()}`,
              timestamp: Date.now(),
              type: 'error',
              payload: {
                code: 'UNAUTHENTICATED_SESSION',
                message: 'Must send a valid hello message before sending telemetry or data',
              },
            })
          );
          return;
        }

        // 2. Heartbeat
        if (msg.type === 'heartbeat') {
          const hb = msg as HeartbeatMessage;
          this.registry.handleDeviceHeartbeat(
            hb.device_id,
            hb.payload.uptime_seconds,
            hb.payload.rssi,
            hb.payload.free_heap
          );
          return;
        }

        // 3. Telemetry
        if (msg.type === 'telemetry') {
          this.registry.handleTelemetry(msg as TelemetryMessage);
          return;
        }

        // 4. Device Info
        if (msg.type === 'device_info') {
          const infoMsg = msg as DeviceInfoMessage;
          const session = this.registry.getDevice(infoMsg.device_id);
          if (session) {
            session.firmwareVersion = infoMsg.payload.firmware_version;
            session.ipAddress = infoMsg.payload.ip_address || session.ipAddress;
            session.rssi = infoMsg.payload.wifi_rssi;
            session.uptimeSeconds = infoMsg.payload.uptime_seconds;
          }
          this.registry.broadcastToWebClients(infoMsg);
          return;
        }

        // 5. ACK or Error responses from device
        if (msg.type === 'ack' || msg.type === 'error') {
          this.registry.handleDeviceAckOrError(msg as AckMessage | ErrorMessage);
          return;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        ws.send(
          JSON.stringify({
            type: 'error',
            code: 'MALFORMED_DATA',
            message: msg,
          })
        );
      }
    });

    ws.on('close', (code, reason) => {
      if (authenticatedDeviceId) {
        this.registry.handleDeviceDisconnect(authenticatedDeviceId, reason.toString());
      }
    });
  }

  public async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, this.host, () => {
        resolve();
      });
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.registry.destroy();
      for (const client of this.wss.clients) {
        try {
          client.terminate();
        } catch {}
      }
      this.wss.close(() => {
        this.server.close(() => {
          resolve();
        });
      });
    });
  }

  public getPort(): number {
    return this.port;
  }
}
