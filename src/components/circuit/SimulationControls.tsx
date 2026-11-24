'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSimulationStore } from '@/stores/simulationStore';
import { useCircuitStore } from '@/stores/circuitStore';
import { useHardwareStore } from '@/features/hardware/stores/hardwareStore';
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  Terminal,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Gauge,
  Code2,
  Radio,
  Cpu,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function SimulationControls() {
  const {
    state,
    speed,
    timeFormatted,
    validationIssues,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    stopSimulation,
    resetSimulation,
    setSpeed,
    toggleConsole,
    isConsoleOpen,
    toggleSensorsPanel,
    isSensorsPanelOpen,
    toggleValidationModal,
  } = useSimulationStore();

  const { nodes, edges } = useCircuitStore();
  const {
    hardwareModeEnabled,
    setHardwareModeEnabled,
    registeredDevices,
    activeDeviceId,
  } = useHardwareStore();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);

  const activeDevice = registeredDevices.find((d) => d.deviceId === activeDeviceId) || registeredDevices[0];
  const isDeviceOnline = activeDevice && activeDevice.status === 'connected';

  const errorCount = validationIssues.filter((i) => i.severity === 'FATAL' || i.severity === 'ERROR').length;
  const warningCount = validationIssues.filter((i) => i.severity === 'WARNING').length;

  const handleStart = () => {
    startSimulation(nodes, edges);
  };

  const handleModeSwitch = () => {
    if (hardwareModeEnabled) {
      // Revert to Simulation Mode immediately
      setHardwareModeEnabled(false);
    } else {
      // Prompt confirmation before enabling Hardware Mode
      setShowConfirmModal(true);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border-b border-slate-800 text-slate-200 text-xs select-none">
        {/* Simulation / Hardware Mode Selector */}
        <div className="flex items-center gap-1.5 pr-2 border-r border-slate-800">
          <button
            onClick={handleModeSwitch}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border',
              hardwareModeEnabled
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            )}
            title="Toggle between Virtual Simulation and Physical Hardware mode"
          >
            <Radio className={cn('w-3.5 h-3.5', hardwareModeEnabled ? 'text-emerald-400 animate-pulse' : 'text-blue-400')} />
            <span>{hardwareModeEnabled ? 'HARDWARE MODE' : 'SIMULATION MODE'}</span>
          </button>

          {hardwareModeEnabled && (
            <button
              onClick={() => setShowMappingModal(true)}
              className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300 hover:bg-slate-700"
              title="View Circuit Pin to Physical ESP32 Mapping"
            >
              Pin Mapping
            </button>
          )}
        </div>

        {/* Simulation Engine Status Indicator */}
        <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
          <div className="flex items-center gap-1.5 font-medium">
            <span
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-all duration-300',
                state === 'running' && 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse',
                state === 'paused' && 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]',
                state === 'error' && 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-bounce',
                (state === 'idle' || state === 'stopped') && 'bg-slate-500'
              )}
            />
            <span className="uppercase text-[10px] tracking-wider font-semibold text-slate-300">
              {state}
            </span>
          </div>

          {/* Elapsed Simulation Time */}
          <div className="font-mono text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px] font-semibold tracking-wider">
            {timeFormatted}
          </div>
        </div>

      {/* Primary Execution Controls */}
      <div className="flex items-center gap-1">
        {state === 'idle' || state === 'stopped' || state === 'error' ? (
          <button
            onClick={handleStart}
            disabled={nodes.length === 0}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-white shadow-sm transition-colors"
            title="Start Simulation Engine"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run</span>
          </button>
        ) : state === 'running' ? (
          <button
            onClick={pauseSimulation}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 active:bg-amber-700 font-medium text-white shadow-sm transition-colors"
            title="Pause Simulation"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
            <span>Pause</span>
          </button>
        ) : (
          <button
            onClick={resumeSimulation}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 font-medium text-white shadow-sm transition-colors"
            title="Resume Simulation"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Resume</span>
          </button>
        )}

        {(state === 'running' || state === 'paused') && (
          <button
            onClick={stopSimulation}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-900/60 hover:text-rose-300 text-slate-300 border border-slate-700 transition-colors"
            title="Stop Simulation"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Stop</span>
          </button>
        )}

        <button
          onClick={resetSimulation}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          title="Reset Simulation State & Time"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Speed Multiplier Selector */}
      <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
        <Gauge className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[10px] text-slate-400 mr-1">Speed:</span>
        <div className="flex bg-slate-950 rounded border border-slate-800 p-0.5">
          {[0.5, 1.0, 2.0, 5.0].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors',
                speed === s
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      {/* Validation Issue Pill */}
      <button
        onClick={toggleValidationModal}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded border transition-colors text-[11px]',
          errorCount > 0
            ? 'bg-rose-950/40 border-rose-800 text-rose-300 hover:bg-rose-900/40'
            : warningCount > 0
            ? 'bg-amber-950/40 border-amber-800 text-amber-300 hover:bg-amber-900/40'
            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
        )}
        title="View Circuit Validation Analysis"
      >
        {errorCount > 0 ? (
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
        ) : warningCount > 0 ? (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        )}
        <span>
          {errorCount > 0
            ? `${errorCount} Error${errorCount > 1 ? 's' : ''}`
            : warningCount > 0
            ? `${warningCount} Warning${warningCount > 1 ? 's' : ''}`
            : 'Circuit Valid'}
        </span>
      </button>

      {/* Interactive Sensor & Actuator Controls Drawer Toggle */}
      <button
        onClick={toggleSensorsPanel}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded border transition-colors',
          isSensorsPanelOpen
            ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
        )}
        title="Open Interactive Sensor & Actuator Slider Controls"
      >
        <Sliders className="w-3.5 h-3.5" />
        <span>Live Sensors</span>
      </button>

      {/* Console Drawer Toggle */}
      <button
        onClick={toggleConsole}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded border transition-colors',
          isConsoleOpen
            ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
        )}
        title="Toggle Simulation Terminal Console"
      >
        <Terminal className="w-3.5 h-3.5" />
        <span>Console</span>
      </button>

      {/* Code Editor Link */}
      <Link
        href="/code-editor"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded border bg-blue-600/15 border-blue-500/30 text-blue-400 hover:bg-blue-600/25 transition-colors font-medium"
        title="Open Arduino Code Editor & Programming Engine"
      >
        <Code2 className="w-3.5 h-3.5" />
        <span>Code Editor</span>
      </Link>
    </div>

    {/* Hardware Mode Confirmation Modal */}
    {showConfirmModal && (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
          <div className="flex items-center gap-3 text-amber-400">
            <ShieldAlert className="w-6 h-6 shrink-0" />
            <h3 className="font-bold text-sm text-white">Switch to Physical Hardware Mode?</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Target Device: <strong className="text-emerald-400">{activeDevice?.name}</strong> ({activeDevice?.boardType || 'ESP32'}).
          </p>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 space-y-1">
            <p><strong>Warning:</strong> In Hardware Mode, GPIO commands will be dispatched to your physical board over the Local Bridge Agent.</p>
            <p>Components (such as relays, motors, and LEDs) physically wired to your board may actuate immediately.</p>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowConfirmModal(false);
                setHardwareModeEnabled(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-sm"
            >
              Confirm & Enable Hardware Mode
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Hardware Pin Mapping Overlay Modal */}
    {showMappingModal && (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              Circuit to Physical ESP32 Pin Mapping
            </h3>
            <button onClick={() => setShowMappingModal(false)} className="text-slate-500 hover:text-slate-300">✕</button>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1.5 text-xs font-mono">
            {edges.length === 0 ? (
              <div className="text-slate-500 italic p-4 text-center">No wires connected in circuit canvas yet.</div>
            ) : (
              edges.map((edge) => {
                const sourceNode = nodes.find((n) => n.id === edge.source);
                const targetNode = nodes.find((n) => n.id === edge.target);
                return (
                  <div key={edge.id} className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-blue-400">{sourceNode?.data?.label || edge.source}</span>
                      <span className="text-slate-500 mx-1.5">[{edge.sourceHandle}]</span>
                      <span className="text-slate-400">➔</span>
                      <span className="text-emerald-400 ml-1.5">{targetNode?.data?.label || edge.target}</span>
                      <span className="text-slate-500 ml-1.5">[{edge.targetHandle}]</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {edge.data?.signalType || 'signal'}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setShowMappingModal(false)}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
