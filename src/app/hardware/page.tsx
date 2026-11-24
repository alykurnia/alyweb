'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Sliders,
  Settings,
  Radio,
  Wifi,
  Workflow,
  Code2,
  Terminal,
} from 'lucide-react';
import Link from 'next/link';
import { DeviceManager } from '@/features/hardware/components/DeviceManager';
import { HardwareMonitor } from '@/features/hardware/components/HardwareMonitor';
import { GpioControlPanel } from '@/features/hardware/components/GpioControlPanel';
import { ConnectionSettings } from '@/features/hardware/components/ConnectionSettings';
import { useHardwareStore } from '@/features/hardware/stores/hardwareStore';

export default function HardwarePage() {
  const [activeTab, setActiveTab] = useState<'monitor' | 'devices' | 'gpio' | 'settings'>('monitor');
  const { bridgeStatus, init, registeredDevices, activeDeviceId, hardwareModeEnabled } = useHardwareStore();

  useEffect(() => {
    init();
  }, [init]);

  const activeDevice = registeredDevices.find((d) => d.deviceId === activeDeviceId);
  const isBridgeConnected = bridgeStatus === 'connected';

  return (
    <div className="flex-1 min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header Bar */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600/15 border border-blue-500/25 flex items-center justify-center">
            <Radio className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white">Hardware Integration Center</h1>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono">
                Physical IoT Studio
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live ESP32 telemetry, device pairing, and physical GPIO control via Local Bridge
            </p>
          </div>
        </div>

        {/* Bridge Status Pill & Quick Nav */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                isBridgeConnected
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-slate-400">Bridge:</span>
            <span className={isBridgeConnected ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {bridgeStatus.toUpperCase()}
            </span>
          </div>

          <Link
            href="/circuit-builder"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Workflow className="w-3.5 h-3.5 text-blue-400" />
            <span>Circuit Builder</span>
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="h-11 bg-slate-900/60 border-b border-slate-800/80 px-6 flex items-center gap-2 select-none text-xs">
        <button
          onClick={() => setActiveTab('monitor')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'monitor'
              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Hardware Monitor</span>
        </button>

        <button
          onClick={() => setActiveTab('devices')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'devices'
              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          <span>Device Manager</span>
          {registeredDevices.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
              {registeredDevices.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('gpio')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'gpio'
              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>GPIO Control</span>
          {hardwareModeEnabled && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'settings'
              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Settings className="w-3.5 h-3.5 text-slate-400" />
          <span>Connection Settings</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
        {activeTab === 'monitor' && <HardwareMonitor />}
        {activeTab === 'devices' && <DeviceManager />}
        {activeTab === 'gpio' && <GpioControlPanel />}
        {activeTab === 'settings' && <ConnectionSettings />}
      </div>
    </div>
  );
}
