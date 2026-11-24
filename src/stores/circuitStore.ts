import { create } from 'zustand';
import {
  Connection,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
} from '@xyflow/react';
import { CircuitNode, CircuitEdge, CircuitEdgeData } from '@/types/circuit';
import { COMPONENT_DEFINITIONS } from '@/lib/component-definitions';
import { validateConnection } from '@/lib/connection-validator';
import { CIRCUIT_TEMPLATES } from '@/lib/circuit-templates';

const STORAGE_KEY = 'iot_lab_circuit_v1';

interface HistoryState {
  nodes: CircuitNode[];
  edges: CircuitEdge[];
}

interface CircuitStoreState {
  nodes: CircuitNode[];
  edges: CircuitEdge[];
  selectedNode: CircuitNode | null;
  selectedEdge: CircuitEdge | null;
  
  // History
  history: {
    past: HistoryState[];
    future: HistoryState[];
  };

  // Canvas Settings
  projectName: string;
  showGrid: boolean;
  snapToGrid: boolean;
  activeNotification: { type: 'success' | 'warning' | 'error' | 'info'; message: string } | null;

  // Actions
  setNodes: (nodes: CircuitNode[]) => void;
  setEdges: (edges: CircuitEdge[]) => void;
  onNodesChange: OnNodesChange<CircuitNode>;
  onEdgesChange: OnEdgesChange<CircuitEdge>;
  onConnect: (connection: Connection) => boolean;
  addNode: (typeId: string, position?: { x: number; y: number }) => void;
  deleteSelected: () => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
  setSelectedNode: (node: CircuitNode | null) => void;
  setSelectedEdge: (edge: CircuitEdge | null) => void;
  updateNodeLabel: (id: string, label: string) => void;
  updateNodeProperty: (id: string, key: string, value: unknown) => void;
  updateEdgeColor: (id: string, color: string) => void;

  // History Actions
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  // Canvas Control Actions
  setProjectName: (name: string) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  setNotification: (notif: { type: 'success' | 'warning' | 'error' | 'info'; message: string } | null) => void;

  // Storage & Templates
  saveToStorage: () => void;
  loadFromStorage: () => void;
  loadTemplate: (templateId: string) => void;
  clearCircuit: () => void;
  exportJSON: () => string;
  importJSON: (jsonString: string) => { success: boolean; error?: string };
}

