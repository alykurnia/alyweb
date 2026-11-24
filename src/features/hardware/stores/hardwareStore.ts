import { create } from 'zustand';
import {
  RegisteredDevice,
  DeviceConnectionStatus,
  TelemetryPoint,
  GpioPinState,
} from '../types/hardware';
import {
  HardwareMessage,
  PROTOCOL_VERSION,
  ESP32_HARDWARE_PINS,
  GpioWriteMessage,
  GpioReadMessage,
} from '../types/protocol';
import { BridgeClientService } from '../services/BridgeClientService';
import { useCodeEditorStore } from '@/stores/codeEditorStore';

const STORAGE_KEY = 'iot_lab_hardware_devices_v1';

interface HardwareStoreState {
  bridgeStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  bridgeUrl: string;
  bridgeError: string | null;
  registeredDevices: RegisteredDevice[];
  activeDeviceId: string | null;
  hardwareModeEnabled: boolean;
  isPairModalOpen: boolean;
  isConfirmHardwareModeModalOpen: boolean;

  // Actions
  init: () => void;
  setBridgeUrl: (url: string) => void;
  connectBridge: () => void;
  disconnectBridge: () => void;
  pairDevice: (deviceId: string, token: string, name?: string, boardType?: string) => void;
  removeDevice: (deviceId: string) => void;
  renameDevice: (deviceId: string, newName: string) => void;
  setActiveDeviceId: (deviceId: string | null) => void;
  setHardwareModeEnabled: (enabled: boolean) => void;
  setPairModalOpen: (open: boolean) => void;
  setConfirmHardwareModeModalOpen: (open: boolean) => void;

  // GPIO and Control actions
  sendGpioWrite: (
    deviceId: string,
    pin: number,
    value: number,
    mode?: 'OUTPUT' | 'PWM',
    componentType?: 'led' | 'relay' | 'servo' | 'buzzer' | 'generic'
  ) => Promise<{ success: boolean; error?: string }>;
  sendGpioRead: (deviceId: string, pin: number, mode?: 'INPUT' | 'INPUT_PULLUP' | 'ANALOG') => Promise<{ success: boolean; value?: number; error?: string }>;
  emergencyStop: (deviceId: string) => Promise<{ success: boolean; error?: string }>;
  clearTelemetry: (deviceId: string) => void;
}

const DEFAULT_LAB_DEVICE: RegisteredDevice = {
  deviceId: 'esp32-lab-001',
  name: 'ESP32 DevKit Lab 1',
  token: 'iotlab-secret-token-2026',
  boardType: 'esp32-devkit',
  status: 'disconnected',
  firmwareVersion: '1.0.0',
  capabilities: ['gpio', 'telemetry', 'pwm'],
  pinStates: {},
  telemetryHistory: [],
};

