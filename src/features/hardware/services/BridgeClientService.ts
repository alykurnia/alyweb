import {
  HardwareMessage,
  validateHardwareMessage,
  GpioWriteMessage,
  GpioReadMessage,
} from '../types/protocol';

export type BridgeConnectionListener = (status: 'disconnected' | 'connecting' | 'connected' | 'error', error?: string) => void;
export type BridgeMessageListener = (msg: any) => void;

export class BridgeClientService {
  private static instance: BridgeClientService;
  private ws: WebSocket | null = null;
  private bridgeUrl: string = 'ws://127.0.0.1:8765/ws/client';
  private shouldReconnect: boolean = true;
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionListeners: Set<BridgeConnectionListener> = new Set();
  private messageListeners: Set<BridgeMessageListener> = new Set();
  private pendingAcks: Map<string, { resolve: (val: any) => void; reject: (err: any) => void; timer: NodeJS.Timeout }> = new Map();

  private constructor() {}

  public static getInstance(): BridgeClientService {
    if (!BridgeClientService.instance) {
      BridgeClientService.instance = new BridgeClientService();
    }
    return BridgeClientService.instance;
  }

  public setBridgeUrl(url: string): void {
    this.bridgeUrl = url;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      this.disconnect();
      this.connect();
    }
  }

  public getBridgeUrl(): string {
    return this.bridgeUrl;
  }

  public connect(): void {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.shouldReconnect = true;
    this.notifyConnection('connecting');

    try {
      this.ws = new WebSocket(this.bridgeUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.notifyConnection('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const raw = event.data.toString();
          const parsed = JSON.parse(raw);

          // Check if resolving a pending ACK
          const replyTo = parsed.payload?.reply_to || parsed.reply_to;
          if (replyTo && this.pendingAcks.has(replyTo)) {
            const pending = this.pendingAcks.get(replyTo)!;
            clearTimeout(pending.timer);
            this.pendingAcks.delete(replyTo);

            if (parsed.type === 'error') {
              pending.reject(new Error(parsed.payload?.message || parsed.message || 'Bridge error'));
            } else {
              pending.resolve(parsed);
            }
          }

          this.notifyMessage(parsed);
        } catch (err) {
          console.error('[BridgeClient] Failed to parse bridge message:', err);
        }
      };

      this.ws.onerror = (e) => {
        this.notifyConnection('error', 'Bridge connection failed');
      };

      this.ws.onclose = () => {
        this.notifyConnection('disconnected');
        this.ws = null;
        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.notifyConnection('error', msg);
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.notifyConnection('disconnected');
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Send a raw message or protocol message to the bridge
   */
  public send(msg: unknown): boolean {
    if (!this.isConnected() || !this.ws) {
      return false;
    }

    try {
      const raw = typeof msg === 'string' ? msg : JSON.stringify(msg);
      this.ws.send(raw);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Send a command with a correlation ID and await device ACK
   */
  public async sendCommandWithAck(msg: HardwareMessage, timeoutMs: number = 3000): Promise<any> {
    if (!this.isConnected()) {
      throw new Error('Local Bridge is not connected. Start the bridge agent at ws://127.0.0.1:8765.');
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingAcks.delete(msg.message_id);
        reject(new Error(`Command timed out after ${timeoutMs}ms without ACK from physical device`));
      }, timeoutMs);

      this.pendingAcks.set(msg.message_id, { resolve, reject, timer });

      const sent = this.send(msg);
      if (!sent) {
        clearTimeout(timer);
        this.pendingAcks.delete(msg.message_id);
        reject(new Error('Failed to dispatch command over WebSocket'));
      }
    });
  }

  public onConnection(listener: BridgeConnectionListener): () => void {
    this.connectionListeners.add(listener);
    return () => this.connectionListeners.delete(listener);
  }

  public onMessage(listener: BridgeMessageListener): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  private notifyConnection(status: 'disconnected' | 'connecting' | 'connected' | 'error', error?: string): void {
    for (const l of this.connectionListeners) {
      try {
        l(status, error);
      } catch {}
    }
  }

  private notifyMessage(msg: any): void {
    for (const l of this.messageListeners) {
      try {
        l(msg);
      } catch {}
    }
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }
}
