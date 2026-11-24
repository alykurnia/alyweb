import { create } from 'zustand';
import JSZip from 'jszip';
import {
  ProjectFile,
  DiagnosticItem,
  CompilationStatus,
  CompilationResult,
  SerialMessage,
} from '@/lib/compiler/types';
import { ARDUINO_TEMPLATES } from '@/lib/templates/arduinoTemplates';
import { ArduinoRuntimeEngine, RuntimeState } from '@/simulation/runtime/ArduinoRuntimeEngine';
import { useSimulationStore } from './simulationStore';
import { useCircuitStore } from './circuitStore';

const STORAGE_KEY = 'iot_lab_code_editor_v1';

export type BottomPanelTab = 'compilation' | 'serial' | 'problems' | 'runtime';

interface CodeEditorStoreState {
  files: ProjectFile[];
  activeFileId: string;
  openTabIds: string[];
  unsavedFileIds: string[];
  selectedBoard: 'esp32-devkit' | 'arduino-uno' | 'esp8266-nodemcu';

  // Compiler state
  compilationStatus: CompilationStatus;
  compilationOutput: string;
  diagnostics: DiagnosticItem[];
  binarySize?: {
    flashUsed: number;
    flashTotal: number;
    ramUsed: number;
    ramTotal: number;
  };
  compilerNotice?: string;

  // Runtime state
  runtimeStatus: RuntimeState;
  runtimeLogs: string[];
  runtimeEngine: ArduinoRuntimeEngine | null;

  // Serial Monitor state
  serialMessages: SerialMessage[];
  serialBaudRate: number;
  serialAutoScroll: boolean;
  serialTimestamps: boolean;

  // Bottom drawer UI
  activeBottomTab: BottomPanelTab;
  isBottomPanelCollapsed: boolean;
  bottomPanelHeight: number;

  // Actions
  init: () => void;
  selectFile: (fileId: string) => void;
  openTab: (fileId: string) => void;
  closeTab: (fileId: string) => void;
  updateFileContent: (fileId: string, content: string) => void;
  createFile: (name: string, type: 'ino' | 'cpp' | 'h') => void;
  renameFile: (fileId: string, newName: string) => void;
  deleteFile: (fileId: string) => void;
  saveCurrentFile: () => void;
  saveAllFiles: () => void;
  importFiles: (files: { name: string; content: string }[]) => void;
  exportProjectZip: () => Promise<void>;
  loadTemplate: (templateId: string) => void;
  setBoard: (boardId: 'esp32-devkit' | 'arduino-uno' | 'esp8266-nodemcu') => void;

  // Compilation & Execution
  runCompile: () => Promise<CompilationResult>;
  runProgram: () => Promise<boolean>;
  stopProgram: () => void;
  resetProgram: () => void;

  // Serial Monitor actions
  clearSerial: () => void;
  sendSerial: (text: string, source?: 'simulation' | 'hardware') => void;
  addSerialMessage: (msg: {
    text: string;
    type?: 'rx' | 'tx' | 'info' | 'error';
    source?: 'simulation' | 'hardware';
    deviceId?: string;
    baudRate?: number;
  }) => void;
  setSerialBaudRate: (rate: number) => void;
  setSerialAutoScroll: (auto: boolean) => void;
  setSerialTimestamps: (enabled: boolean) => void;
  exportSerialLog: () => void;

  // UI layout actions
  setActiveBottomTab: (tab: BottomPanelTab) => void;
  toggleBottomPanel: () => void;
  setBottomPanelHeight: (height: number) => void;
}

const DEFAULT_FILES: ProjectFile[] = [
  ...ARDUINO_TEMPLATES[0].files,
  {
    id: 'config-h',
    name: 'config.h',
    type: 'h',
    content: `// IoT Lab — Hardware Configurations & Pin Mappings
#ifndef CONFIG_H
#define CONFIG_H

#define STATUS_LED_PIN 2
#define DEFAULT_BAUD_RATE 115200

#endif // CONFIG_H
`,
  },
];

