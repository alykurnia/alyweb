'use client';

import React from 'react';
import { useCircuitStore } from '@/stores/circuitStore';
import { useSimulationStore } from '@/stores/simulationStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  Sliders,
  Cpu,
  Zap,
  Trash2,
  Info,
  CheckCircle2,
  AlertTriangle,
  CornerDownRight,
  Sparkles,
  Activity,
} from 'lucide-react';
import { CircuitEdgeData } from '@/types/circuit';
import { getPinColor } from './nodes/PinHandle';
import { cn } from '@/lib/utils';

export function PropertiesPanel() {
  const {
    selectedNode,
    selectedEdge,
    nodes,
    edges,
    updateNodeLabel,
    updateNodeProperty,
    updateEdgeColor,
    deleteSelected,
  } = useCircuitStore();

  const simLiveSensor = useSimulationStore((s) => (selectedNode ? s.liveSensors[selectedNode.id] : undefined));
  const simLiveActuator = useSimulationStore((s) => (selectedNode ? s.liveActuators[selectedNode.id] : undefined));
  const simLiveDisplay = useSimulationStore((s) => (selectedNode ? s.liveDisplays[selectedNode.id] : undefined));
  const simState = useSimulationStore((s) => s.state);

  // If a wire is selected
  if (selectedEdge) {
    const edgeData = (selectedEdge.data || {}) as CircuitEdgeData;
    const sourceNode = nodes.find((n) => n.id === selectedEdge.source);
    const targetNode = nodes.find((n) => n.id === selectedEdge.target);

    const WIRE_COLOR_OPTIONS = [
      { label: 'Red (Power / VCC)', value: '#EF4444' },
      { label: 'Black (Ground / GND)', value: '#1E293B' },
      { label: 'Yellow (Digital Signal / GPIO)', value: '#F59E0B' },
      { label: 'Blue (Analog Signal / ADC)', value: '#3B82F6' },
      { label: 'Green (Communication / I2C / SPI)', value: '#10B981' },
      { label: 'Purple (Passive)', value: '#8B5CF6' },
      { label: 'White (Custom Jumper)', value: '#E2E8F0' },
    ];

    return (
      <div className="w-80 shrink-0 bg-white border-l border-slate-200/90 flex flex-col h-full select-none">
        <div className="p-3.5 border-b border-slate-200/90 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Wire Connection
              </h2>
              <p className="text-[10px] text-slate-500 font-mono">
                {selectedEdge.id}
              </p>
            </div>
          </div>
          <Button
            size="xs"
            variant="ghost"
            onClick={deleteSelected}
            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1"
            title="Delete Wire"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Signal & Color Status */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600">Signal Classification:</span>
              <span className="font-mono font-bold uppercase text-[10px] text-slate-800">
                {(edgeData.signalType || 'Signal').replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600">Wire Color:</span>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs"
                  style={{ backgroundColor: edgeData.wireColor }}
                />
                <span className="font-mono text-[11px] text-slate-700">
                  {edgeData.wireColor}
                </span>
              </div>
            </div>
          </div>

          {/* Color Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Override Wire Color
            </label>
            <div className="grid grid-cols-7 gap-1.5 pt-1">
              {WIRE_COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateEdgeColor(selectedEdge.id, opt.value)}
                  title={opt.label}
                  className={cn(
                    'w-7 h-7 rounded-full border-2 transition-transform shadow-xs',
                    edgeData.wireColor === opt.value
                      ? 'scale-110 ring-2 ring-blue-500 border-white'
                      : 'border-slate-300 hover:scale-105'
                  )}
                  style={{ backgroundColor: opt.value }}
                />
              ))}
            </div>
          </div>

          {/* Connection Terminals */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Connection Terminals
            </label>
            <div className="p-2.5 rounded-lg border border-slate-200 bg-white space-y-2">
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">Source Pin</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {edgeData.sourcePinName || 'Pin'} ({edgeData.sourceVoltage || 'Logic'})
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Component: {sourceNode?.data.label || 'Origin'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center text-slate-300 my-1">
                <CornerDownRight className="w-4 h-4" />
              </div>

              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">Target Pin</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {edgeData.targetPinName || 'Pin'} ({edgeData.targetVoltage || 'Logic'})
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Component: {targetNode?.data.label || 'Target'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Health & Warnings */}
          {edgeData.warning ? (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Electrical Warning</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-700">
                {edgeData.warning}
              </p>
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-medium">Compatible pin signal</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If a component node is selected
  if (selectedNode) {
    const nodeData = selectedNode.data;
    const def = nodeData.componentDefinition;
    const props = nodeData.properties || {};

    return (
      <div className="w-80 shrink-0 bg-white border-l border-slate-200/90 flex flex-col h-full select-none">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-200/90 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider truncate">
                {def.name}
              </h2>
              <p className="text-[10px] text-slate-400 font-mono truncate">
                ID: {selectedNode.id}
              </p>
            </div>
          </div>

          <Button
            size="xs"
            variant="ghost"
            onClick={deleteSelected}
            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1"
            title="Delete Component"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Label Edit */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Component Display Label
            </label>
            <Input
              value={nodeData.label}
              onChange={(e) => updateNodeLabel(selectedNode.id, e.target.value)}
              className="text-xs py-1.5"
            />
          </div>

          {/* Quick Specs Overview */}
          <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] font-mono">
            <div>
              <span className="text-[9px] text-slate-400 uppercase block">Category</span>
              <span className="font-semibold text-slate-700 capitalize">{def.category}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase block">Voltage</span>
              <span className="font-semibold text-blue-600">{def.voltage}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase block">Total Pins</span>
              <span className="font-semibold text-slate-700">{def.pins.length} Pins</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase block">Logic Level</span>
              <span className="font-semibold text-emerald-600">{def.voltage.includes('3.3') ? '3.3V CMOS' : '5V TTL'}</span>
            </div>
          </div>

          {/* Live Simulation Telemetry (if simulation active) */}
          {(simState === 'running' || simState === 'paused') && (simLiveSensor || simLiveActuator || simLiveDisplay) && (
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-slate-200 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3 h-3 animate-pulse" />
                  Live Simulation State
                </span>
                <span
                  className={cn(
                    'text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold',
                    (simLiveSensor?.isPowered ?? simLiveActuator?.isPowered ?? simLiveDisplay?.isPowered)
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  )}
                >
                  {(simLiveSensor?.isPowered ?? simLiveActuator?.isPowered ?? simLiveDisplay?.isPowered)
                    ? 'POWERED'
                    : 'UNPOWERED'}
                </span>
              </div>

              {simLiveSensor && (
                <div className="space-y-1 font-mono text-[11px]">
                  {Object.entries(simLiveSensor.readings).map(([key, val]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-slate-400 capitalize">{key}:</span>
                      <span className="text-cyan-300 font-semibold">{String(val)}</span>
                    </div>
                  ))}
                </div>
              )}

              {simLiveActuator && (
                <div className="space-y-1 font-mono text-[11px]">
                  {Object.entries(simLiveActuator.state).map(([key, val]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-slate-400 capitalize">{key}:</span>
                      <span className="text-purple-300 font-semibold">{String(val)}</span>
                    </div>
                  ))}
                </div>
              )}

              {simLiveDisplay && (
                <div className="space-y-1 font-mono text-[10px] bg-slate-950 p-2 rounded border border-slate-800">
                  <div className="text-[9px] text-slate-500 uppercase">Screen Buffer:</div>
                  {simLiveDisplay.lines.map((line, idx) => (
                    <div key={idx} className="text-cyan-400 truncate font-semibold">
                      [{idx}]: {line || '(empty)'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Component-Specific Configurable Properties */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Configurable Properties</span>
              <Sparkles className="w-3 h-3 text-blue-500" />
            </label>

            {/* LED Color */}
            {def.typeId === 'led' && (
              <Select
                label="LED Color"
                value={String(props.color || 'red')}
                onChange={(e) => updateNodeProperty(selectedNode.id, 'color', e.target.value)}
                options={[
                  { value: 'red', label: 'Red (625nm)' },
                  { value: 'green', label: 'Green (525nm)' },
                  { value: 'blue', label: 'Blue (470nm)' },
                  { value: 'yellow', label: 'Amber Yellow (590nm)' },
                ]}
              />
            )}

            {/* Servo Angle */}
            {def.typeId === 'servo-sg90' && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 font-medium">Horn Angle:</span>
                  <span className="font-mono font-bold text-blue-600">{String(props.angle || 90)}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="180"
                  value={Number(props.angle) || 90}
                  onChange={(e) => updateNodeProperty(selectedNode.id, 'angle', Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            )}

            {/* Resistor Value */}
            {def.typeId === 'resistor' && (
              <Select
                label="Nominal Resistance"
                value={String(props.resistance || '10k Ω')}
                onChange={(e) => updateNodeProperty(selectedNode.id, 'resistance', e.target.value)}
                options={[
                  { value: '220 Ω', label: '220 Ω (LED Current Limiter)' },
                  { value: '330 Ω', label: '330 Ω (LED Current Limiter)' },
                  { value: '1k Ω', label: '1k Ω (Divider/Pull-up)' },
                  { value: '4.7k Ω', label: '4.7k Ω (I2C Pull-up)' },
                  { value: '10k Ω', label: '10k Ω (Standard Pull-up/down)' },
                  { value: '100k Ω', label: '100k Ω (High-Impedance)' },
                ]}
              />
            )}

            {/* LCD Lines */}
            {def.typeId === 'lcd-16x2-i2c' && (
              <div className="space-y-2">
                <Input
                  label="Display Line 1"
                  value={String(props.line1 || '')}
                  onChange={(e) => updateNodeProperty(selectedNode.id, 'line1', e.target.value)}
                  maxLength={16}
                />
                <Input
                  label="Display Line 2"
                  value={String(props.line2 || '')}
                  onChange={(e) => updateNodeProperty(selectedNode.id, 'line2', e.target.value)}
                  maxLength={16}
                />
              </div>
            )}

            {/* OLED Text */}
            {def.typeId === 'oled-096-i2c' && (
              <div className="space-y-2">
                <Input
                  label="Header Text"
                  value={String(props.headerText || '')}
                  onChange={(e) => updateNodeProperty(selectedNode.id, 'headerText', e.target.value)}
                  maxLength={20}
                />
                <Input
                  label="Telemetry Text"
                  value={String(props.bodyText || '')}
                  onChange={(e) => updateNodeProperty(selectedNode.id, 'bodyText', e.target.value)}
                  maxLength={24}
                />
              </div>
            )}

            {/* General Property List */}
            <div className="space-y-1 pt-1">
              {Object.entries(props).map(([key, val]) => {
                if (['color', 'angle', 'resistance', 'line1', 'line2', 'headerText', 'bodyText'].includes(key)) {
                  return null;
                }
                return (
                  <div key={key} className="flex items-center justify-between py-1 border-b border-slate-100 text-[11px]">
                    <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                    <span className="font-mono font-medium text-slate-800">{String(val)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pin Directory & GPIO Mapping */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Pin Definitions ({def.pins.length})
            </label>

            <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
              {def.pins.map((pin) => {
                const colors = getPinColor(pin);
                return (
                  <div
                    key={pin.id}
                    className="p-1.5 rounded bg-slate-50 border border-slate-200/80 flex items-center justify-between text-[10px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={cn('w-2 h-2 rounded-full', colors.bg)} />
                      <span className="font-mono font-bold text-slate-800">{pin.name}</span>
                    </div>

                    <div className="flex items-center gap-1 font-mono text-[9px] text-slate-500">
                      <span>{pin.voltage}</span>
                      <span>•</span>
                      <span className="capitalize">{pin.direction}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // When nothing is selected: Overview Dashboard
  const activeMcu = nodes.find((n) => n.data.componentDefinition?.category === 'microcontroller');

  return (
    <div className="w-80 shrink-0 bg-white border-l border-slate-200/90 flex flex-col h-full select-none">
      <div className="p-3.5 border-b border-slate-200/90 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Circuit Properties
            </h2>
            <p className="text-[10px] text-slate-500">
              Select a component or wire to inspect
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Workspace Telemetry */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Circuit Statistics
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Placed Modules</span>
              <span className="text-lg font-bold font-mono text-slate-900">
                {nodes.length}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Active Wires</span>
              <span className="text-lg font-bold font-mono text-blue-600">
                {edges.length}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Controller Status */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Target Host Controller
          </span>
          {activeMcu ? (
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              <div>
                <span className="font-bold text-slate-900 block">{activeMcu.data.label}</span>
                <span className="text-[10px] font-mono text-slate-500">
                  {activeMcu.data.componentDefinition.voltage} • {activeMcu.data.componentDefinition.pins.length} Pins
                </span>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">
              No microcontroller placed yet. Drag an ESP32 or Arduino Uno from the library.
            </p>
          )}
        </div>

        {/* Color Legend */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Wire Color Standards
          </span>
          <div className="space-y-1.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Power Rail (VCC / 5V / 3.3V)</span>
              </span>
              <span className="font-mono text-[10px] text-slate-400">Red</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                <span>Ground Return (GND)</span>
              </span>
              <span className="font-mono text-[10px] text-slate-400">Black</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Digital Signal / GPIO / PWM</span>
              </span>
              <span className="font-mono text-[10px] text-slate-400">Yellow</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Analog Signal / ADC Sensor</span>
              </span>
              <span className="font-mono text-[10px] text-slate-400">Blue</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Communication (I2C / SPI / UART)</span>
              </span>
              <span className="font-mono text-[10px] text-slate-400">Green</span>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Guide */}
        <div className="space-y-1.5 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Shortcuts
          </span>
          <div className="flex justify-between">
            <span>Delete Selected:</span>
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-mono">Del</kbd>
          </div>
          <div className="flex justify-between">
            <span>Undo / Redo:</span>
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-mono">Ctrl+Z / Y</kbd>
          </div>
          <div className="flex justify-between">
            <span>Save Circuit:</span>
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-mono">Ctrl+S</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
