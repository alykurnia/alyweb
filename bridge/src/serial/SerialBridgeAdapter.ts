/**
 * Optional USB Serial Adapter for IoT Lab Local Bridge Agent.
 * Interacts with physical microcontrollers over local USB-UART converters (CH340, CP2102, FTDI).
 */

export interface SerialPortInfo {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
  pnpId?: string;
  locationId?: string;
  productId?: string;
  vendorId?: string;
}

export type SerialDataListener = (data: string) => void;
export type SerialStatusListener = (status: 'disconnected' | 'connecting' | 'connected' | 'error', details?: string) => void;

export class SerialBridgeAdapter {
  private isLibraryAvailable: boolean = false;
  private serialPortLib: any = null;
  private activePort: any = null;
  private activePath: string | null = null;
  private activeBaudRate: number = 115200;
  private dataListeners: Set<SerialDataListener> = new Set();
  private statusListeners: Set<SerialStatusListener> = new Set();

  constructor() {
    this.detectSerialPortLibrary();
  }

  private detectSerialPortLibrary(): void {
    try {
      // Safely check if 'serialport' package is installed
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.serialPortLib = require('serialport');
      this.isLibraryAvailable = true;
    } catch {
      this.isLibraryAvailable = false;
    }
  }

  public isAvailable(): boolean {
    return this.isLibraryAvailable;
  }

  /**
   * List available USB / hardware COM ports on the local machine
   */
  public async listPorts(): Promise<SerialPortInfo[]> {
    if (!this.isLibraryAvailable || !this.serialPortLib) {
      return [];
    }

    try {
      const SerialPortClass = this.serialPortLib.SerialPort || this.serialPortLib;
      const ports = await SerialPortClass.list();
      return ports.map((p: any) => ({
        path: p.path,
        manufacturer: p.manufacturer,
        serialNumber: p.serialNumber,
        pnpId: p.pnpId,
        productId: p.productId,
        vendorId: p.vendorId,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[SerialAdapter] Failed to query COM ports: ${msg}`);
      return [];
    }
  }

  /**
   * Connect to specified COM port
   */
  public async connect(path: string, baudRate: number = 115200): Promise<{ success: boolean; error?: string }> {
    if (!this.isLibraryAvailable || !this.serialPortLib) {
      return {
        success: false,
        error: 'USB Serial hardware support is unavailable: "serialport" library is not installed in the local bridge environment.',
      };
    }

    if (this.activePort && this.activePort.isOpen) {
      await this.disconnect();
    }

    return new Promise((resolve) => {
      try {
        const SerialPortClass = this.serialPortLib.SerialPort || this.serialPortLib;
        this.activePort = new SerialPortClass({
          path,
          baudRate,
          autoOpen: false,
        });

        this.activePath = path;
        this.activeBaudRate = baudRate;
        this.notifyStatus('connecting');

        this.activePort.open((err: Error | null) => {
          if (err) {
            this.notifyStatus('error', err.message);
            resolve({ success: false, error: err.message });
            return;
          }

          this.notifyStatus('connected', `Connected to ${path} at ${baudRate} baud`);

          this.activePort.on('data', (chunk: Buffer) => {
            const str = chunk.toString('utf-8');
            this.notifyData(str);
          });

          this.activePort.on('error', (portErr: Error) => {
            this.notifyStatus('error', portErr.message);
          });

          this.activePort.on('close', () => {
            this.notifyStatus('disconnected', `Port ${path} closed`);
            this.activePort = null;
            this.activePath = null;
          });

          resolve({ success: true });
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.notifyStatus('error', msg);
        resolve({ success: false, error: msg });
      }
    });
  }

  /**
   * Disconnect active COM port
   */
  public async disconnect(): Promise<void> {
    if (!this.activePort) return;

    return new Promise((resolve) => {
      if (this.activePort.isOpen) {
        this.activePort.close(() => {
          this.activePort = null;
          this.activePath = null;
          this.notifyStatus('disconnected');
          resolve();
        });
      } else {
        this.activePort = null;
        this.activePath = null;
        resolve();
      }
    });
  }

  /**
   * Transmit string data to the connected microcontroller
   */
  public async write(data: string): Promise<{ success: boolean; error?: string }> {
    if (!this.activePort || !this.activePort.isOpen) {
      return { success: false, error: 'No COM port currently connected' };
    }

    return new Promise((resolve) => {
      this.activePort.write(data, 'utf-8', (err: Error | null) => {
        if (err) {
          resolve({ success: false, error: err.message });
        } else {
          resolve({ success: true });
        }
      });
    });
  }

  public onData(listener: SerialDataListener): () => void {
    this.dataListeners.add(listener);
    return () => this.dataListeners.delete(listener);
  }

  public onStatus(listener: SerialStatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private notifyData(data: string): void {
    for (const listener of this.dataListeners) {
      try {
        listener(data);
      } catch {}
    }
  }

  private notifyStatus(status: 'disconnected' | 'connecting' | 'connected' | 'error', details?: string): void {
    for (const listener of this.statusListeners) {
      try {
        listener(status, details);
      } catch {}
    }
  }

  public getActiveConnection() {
    return {
      connected: this.activePort?.isOpen || false,
      path: this.activePath,
      baudRate: this.activeBaudRate,
    };
  }
}