export const useHardwareStore = create<HardwareStoreState>((set, get) => ({
  bridgeStatus: 'disconnected',
  bridgeUrl: 'ws://127.0.0.1:8765/ws/client',
  bridgeError: null,
  registeredDevices: [DEFAULT_LAB_DEVICE],
  activeDeviceId: DEFAULT_LAB_DEVICE.deviceId,
  hardwareModeEnabled: false,
  isPairModalOpen: false,
  isConfirmHardwareModeModalOpen: false,

  init: () => {
    if (typeof window === 'undefined') return;

    // 1. Load stored devices from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          set({
            registeredDevices: parsed.map((d: any) => ({
              ...d,
              status: 'disconnected', // Initial state until bridge confirms
              telemetryHistory: [],
            })),
            activeDeviceId: parsed[0]?.deviceId || DEFAULT_LAB_DEVICE.deviceId,
          });
        }
      }
    } catch {}

    // 2. Setup BridgeClientService listeners
    const bridge = BridgeClientService.getInstance();

    bridge.onConnection((status, error) => {
      set({ bridgeStatus: status, bridgeError: error || null });

      // If disconnected, mark all devices as disconnected
      if (status === 'disconnected' || status === 'error') {
        set((state) => ({
          registeredDevices: state.registeredDevices.map((d) => ({
            ...d,
            status: 'disconnected',
          })),
        }));
      }
    });

    bridge.onMessage((msg: any) => {
      if (!msg || typeof msg !== 'object') return;

      const { registeredDevices } = get();

      // Handle Device Roster from bridge
      if (msg.type === 'device_roster' && Array.isArray(msg.devices)) {
        const updated = registeredDevices.map((dev) => {
          const match = msg.devices.find((d: any) => d.deviceId === dev.deviceId);
          if (match) {
            return {
              ...dev,
              status: match.isConnected ? ('connected' as DeviceConnectionStatus) : ('disconnected' as DeviceConnectionStatus),
              firmwareVersion: match.firmwareVersion || dev.firmwareVersion,
              ipAddress: match.ipAddress || dev.ipAddress,
              rssi: match.rssi,
              uptimeSeconds: match.uptimeSeconds,
              capabilities: match.capabilities || dev.capabilities,
            };
          }
          return dev;
        });
        set({ registeredDevices: updated });
        return;
      }

      // Handle Device Connected event
      if (msg.type === 'device_connected' && msg.device) {
        const d = msg.device;
        const updated = registeredDevices.map((dev) => {
          if (dev.deviceId === d.deviceId) {
            return {
              ...dev,
              status: 'connected' as DeviceConnectionStatus,
              firmwareVersion: d.firmwareVersion || dev.firmwareVersion,
              ipAddress: d.ipAddress,
              rssi: d.rssi,
              uptimeSeconds: d.uptimeSeconds,
              capabilities: d.capabilities || dev.capabilities,
              lastSeen: Date.now(),
            };
          }
          return dev;
        });
        set({ registeredDevices: updated });

        try {
          useCodeEditorStore.getState().addSerialMessage({
            text: `[DEVICE CONNECTED] ${d.name || d.deviceId} (IP: ${d.ipAddress || 'unknown'}, RSSI: ${d.rssi ?? 'N/A'} dBm)`,
            type: 'info',
            source: 'hardware',
            deviceId: d.deviceId,
          });
        } catch {}
        return;
      }

      // Handle Device Disconnected event
      if (msg.type === 'device_disconnected' && msg.deviceId) {
        const updated = registeredDevices.map((dev) => {
          if (dev.deviceId === msg.deviceId) {
            return { ...dev, status: 'disconnected' as DeviceConnectionStatus };
          }
          return dev;
        });
        set({ registeredDevices: updated });

        try {
          useCodeEditorStore.getState().addSerialMessage({
            text: `[DEVICE DISCONNECTED] Hardware unit ${msg.deviceId} disconnected from bridge`,
            type: 'error',
            source: 'hardware',
            deviceId: msg.deviceId,
          });
        } catch {}
        return;
      }

      // Handle Device Heartbeat event
      if (msg.type === 'device_heartbeat' && msg.deviceId) {
        const updated = registeredDevices.map((dev) => {
          if (dev.deviceId === msg.deviceId) {
            return {
              ...dev,
              status: 'connected' as DeviceConnectionStatus,
              uptimeSeconds: msg.uptime,
              rssi: msg.rssi,
              lastSeen: msg.timestamp || Date.now(),
            };
          }
          return dev;
        });
        set({ registeredDevices: updated });
        return;
      }

      // Handle Device Telemetry message
      if (msg.type === 'telemetry' && msg.device_id && msg.payload) {
        const point: TelemetryPoint = {
          timestamp: msg.timestamp || Date.now(),
          ...msg.payload,
        };

        const updated = registeredDevices.map((dev) => {
          if (dev.deviceId === msg.device_id) {
            const nextHistory = [...(dev.telemetryHistory || []).slice(-49), point];
            return {
              ...dev,
              status: 'connected' as DeviceConnectionStatus,
              lastSeen: point.timestamp,
              currentTelemetry: point,
              telemetryHistory: nextHistory,
            };
          }
          return dev;
        });
        set({ registeredDevices: updated });

        try {
          const telemetryParts: string[] = [];
          if (point.temperature !== undefined) telemetryParts.push(`temp=${point.temperature}°C`);
          if (point.humidity !== undefined) telemetryParts.push(`hum=${point.humidity}%`);
          if (point.distance_cm !== undefined) telemetryParts.push(`dist=${point.distance_cm}cm`);
          if (point.soil_moisture_pct !== undefined) telemetryParts.push(`soil=${point.soil_moisture_pct}%`);
          if (point.gas_ppm !== undefined) telemetryParts.push(`gas=${point.gas_ppm}ppm`);
          if (point.lux !== undefined) telemetryParts.push(`lux=${point.lux}lx`);
          if (point.pressure_hpa !== undefined) telemetryParts.push(`press=${point.pressure_hpa}hPa`);
          if (point.free_heap !== undefined) telemetryParts.push(`heap=${point.free_heap}B`);

          if (telemetryParts.length > 0) {
            useCodeEditorStore.getState().addSerialMessage({
              text: `${msg.device_id}: ${telemetryParts.join(' | ')}`,
              type: 'rx',
              source: 'hardware',
              deviceId: msg.device_id,
            });
          }
        } catch {}
        return;
      }

      // Handle Device Info
      if (msg.type === 'device_info' && msg.device_id && msg.payload) {
        const p = msg.payload;
        const updated = registeredDevices.map((dev) => {
          if (dev.deviceId === msg.device_id) {
            return {
              ...dev,
              status: 'connected' as DeviceConnectionStatus,
              firmwareVersion: p.firmware_version || dev.firmwareVersion,
              ipAddress: p.ip_address,
              rssi: p.wifi_rssi,
              uptimeSeconds: p.uptime_seconds,
              lastSeen: Date.now(),
            };
          }
          return dev;
        });
        set({ registeredDevices: updated });
        return;
      }
    });

    // 3. Connect to local bridge
    bridge.connect();
  },

  setBridgeUrl: (url: string) => {
    set({ bridgeUrl: url });
    BridgeClientService.getInstance().setBridgeUrl(url);
  },

  connectBridge: () => {
    BridgeClientService.getInstance().connect();
  },

  disconnectBridge: () => {
    BridgeClientService.getInstance().disconnect();
  },

  pairDevice: (deviceId: string, token: string, name?: string, boardType: string = 'esp32-devkit') => {
    const { registeredDevices } = get();
    const cleanId = deviceId.trim();
    const cleanToken = token.trim();
    if (!cleanId || !cleanToken) return;

    const existingIndex = registeredDevices.findIndex((d) => d.deviceId === cleanId);
    let updated: RegisteredDevice[];

    const newDev: RegisteredDevice = {
      deviceId: cleanId,
      name: name?.trim() || `ESP32 (${cleanId})`,
      token: cleanToken,
      boardType,
      status: 'disconnected',
      firmwareVersion: '1.0.0',
      capabilities: ['gpio', 'telemetry', 'pwm'],
      pinStates: {},
      telemetryHistory: [],
    };

    if (existingIndex >= 0) {
      updated = [...registeredDevices];
      updated[existingIndex] = { ...updated[existingIndex], ...newDev };
    } else {
      updated = [...registeredDevices, newDev];
    }

    set({ registeredDevices: updated, activeDeviceId: cleanId, isPairModalOpen: false });

    // Inform local bridge about the paired device
    BridgeClientService.getInstance().send({
      type: 'bridge_pair_device',
      payload: {
        device_id: cleanId,
        token: cleanToken,
        name: newDev.name,
        board_type: boardType,
      },
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  },

  removeDevice: (deviceId: string) => {
    const { registeredDevices, activeDeviceId } = get();
    const updated = registeredDevices.filter((d) => d.deviceId !== deviceId);
    const nextActive = activeDeviceId === deviceId ? updated[0]?.deviceId || null : activeDeviceId;

    set({ registeredDevices: updated, activeDeviceId: nextActive });

    BridgeClientService.getInstance().send({
      type: 'bridge_remove_device',
      payload: { device_id: deviceId },
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  },

  renameDevice: (deviceId: string, newName: string) => {
    const { registeredDevices } = get();
    const updated = registeredDevices.map((d) =>
      d.deviceId === deviceId ? { ...d, name: newName.trim() } : d
    );
    set({ registeredDevices: updated });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  },

  setActiveDeviceId: (deviceId: string | null) => {
    set({ activeDeviceId: deviceId });
  },

  setHardwareModeEnabled: (enabled: boolean) => {
    set({ hardwareModeEnabled: enabled, isConfirmHardwareModeModalOpen: false });
  },

  setPairModalOpen: (open: boolean) => {
    set({ isPairModalOpen: open });
  },

  setConfirmHardwareModeModalOpen: (open: boolean) => {
    set({ isConfirmHardwareModeModalOpen: open });
  },

  // -------------------------------------------------------------
  // Physical GPIO & Command Actions
  // -------------------------------------------------------------
  sendGpioWrite: async (deviceId, pin, value, mode = 'OUTPUT', componentType = 'generic') => {
    const { registeredDevices, hardwareModeEnabled } = get();

    // Guard: Prevent sending writes if hardware mode is disabled
    if (!hardwareModeEnabled) {
      return { success: false, error: 'Hardware Mode is disabled. Enable Hardware Mode to control physical GPIO.' };
    }

    // Hardware rule check: input-only pin rejection
    if (ESP32_HARDWARE_PINS.INPUT_ONLY.includes(pin)) {
      return { success: false, error: `Hardware Violation: GPIO ${pin} is input-only on ESP32 DevKit` };
    }

    const dev = registeredDevices.find((d) => d.deviceId === deviceId);
    if (!dev || dev.status !== 'connected') {
      return { success: false, error: `Physical device "${deviceId}" is currently disconnected` };
    }

    const msg: GpioWriteMessage = {
      protocol_version: PROTOCOL_VERSION,
      device_id: deviceId,
      message_id: `cmd-write-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
      type: 'gpio_write',
      payload: {
        pin,
        value,
        mode,
        component_type: componentType,
      },
    };

    try {
      const ack = await BridgeClientService.getInstance().sendCommandWithAck(msg, 3000);

      // Update pinState optimistically in store
      set((state) => ({
        registeredDevices: state.registeredDevices.map((d) => {
          if (d.deviceId === deviceId) {
            const nextPins = { ...d.pinStates };
            nextPins[pin] = {
              pin,
              mode,
              value,
              lastUpdated: Date.now(),
            };
            return { ...d, pinStates: nextPins };
          }
          return d;
        }),
      }));

      try {
        useCodeEditorStore.getState().addSerialMessage({
          text: `>> GPIO WRITE [${deviceId}] Pin ${pin} -> ${value} (${mode})`,
          type: 'tx',
          source: 'hardware',
          deviceId,
        });
      } catch {}

      return { success: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { success: false, error: errorMsg };
    }
  },

  sendGpioRead: async (deviceId, pin, mode = 'INPUT') => {
    const { registeredDevices, hardwareModeEnabled } = get();

    if (!hardwareModeEnabled) {
      return { success: false, error: 'Hardware Mode is disabled' };
    }

    const dev = registeredDevices.find((d) => d.deviceId === deviceId);
    if (!dev || dev.status !== 'connected') {
      return { success: false, error: `Physical device "${deviceId}" is currently disconnected` };
    }

    const msg: GpioReadMessage = {
      protocol_version: PROTOCOL_VERSION,
      device_id: deviceId,
      message_id: `cmd-read-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
      type: 'gpio_read',
      payload: { pin, mode },
    };

    try {
      const ack = await BridgeClientService.getInstance().sendCommandWithAck(msg, 3000);
      const val = ack.payload?.value ?? 0;

      // Update pin state
      set((state) => ({
        registeredDevices: state.registeredDevices.map((d) => {
          if (d.deviceId === deviceId) {
            const nextPins = { ...d.pinStates };
            nextPins[pin] = {
              pin,
              mode,
              value: val,
              lastUpdated: Date.now(),
            };
            return { ...d, pinStates: nextPins };
          }
          return d;
        }),
      }));

      return { success: true, value: val };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { success: false, error: errorMsg };
    }
  },

  emergencyStop: async (deviceId) => {
    const { registeredDevices, hardwareModeEnabled } = get();
    if (!hardwareModeEnabled) return { success: false, error: 'Hardware Mode is disabled' };

    const dev = registeredDevices.find((d) => d.deviceId === deviceId);
    if (!dev || dev.status !== 'connected') {
      return { success: false, error: 'Device is offline' };
    }

    // Drive all safe outputs to LOW immediately
    const pinsToSafe = [2, 4, 5, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33];
    const promises = pinsToSafe.map((pin) =>
      BridgeClientService.getInstance().send({
        protocol_version: PROTOCOL_VERSION,
        device_id: deviceId,
        message_id: `estop-${pin}-${Date.now()}`,
        timestamp: Date.now(),
        type: 'gpio_write',
        payload: { pin, value: 0, mode: 'OUTPUT' },
      })
    );

    // Update store state
    set((state) => ({
      registeredDevices: state.registeredDevices.map((d) => {
        if (d.deviceId === deviceId) {
          const nextPins = { ...d.pinStates };
          pinsToSafe.forEach((pin) => {
            if (nextPins[pin]) {
              nextPins[pin] = { ...nextPins[pin], value: 0 };
            }
          });
          return { ...d, pinStates: nextPins };
        }
        return d;
      }),
    }));

    try {
      useCodeEditorStore.getState().addSerialMessage({
        text: `[EMERGENCY STOP] All actuator GPIO pins halted immediately on ${deviceId}`,
        type: 'error',
        source: 'hardware',
        deviceId,
      });
    } catch {}

    return { success: true };
  },

  clearTelemetry: (deviceId) => {
    set((state) => ({
      registeredDevices: state.registeredDevices.map((d) =>
        d.deviceId === deviceId ? { ...d, telemetryHistory: [], currentTelemetry: undefined } : d
      ),
    }));
  },
}));