export const useCircuitStore = create<CircuitStoreState>((set, get) => ({
  nodes: CIRCUIT_TEMPLATES[0].nodes,
  edges: CIRCUIT_TEMPLATES[0].edges,
  selectedNode: null,
  selectedEdge: null,
  history: { past: [], future: [] },
  projectName: 'Smart Environmental Logger',
  showGrid: true,
  snapToGrid: true,
  activeNotification: null,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  pushHistory: () => {
    const { nodes, edges, history } = get();
    // Keep max 25 history steps
    const newPast = [...history.past, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }].slice(-25);
    set({
      history: {
        past: newPast,
        future: [],
      },
    });
  },

  onNodesChange: (changes) => {
    const newNodes = changes.applyTo(get().nodes);
    const selected = newNodes.find((n) => n.selected) || null;
    set({
      nodes: newNodes,
      selectedNode: selected,
      selectedEdge: selected ? null : get().selectedEdge,
    });
  },

  onEdgesChange: (changes) => {
    const newEdges = changes.applyTo(get().edges);
    const selected = newEdges.find((e) => e.selected) || null;
    set({
      edges: newEdges,
      selectedEdge: selected,
      selectedNode: selected ? null : get().selectedNode,
    });
  },

  onConnect: (connection: Connection) => {
    const { nodes, edges, pushHistory, setNotification } = get();

    if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) {
      return false;
    }

    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);

    if (!sourceNode || !targetNode) return false;

    const sourcePin = sourceNode.data.componentDefinition?.pins.find((p) => p.id === connection.sourceHandle);
    const targetPin = targetNode.data.componentDefinition?.pins.find((p) => p.id === connection.targetHandle);

    const validation = validateConnection(
      connection.source,
      connection.target,
      sourcePin,
      targetPin,
      edges
    );

    if (!validation.isValid) {
      setNotification({
        type: 'error',
        message: validation.error || 'Connection invalid.',
      });
      return false;
    }

    pushHistory();

    const edgeData: CircuitEdgeData = {
      signalType: validation.signalType,
      wireColor: validation.wireColor,
      sourcePinName: sourcePin?.name || 'Pin',
      targetPinName: targetPin?.name || 'Pin',
      sourceVoltage: sourcePin?.voltage,
      targetVoltage: targetPin?.voltage,
      isCompatible: !validation.warning,
      warning: validation.warning,
    };

    const newEdge: CircuitEdge = {
      ...connection,
      id: `wire-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: 'circuitEdge',
      data: edgeData,
    };

    set({
      edges: addEdge(newEdge, edges),
      selectedEdge: newEdge,
      selectedNode: null,
    });

    if (validation.warning) {
      setNotification({
        type: 'warning',
        message: validation.warning,
      });
    } else {
      setNotification({
        type: 'success',
        message: `Connected ${sourcePin?.name} to ${targetPin?.name} (${validation.signalType.replace('_', ' ')})`,
      });
    }

    return true;
  },

  addNode: (typeId: string, position?: { x: number; y: number }) => {
    const def = COMPONENT_DEFINITIONS[typeId];
    if (!def) return;

    get().pushHistory();

    const id = `comp-${typeId}-${Date.now().toString(36)}`;
    const newNode: CircuitNode = {
      id,
      type: def.nodeType,
      position: position || {
        x: 180 + Math.random() * 80,
        y: 120 + Math.random() * 80,
      },
      data: {
        label: `${def.name}`,
        componentTypeId: def.typeId,
        componentDefinition: def,
        properties: { ...def.defaultProperties },
      },
    };

    set({
      nodes: [...get().nodes, newNode],
      selectedNode: newNode,
      selectedEdge: null,
      activeNotification: {
        type: 'info',
        message: `Placed ${def.name} onto circuit board`,
      },
    });
  },

  deleteSelected: () => {
    const { selectedNode, selectedEdge, nodes, edges, pushHistory } = get();
    if (!selectedNode && !selectedEdge) return;

    pushHistory();

    if (selectedNode) {
      const remainingNodes = nodes.filter((n) => n.id !== selectedNode.id);
      const remainingEdges = edges.filter(
        (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
      );
      set({
        nodes: remainingNodes,
        edges: remainingEdges,
        selectedNode: null,
        activeNotification: {
          type: 'info',
          message: `Removed ${selectedNode.data.label}`,
        },
      });
    } else if (selectedEdge) {
      const remainingEdges = edges.filter((e) => e.id !== selectedEdge.id);
      set({
        edges: remainingEdges,
        selectedEdge: null,
        activeNotification: {
          type: 'info',
          message: 'Wire removed',
        },
      });
    }
  },

  deleteNode: (id: string) => {
    get().pushHistory();
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      selectedNode: get().selectedNode?.id === id ? null : get().selectedNode,
    });
  },

  deleteEdge: (id: string) => {
    get().pushHistory();
    set({
      edges: get().edges.filter((e) => e.id !== id),
      selectedEdge: get().selectedEdge?.id === id ? null : get().selectedEdge,
    });
  },

  setSelectedNode: (node) => set({ selectedNode: node, selectedEdge: node ? null : get().selectedEdge }),
  setSelectedEdge: (edge) => set({ selectedEdge: edge, selectedNode: edge ? null : get().selectedNode }),

  updateNodeLabel: (id: string, label: string) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, label } } : n
      ),
      selectedNode:
        get().selectedNode?.id === id
          ? { ...get().selectedNode!, data: { ...get().selectedNode!.data, label } }
          : get().selectedNode,
    });
  },

  updateNodeProperty: (id: string, key: string, value: unknown) => {
    set({
      nodes: get().nodes.map((n) => {
        if (n.id === id) {
          const updatedProps = { ...n.data.properties, [key]: value };
          return { ...n, data: { ...n.data, properties: updatedProps } };
        }
        return n;
      }),
      selectedNode:
        get().selectedNode?.id === id
          ? {
              ...get().selectedNode!,
              data: {
                ...get().selectedNode!.data,
                properties: { ...get().selectedNode!.data.properties, [key]: value },
              },
            }
          : get().selectedNode,
    });
  },

  updateEdgeColor: (id: string, color: string) => {
    set({
      edges: get().edges.map((e) => {
        if (e.id === id && e.data) {
          const updatedData: CircuitEdgeData = {
            ...e.data,
            wireColor: color,
          };
          return { ...e, data: updatedData };
        }
        return e;
      }),
      selectedEdge:
        get().selectedEdge?.id === id && get().selectedEdge?.data
          ? ({
              ...get().selectedEdge!,
              data: {
                ...get().selectedEdge!.data,
                wireColor: color,
              } as CircuitEdgeData,
            } as CircuitEdge)
          : get().selectedEdge,
    });
  },

  undo: () => {
    const { history, nodes, edges } = get();
    if (history.past.length === 0) return;

    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);

    set({
      nodes: previous.nodes,
      edges: previous.edges,
      selectedNode: null,
      selectedEdge: null,
      history: {
        past: newPast,
        future: [{ nodes, edges }, ...history.future],
      },
      activeNotification: { type: 'info', message: 'Action undone' },
    });
  },

  redo: () => {
    const { history, nodes, edges } = get();
    if (history.future.length === 0) return;

    const next = history.future[0];
    const newFuture = history.future.slice(1);

    set({
      nodes: next.nodes,
      edges: next.edges,
      selectedNode: null,
      selectedEdge: null,
      history: {
        past: [...history.past, { nodes, edges }],
        future: newFuture,
      },
      activeNotification: { type: 'info', message: 'Action redone' },
    });
  },

  setProjectName: (name) => set({ projectName: name }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleSnap: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
  setNotification: (notif) => set({ activeNotification: notif }),

  saveToStorage: () => {
    if (typeof window === 'undefined') return;
    try {
      const data = {
        projectName: get().projectName,
        nodes: get().nodes,
        edges: get().edges,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      set({
        activeNotification: {
          type: 'success',
          message: 'Circuit state saved successfully to localStorage',
        },
      });
    } catch {
      set({
        activeNotification: {
          type: 'error',
          message: 'Failed to write circuit to browser storage',
        },
      });
    }
  },

  loadFromStorage: () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
          set({
            nodes: parsed.nodes,
            edges: parsed.edges,
            projectName: parsed.projectName || get().projectName,
            selectedNode: null,
            selectedEdge: null,
            activeNotification: {
              type: 'success',
              message: 'Circuit restored from previous session',
            },
          });
        }
      }
    } catch {
      // Keep default template
    }
  },

  loadTemplate: (templateId: string) => {
    const template = CIRCUIT_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    get().pushHistory();
    set({
      nodes: JSON.parse(JSON.stringify(template.nodes)),
      edges: JSON.parse(JSON.stringify(template.edges)),
      projectName: template.name,
      selectedNode: null,
      selectedEdge: null,
      activeNotification: {
        type: 'info',
        message: `Loaded template: ${template.name}`,
      },
    });
  },

  clearCircuit: () => {
    get().pushHistory();
    set({
      nodes: [],
      edges: [],
      selectedNode: null,
      selectedEdge: null,
      activeNotification: {
        type: 'info',
        message: 'Workspace cleared',
      },
    });
  },

  exportJSON: () => {
    const data = {
      version: '1.0.0',
      projectName: get().projectName,
      savedAt: new Date().toISOString(),
      nodes: get().nodes,
      edges: get().edges,
    };
    return JSON.stringify(data, null, 2);
  },

  importJSON: (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
        return { success: false, error: 'Invalid JSON format: missing nodes or edges array.' };
      }
      get().pushHistory();
      set({
        nodes: parsed.nodes,
        edges: parsed.edges,
        projectName: parsed.projectName || 'Imported Circuit',
        selectedNode: null,
        selectedEdge: null,
        activeNotification: {
          type: 'success',
          message: `Imported "${parsed.projectName || 'Circuit'}" with ${parsed.nodes.length} components.`,
        },
      });
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'JSON parsing failed.';
      return { success: false, error: msg };
    }
  },
}));