export const useCodeEditorStore = create<CodeEditorStoreState>((set, get) => ({
  files: DEFAULT_FILES,
  activeFileId: DEFAULT_FILES[0].id,
  openTabIds: [DEFAULT_FILES[0].id],
  unsavedFileIds: [],
  selectedBoard: 'esp32-devkit',

  compilationStatus: 'idle',
  compilationOutput: 'Ready for compilation. Click "Build" to verify C++ syntax and toolchain.',
  diagnostics: [],
  runtimeStatus: 'idle',
  runtimeLogs: [],
  runtimeEngine: null,

  serialMessages: [],
  serialBaudRate: 115200,
  serialAutoScroll: true,
  serialTimestamps: true,

  activeBottomTab: 'serial',
  isBottomPanelCollapsed: false,
  bottomPanelHeight: 270,

  init: () => {
    if (typeof window === 'undefined') return;

    // Load persisted files from localStorage if available
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.files && parsed.files.length > 0) {
          set({
            files: parsed.files,
            activeFileId: parsed.activeFileId || parsed.files[0].id,
            openTabIds: parsed.openTabIds || [parsed.files[0].id],
            selectedBoard: parsed.selectedBoard || 'esp32-devkit',
          });
        }
      }
    } catch {
      // Use defaults if load fails
    }
  },

  selectFile: (fileId: string) => {
    const { openTabIds } = get();
    const updatedTabs = openTabIds.includes(fileId) ? openTabIds : [...openTabIds, fileId];
    set({ activeFileId: fileId, openTabIds: updatedTabs });
  },

  openTab: (fileId: string) => {
    const { openTabIds } = get();
    if (!openTabIds.includes(fileId)) {
      set({ openTabIds: [...openTabIds, fileId], activeFileId: fileId });
    } else {
      set({ activeFileId: fileId });
    }
  },

  closeTab: (fileId: string) => {
    const { openTabIds, activeFileId, files } = get();
    const nextTabs = openTabIds.filter((id) => id !== fileId);
    let nextActive = activeFileId;

    if (activeFileId === fileId) {
      nextActive = nextTabs.length > 0 ? nextTabs[nextTabs.length - 1] : files[0]?.id || '';
    }

    set({ openTabIds: nextTabs, activeFileId: nextActive });
  },

  updateFileContent: (fileId: string, content: string) => {
    const { files, unsavedFileIds } = get();
    const nextFiles = files.map((f) => (f.id === fileId ? { ...f, content } : f));
    const nextUnsaved = unsavedFileIds.includes(fileId) ? unsavedFileIds : [...unsavedFileIds, fileId];
    set({ files: nextFiles, unsavedFileIds: nextUnsaved });
  },

  createFile: (name: string, type: 'ino' | 'cpp' | 'h') => {
    const { files, openTabIds } = get();
    const cleanName = name.trim();
    if (!cleanName) return;

    const ext = type === 'ino' ? '.ino' : type === 'cpp' ? '.cpp' : '.h';
    const fullName = cleanName.endsWith(ext) ? cleanName : `${cleanName}${ext}`;

    // Prevent duplicates
    if (files.some((f) => f.name.toLowerCase() === fullName.toLowerCase())) {
      alert(`File "${fullName}" already exists.`);
      return;
    }

    const newFile: ProjectFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: fullName,
      type,
      content: type === 'h' ? `// Header: ${fullName}\n#ifndef ${cleanName.toUpperCase()}_H\n#define ${cleanName.toUpperCase()}_H\n\n#endif\n` : `// Source: ${fullName}\n#include <Arduino.h>\n`,
    };

    const nextFiles = [...files, newFile];
    set({
      files: nextFiles,
      activeFileId: newFile.id,
      openTabIds: [...openTabIds, newFile.id],
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ files: nextFiles, activeFileId: newFile.id, openTabIds: [...openTabIds, newFile.id] }));
    } catch {}
  },

  renameFile: (fileId: string, newName: string) => {
    const { files } = get();
    const trimmed = newName.trim();
    if (!trimmed) return;

    const nextFiles = files.map((f) => (f.id === fileId ? { ...f, name: trimmed } : f));
    set({ files: nextFiles });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ files: nextFiles, activeFileId: get().activeFileId, openTabIds: get().openTabIds }));
    } catch {}
  },

  deleteFile: (fileId: string) => {
    const { files, openTabIds, activeFileId } = get();
    if (files.length <= 1) {
      alert('Cannot delete the last remaining file in the project.');
      return;
    }

    const nextFiles = files.filter((f) => f.id !== fileId);
    const nextTabs = openTabIds.filter((id) => id !== fileId);
    const nextActive = activeFileId === fileId ? nextFiles[0].id : activeFileId;

    set({
      files: nextFiles,
      openTabIds: nextTabs,
      activeFileId: nextActive,
      unsavedFileIds: get().unsavedFileIds.filter((id) => id !== fileId),
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ files: nextFiles, activeFileId: nextActive, openTabIds: nextTabs }));
    } catch {}
  },

  saveCurrentFile: () => {
    const { files, activeFileId, openTabIds, selectedBoard, unsavedFileIds } = get();
    set({ unsavedFileIds: unsavedFileIds.filter((id) => id !== activeFileId) });

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ files, activeFileId, openTabIds, selectedBoard })
      );
    } catch {}
  },

  saveAllFiles: () => {
    const { files, activeFileId, openTabIds, selectedBoard } = get();
    set({ unsavedFileIds: [] });

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ files, activeFileId, openTabIds, selectedBoard })
      );
    } catch {}
  },

  importFiles: (incomingFiles: { name: string; content: string }[]) => {
    const { files } = get();
    const newFiles: ProjectFile[] = incomingFiles.map((inf) => {
      let type: 'ino' | 'cpp' | 'h' = 'cpp';
      if (inf.name.endsWith('.ino')) type = 'ino';
      else if (inf.name.endsWith('.h')) type = 'h';

      return {
        id: `file-imported-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: inf.name,
        type,
        content: inf.content,
      };
    });

    const combined = [...files, ...newFiles];
    set({
      files: combined,
      activeFileId: newFiles[0]?.id || get().activeFileId,
      openTabIds: [...get().openTabIds, ...newFiles.map((f) => f.id)],
    });
  },

  exportProjectZip: async () => {
    const { files, selectedBoard } = get();
    const zip = new JSZip();
    const folder = zip.folder(`IoT_Project_${selectedBoard}`);

    files.forEach((f) => {
      folder?.file(f.name, f.content);
    });

    // Add metadata file
    folder?.file(
      'iotlab-project.json',
      JSON.stringify(
        {
          version: '1.0',
          board: selectedBoard,
          exportedAt: new Date().toISOString(),
          files: files.map((f) => ({ name: f.name, type: f.type })),
        },
        null,
        2
      )
    );

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `IoT_Project_${selectedBoard}_${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  loadTemplate: (templateId: string) => {
    const tpl = ARDUINO_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;

    set({
      files: tpl.files,
      activeFileId: tpl.files[0].id,
      openTabIds: tpl.files.map((f) => f.id),
      selectedBoard: tpl.targetBoard,
      compilationStatus: 'idle',
      compilationOutput: `Loaded template: ${tpl.name}\n${tpl.explanation}`,
      diagnostics: [],
    });

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          files: tpl.files,
          activeFileId: tpl.files[0].id,
          openTabIds: tpl.files.map((f) => f.id),
          selectedBoard: tpl.targetBoard,
        })
      );
    } catch {}
  },

  setBoard: (boardId: 'esp32-devkit' | 'arduino-uno' | 'esp8266-nodemcu') => {
    set({ selectedBoard: boardId });
  },

  // -------------------------------------------------------------
  // Compilation & Simulation Execution
  // -------------------------------------------------------------
  runCompile: async (): Promise<CompilationResult> => {
    const { files, selectedBoard } = get();
    set({
      compilationStatus: 'compiling',
      activeBottomTab: 'compilation',
      isBottomPanelCollapsed: false,
      compilationOutput: `Invoking C++ compilation pre-check for target board ${selectedBoard}...\n`,
    });

    try {
      const res = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files, boardId: selectedBoard }),
      });

      const data: CompilationResult = await res.json();

      set({
        compilationStatus: data.status,
        compilationOutput: data.output,
        diagnostics: data.diagnostics || [],
        binarySize: data.binarySize,
        compilerNotice: data.notice,
      });

      return data;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const fallbackResult: CompilationResult = {
        success: false,
        backendAvailable: false,
        status: 'error',
        output: `Network or compilation pipeline error: ${errorMsg}`,
        diagnostics: [],
        executionReady: false,
      };

      set({
        compilationStatus: 'error',
        compilationOutput: fallbackResult.output,
      });

      return fallbackResult;
    }
  },

  runProgram: async (): Promise<boolean> => {
    const { files, selectedBoard } = get();
    const simStore = useSimulationStore.getState();
    const circuitStore = useCircuitStore.getState();

    // 1. Ensure circuit is loaded into SimulationEngine
    if (simStore.state === 'idle' || simStore.state === 'stopped') {
      simStore.startSimulation(circuitStore.nodes, circuitStore.edges);
    }

    // 2. Instantiate or retrieve runtime engine
    let engine = get().runtimeEngine;
    if (!engine) {
      engine = new ArduinoRuntimeEngine(simStore.engine, {
        onStateChange: (state) => {
          set({ runtimeStatus: state });
        },
        onSerialMessage: (text, type) => {
          const newMsg: SerialMessage = {
            id: `ser-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            timestamp: Date.now(),
            text,
            type: type || 'rx',
            baudRate: get().serialBaudRate,
            source: 'simulation',
          };
          set((state) => ({ serialMessages: [...state.serialMessages.slice(-499), newMsg] }));
        },
        onRuntimeLog: (msg) => {
          set((state) => ({ runtimeLogs: [...state.runtimeLogs.slice(-100), `[${new Date().toLocaleTimeString()}] ${msg}`] }));
        },
        onError: (err) => {
          set((state) => ({
            activeBottomTab: 'problems',
            isBottomPanelCollapsed: false,
            runtimeLogs: [...state.runtimeLogs, `[ERROR] ${err}`],
          }));
        },
      });

      set({ runtimeEngine: engine });
    }

    // Switch to Serial tab so user sees live output
    set({
      activeBottomTab: 'serial',
      isBottomPanelCollapsed: false,
      runtimeStatus: 'running',
    });

    // Run Arduino sketch
    const targetMcuId = simStore.engine.getFirstMcuId();
    return engine.run(files, targetMcuId);
  },

  stopProgram: () => {
    const { runtimeEngine } = get();
    if (runtimeEngine) {
      runtimeEngine.stop();
    }
    set({ runtimeStatus: 'stopped' });
  },

  resetProgram: () => {
    const { runtimeEngine } = get();
    if (runtimeEngine) {
      runtimeEngine.stop();
    }
    const simStore = useSimulationStore.getState();
    simStore.resetSimulation();
    set({
      runtimeStatus: 'idle',
      serialMessages: [],
      runtimeLogs: [],
    });
  },

  clearSerial: () => {
    set({ serialMessages: [] });
  },

  sendSerial: (text: string, source: 'simulation' | 'hardware' = 'simulation') => {
    if (!text) return;
    const { serialBaudRate } = get();
    const newMsg: SerialMessage = {
      id: `ser-tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
      text: `${text}\n`,
      type: 'tx',
      baudRate: serialBaudRate,
      source,
    };
    set((state) => ({ serialMessages: [...state.serialMessages.slice(-499), newMsg] }));
  },

  addSerialMessage: (msg: {
    text: string;
    type?: 'rx' | 'tx' | 'info' | 'error';
    source?: 'simulation' | 'hardware';
    deviceId?: string;
    baudRate?: number;
  }) => {
    const { serialBaudRate } = get();
    const newMsg: SerialMessage = {
      id: `ser-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
      text: msg.text,
      type: msg.type || 'rx',
      baudRate: msg.baudRate || serialBaudRate,
      source: msg.source || 'simulation',
      deviceId: msg.deviceId,
    };
    set((state) => ({ serialMessages: [...state.serialMessages.slice(-499), newMsg] }));
  },

  setSerialBaudRate: (rate: number) => {
    set({ serialBaudRate: rate });
  },

  setSerialAutoScroll: (auto: boolean) => {
    set({ serialAutoScroll: auto });
  },

  setSerialTimestamps: (enabled: boolean) => {
    set({ serialTimestamps: enabled });
  },

  exportSerialLog: () => {
    const { serialMessages } = get();
    const text = serialMessages
      .map((m) => `[${new Date(m.timestamp).toISOString()}] [${m.type.toUpperCase()}] ${m.text}`)
      .join('');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `serial_monitor_${Date.now()}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  setActiveBottomTab: (tab: BottomPanelTab) => {
    set({ activeBottomTab: tab, isBottomPanelCollapsed: false });
  },

  toggleBottomPanel: () => {
    set((state) => ({ isBottomPanelCollapsed: !state.isBottomPanelCollapsed }));
  },

  setBottomPanelHeight: (height: number) => {
    set({ bottomPanelHeight: Math.max(160, Math.min(600, height)) });
  },
}));
