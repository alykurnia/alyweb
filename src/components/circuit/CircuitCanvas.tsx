'use client';

import React, { useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
} from '@xyflow/react';
import { useCircuitStore } from '@/stores/circuitStore';
import { ESP32Node } from './nodes/ESP32Node';
import { ArduinoNode } from './nodes/ArduinoNode';
import { SensorNode } from './nodes/SensorNode';
import { ActuatorNode } from './nodes/ActuatorNode';
import { DisplayNode } from './nodes/DisplayNode';
import { GenericNode } from './nodes/GenericNode';
import { CircuitEdge } from './edges/CircuitEdge';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, Sparkles } from 'lucide-react';
import { CIRCUIT_TEMPLATES } from '@/lib/circuit-templates';
import { cn } from '@/lib/utils';

const nodeTypes = {
  esp32Node: ESP32Node,
  arduinoNode: ArduinoNode,
  sensorNode: SensorNode,
  actuatorNode: ActuatorNode,
  displayNode: DisplayNode,
  genericNode: GenericNode,
};

const edgeTypes = {
  circuitEdge: CircuitEdge,
};

export function CircuitCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    showGrid,
    snapToGrid,
    selectedNode,
    selectedEdge,
    deleteSelected,
    undo,
    redo,
    saveToStorage,
    loadTemplate,
    activeNotification,
    setNotification,
  } = useCircuitStore();

  const { screenToFlowPosition, fitView } = useReactFlow();

  // Handle Drag & Drop of components from left sidebar onto canvas
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const typeId = event.dataTransfer.getData('application/reactflow');
      if (!typeId) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(typeId, position);
    },
    [screenToFlowPosition, addNode]
  );

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNode || selectedEdge) {
          e.preventDefault();
          deleteSelected();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        ((e.key === 'y' || e.key === 'Y') || (e.shiftKey && (e.key === 'z' || e.key === 'Z')))
      ) {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        saveToStorage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, selectedEdge, deleteSelected, undo, redo, saveToStorage]);

  // Auto-dismiss notifications after 4 seconds
  useEffect(() => {
    if (activeNotification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [activeNotification, setNotification]);

  return (
    <div ref={reactFlowWrapper} className="relative flex-1 h-full w-full bg-[#F1F5F9] overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        snapToGrid={snapToGrid}
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          type: 'circuitEdge',
          animated: false,
        }}
        minZoom={0.2}
        maxZoom={2.5}
        fitView
        className="touch-none"
      >
        {/* Background Grid */}
        {showGrid && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={15}
            size={1.5}
            color="#CBD5E1"
          />
        )}

        {/* Canvas Controls in bottom left */}
        <Controls
          showInteractive={false}
          className="!bg-white !border !border-slate-200 !rounded-lg !shadow-md !overflow-hidden"
        />

        {/* MiniMap in bottom right */}
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor={(n) => {
            if (n.type === 'esp32Node') return '#0D1117';
            if (n.type === 'arduinoNode') return '#00878F';
            if (n.type === 'sensorNode') return '#3B82F6';
            if (n.type === 'actuatorNode') return '#F59E0B';
            if (n.type === 'displayNode') return '#6366F1';
            return '#64748B';
          }}
          className="!bg-white !border !border-slate-200 !rounded-lg !shadow-md"
        />
      </ReactFlow>

      {/* Floating Alert / Notification Toast at Top Center */}
      {activeNotification && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-w-md w-full px-4">
          <div
            className={cn(
              'px-4 py-2.5 rounded-xl shadow-xl border flex items-center justify-between gap-3 text-xs font-medium',
              activeNotification.type === 'success' && 'bg-emerald-50 text-emerald-900 border-emerald-300',
              activeNotification.type === 'warning' && 'bg-amber-50 text-amber-900 border-amber-300',
              activeNotification.type === 'error' && 'bg-rose-50 text-rose-900 border-rose-300',
              activeNotification.type === 'info' && 'bg-slate-900 text-white border-slate-700'
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              {activeNotification.type === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              {activeNotification.type === 'warning' && (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              {activeNotification.type === 'error' && (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              {activeNotification.type === 'info' && (
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
              )}
              <span className="truncate">{activeNotification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600 text-xs shrink-0 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Empty State Overlay when no components are placed */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-2xl shadow-xl p-8 max-w-md text-center pointer-events-auto">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Circuit Workspace is Empty
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Drag microcontrollers, sensors, or actuators from the left component catalog, or load a pre-wired starter circuit below.
            </p>

            <div className="mt-5 space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Start Templates
              </div>
              <div className="grid grid-cols-1 gap-2">
                {CIRCUIT_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      loadTemplate(tmpl.id);
                      setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 100);
                    }}
                    className="p-2.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 block">
                        {tmpl.name}
                      </span>
                      <span className="text-[10px] text-slate-500 line-clamp-1">
                        {tmpl.description}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-blue-600 font-bold shrink-0 ml-2">
                      Load &rarr;
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
