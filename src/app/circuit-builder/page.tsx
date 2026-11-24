'use client';

import React, { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { CircuitToolbar } from '@/components/circuit/CircuitToolbar';
import { SimulationControls } from '@/components/circuit/SimulationControls';
import { ComponentLibrary } from '@/components/circuit/ComponentLibrary';
import { CircuitCanvas } from '@/components/circuit/CircuitCanvas';
import { PropertiesPanel } from '@/components/circuit/PropertiesPanel';
import { InteractiveSensorPanel } from '@/components/circuit/InteractiveSensorPanel';
import { SimulationConsole } from '@/components/circuit/SimulationConsole';
import { ValidationModal } from '@/components/circuit/ValidationModal';
import { useCircuitStore } from '@/stores/circuitStore';

export default function CircuitBuilderPage() {
  const { loadFromStorage } = useCircuitStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-100">
      <ReactFlowProvider>
        {/* Top Circuit Toolbar */}
        <CircuitToolbar />

        {/* Professional IoT Simulation Engine Controls */}
        <SimulationControls />

        {/* 3-Column Engineering Workspace */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left: Component Library */}
          <ComponentLibrary />

          {/* Center: Interactive React Flow Circuit Workspace */}
          <CircuitCanvas />

          {/* Right: Component & Wire Properties Panel */}
          <PropertiesPanel />

          {/* Interactive Live Sensors & Actuator Sliders Drawer */}
          <InteractiveSensorPanel />

          {/* Simulation Console Drawer */}
          <SimulationConsole />

          {/* Circuit Electrical Validation Modal */}
          <ValidationModal />
        </div>
      </ReactFlowProvider>
    </div>
  );
}
