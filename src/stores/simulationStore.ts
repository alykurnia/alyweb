import { create } from 'zustand';
import { SimulationEngine } from '@/simulation/engine/SimulationEngine';
import {
  SimulationState,
  SimulationLogEntry,
  CircuitValidationIssue,
  SensorModelData,
  ActuatorModelData,
  DisplayModelData,
  LogLevel,
} from '@/simulation/types/simulation';
import { CircuitNode, CircuitEdge } from '@/types/circuit';

interface SimulationStoreState {
  engine: SimulationEngine;
  state: SimulationState;
  speed: number;
  elapsedMs: number;
  timeFormatted: string;
  logs: SimulationLogEntry[];
  validationIssues: CircuitValidationIssue[];
  liveSensors: Record<string, SensorModelData>;
  liveActuators: Record<string, ActuatorModelData>;
  liveDisplays: Record<string, DisplayModelData>;

  // UI state
  isConsoleOpen: boolean;
  isSensorsPanelOpen: boolean;
  isValidationModalOpen: boolean;
  logFilter: LogLevel | 'ALL';
  logSearchTerm: string;

  // Actions
  initEngineListeners: () => void;
  startSimulation: (nodes: CircuitNode[], edges: CircuitEdge[]) => boolean;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  stopSimulation: () => void;
  resetSimulation: () => void;
  setSpeed: (speed: number) => void;
  setSensorProperty: (sensorId: string, property: string, value: number | string | boolean) => void;
  togglePin: (mcuNodeId: string, pinId: string) => void;
  setPinPwm: (mcuNodeId: string, pinId: string, duty: number) => void;

  toggleConsole: () => void;
  setConsoleOpen: (open: boolean) => void;
  toggleSensorsPanel: () => void;
  setSensorsPanelOpen: (open: boolean) => void;
  toggleValidationModal: () => void;
  setValidationModalOpen: (open: boolean) => void;
  setLogFilter: (filter: LogLevel | 'ALL') => void;
  setLogSearchTerm: (term: string) => void;
  clearLogs: () => void;
  exportLogs: () => void;
}

const engineInstance = new SimulationEngine();

export const useSimulationStore = create<SimulationStoreState>((set, get) => {
  // Setup event listeners once
  engineInstance.eventBus.on('state_changed', (state) => {
    set({ state });
  });

  engineInstance.eventBus.on('tick', ({ elapsedMs, timeFormatted }) => {
    set({ elapsedMs, timeFormatted });
  });

  engineInstance.eventBus.on('log', (entry) => {
    set((prev) => ({
      logs: [...prev.logs, entry].slice(-500),
    }));
  });

  engineInstance.eventBus.on('sensor_updated', (sensorData) => {
    set((prev) => ({
      liveSensors: {
        ...prev.liveSensors,
        [sensorData.id]: sensorData,
      },
    }));
  });

  engineInstance.eventBus.on('actuator_updated', (actuatorData) => {
    set((prev) => ({
      liveActuators: {
        ...prev.liveActuators,
        [actuatorData.id]: actuatorData,
      },
    }));
  });

  engineInstance.eventBus.on('display_updated', (displayData) => {
    set((prev) => ({
      liveDisplays: {
        ...prev.liveDisplays,
        [displayData.id]: displayData,
      },
    }));
  });

  engineInstance.eventBus.on('validation_issues', (validationIssues) => {
    set({ validationIssues });
  });

  return {
    engine: engineInstance,
    state: 'idle',
    speed: 1.0,
    elapsedMs: 0,
    timeFormatted: '00:00.0',
    logs: [],
    validationIssues: [],
    liveSensors: {},
    liveActuators: {},
    liveDisplays: {},

    isConsoleOpen: false,
    isSensorsPanelOpen: false,
    isValidationModalOpen: false,
    logFilter: 'ALL',
    logSearchTerm: '',

    initEngineListeners: () => {
      // already initialized
    },

    startSimulation: (nodes, edges) => {
      const { engine } = get();
      engine.loadCircuit(nodes, edges);

      // Populate initial sensor/actuator/display maps
      const sensorsMap: Record<string, SensorModelData> = {};
      engine.getAllSensorData().forEach((s) => {
        sensorsMap[s.id] = s;
      });

      const actuatorsMap: Record<string, ActuatorModelData> = {};
      engine.getAllActuatorData().forEach((a) => {
        actuatorsMap[a.id] = a;
      });

      const displaysMap: Record<string, DisplayModelData> = {};
      engine.getAllDisplayData().forEach((d) => {
        displaysMap[d.id] = d;
      });

      set({
        liveSensors: sensorsMap,
        liveActuators: actuatorsMap,
        liveDisplays: displaysMap,
        validationIssues: engine.getValidationIssues(),
      });

      const success = engine.start();
      if (success) {
        set({ isConsoleOpen: true }); // Open console automatically when starting
      }
      return success;
    },

    pauseSimulation: () => {
      get().engine.pause();
    },

    resumeSimulation: () => {
      get().engine.resume();
    },

    stopSimulation: () => {
      get().engine.stop();
    },

    resetSimulation: () => {
      get().engine.reset();
      set({
        elapsedMs: 0,
        timeFormatted: '00:00.0',
        liveSensors: {},
        liveActuators: {},
        liveDisplays: {},
        logs: [],
      });
    },

    setSpeed: (speed: number) => {
      get().engine.setSpeed(speed);
      set({ speed });
    },

    setSensorProperty: (sensorId: string, property: string, value: number | string | boolean) => {
      get().engine.setSensorProperty(sensorId, property, value);
    },

    togglePin: (mcuNodeId: string, pinId: string) => {
      get().engine.togglePin(mcuNodeId, pinId);
    },

    setPinPwm: (mcuNodeId: string, pinId: string, duty: number) => {
      get().engine.setPinPwm(mcuNodeId, pinId, duty);
    },

    toggleConsole: () => {
      set((prev) => ({ isConsoleOpen: !prev.isConsoleOpen }));
    },

    setConsoleOpen: (open: boolean) => {
      set({ isConsoleOpen: open });
    },

    toggleSensorsPanel: () => {
      set((prev) => ({ isSensorsPanelOpen: !prev.isSensorsPanelOpen }));
    },

    setSensorsPanelOpen: (open: boolean) => {
      set({ isSensorsPanelOpen: open });
    },

    toggleValidationModal: () => {
      set((prev) => ({ isValidationModalOpen: !prev.isValidationModalOpen }));
    },

    setValidationModalOpen: (open: boolean) => {
      set({ isValidationModalOpen: open });
    },

    setLogFilter: (filter: LogLevel | 'ALL') => {
      set({ logFilter: filter });
    },

    setLogSearchTerm: (term: string) => {
      set({ logSearchTerm: term });
    },

    clearLogs: () => {
      set({ logs: [] });
    },

    exportLogs: () => {
      const { logs, timeFormatted } = get();
      if (logs.length === 0) return;

      const logText = logs
        .map(
          (l) =>
            `[${l.timeFormatted}] [${l.level.padEnd(8, ' ')}] ${l.componentId ? `[${l.componentId}] ` : ''}${l.message}`
        )
        .join('\n');

      const blob = new Blob([`IoT Lab Simulation Log\nGenerated at: ${new Date().toISOString()}\nSimulation Duration: ${timeFormatted}\n\n${logText}`], {
        type: 'text/plain;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `iot_simulation_${Date.now()}.log`;
      link.click();
      URL.revokeObjectURL(url);
    },
  };
});
