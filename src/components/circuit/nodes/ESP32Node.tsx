'use client';

import React from 'react';
import { NodeProps } from '@xyflow/react';
import { CircuitNode, CircuitNodeData } from '@/types/circuit';
import { PinHandle } from './PinHandle';
import { cn } from '@/lib/utils';
import { Wifi, Radio, Cpu } from 'lucide-react';

export function ESP32Node({ data, selected }: NodeProps<CircuitNode>) {
  const nodeData = data as CircuitNodeData;
  const def = nodeData.componentDefinition;

  const leftPins = def.pins.filter((p) => p.position === 'left');
  const rightPins = def.pins.filter((p) => p.position === 'right');

  return (
    <div
      className={cn(
        'relative rounded-xl bg-[#0D1117] text-white border-2 border-slate-700/80 shadow-xl transition-all select-none',
        selected && 'border-blue-500 ring-2 ring-blue-500/40 shadow-blue-900/30 shadow-2xl'
      )}
      style={{ width: 250 }}
    >
      {/* Top USB Receptacle Visual */}
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-12 h-4 bg-gradient-to-b from-slate-300 to-slate-400 rounded-t-sm border border-slate-500 shadow-inner flex items-center justify-center">
        <div className="w-8 h-1.5 bg-slate-900 rounded-xs" />
      </div>

      {/* Header Bar */}
      <div className="px-3 pt-3 pb-1 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px] font-bold tracking-tight text-slate-100 font-mono">
            {nodeData.label || 'ESP32 DevKit V1'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[8px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.5 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          3V3
        </div>
      </div>

      {/* Main Board PCB Surface */}
      <div className="p-2.5 flex items-stretch justify-between gap-1">
        {/* Left Pin Header Column */}
        <div className="flex flex-col justify-between space-y-1.5 py-1">
          {leftPins.map((pin) => (
            <PinHandle key={pin.id} pin={pin} selected={selected} />
          ))}
        </div>

        {/* Center PCB Visual Details: RF Shield, Buttons, LEDs, Antenna */}
        <div className="flex-1 flex flex-col items-center justify-between px-1.5 py-1">
          {/* PCB Serpentine Antenna on Top */}
          <div className="w-full h-7 bg-slate-900/80 rounded border border-amber-500/20 flex items-center justify-center p-1">
            <svg width="100%" height="16" viewBox="0 0 100 16" className="text-amber-500/50">
              <path
                d="M 5,8 L 15,2 L 25,14 L 35,2 L 45,14 L 55,2 L 65,14 L 75,2 L 85,14 L 95,8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          {/* Metallic RF Can Shield */}
          <div className="w-24 h-28 my-2 rounded bg-gradient-to-br from-slate-400 via-slate-300 to-slate-500 border border-slate-300 shadow-md p-1.5 flex flex-col justify-between text-slate-800">
            <div className="flex items-center justify-between text-[7px] font-mono font-bold tracking-tighter">
              <span>ESPRESSIF</span>
              <div className="flex gap-1 text-slate-700">
                <Wifi className="w-2.5 h-2.5" />
                <Radio className="w-2.5 h-2.5" />
              </div>
            </div>
            <div className="text-center font-mono">
              <span className="text-[9px] font-extrabold block tracking-tight leading-none">
                ESP-WROOM-32
              </span>
              <span className="text-[6px] text-slate-600 block mt-0.5">FCC ID: 2AC7Z-ESPWROOM32</span>
            </div>
            <div className="flex items-center justify-between text-[6px] font-mono text-slate-600">
              <span>Xtensa LX6</span>
              <span>240MHz</span>
            </div>
          </div>

          {/* Tactile Buttons and LEDs */}
          <div className="w-full space-y-2 mt-auto">
            {/* Tactile Push Buttons: EN and BOOT */}
            <div className="flex items-center justify-between px-1 text-[8px] font-mono text-slate-400">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 bg-slate-800 rounded-xs border border-slate-600 shadow-xs flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                </div>
                <span className="mt-0.5 text-[7px]">EN</span>
              </div>

              {/* Status LEDs */}
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-center" title="Power LED">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shadow-xs shadow-rose-500"></span>
                  <span className="text-[6px] text-slate-500 mt-0.5">PWR</span>
                </div>
                <div className="flex flex-col items-center" title="GPIO2 Builtin LED">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shadow-xs shadow-blue-500 animate-pulse"></span>
                  <span className="text-[6px] text-slate-500 mt-0.5">D2</span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-4 h-4 bg-slate-800 rounded-xs border border-slate-600 shadow-xs flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                </div>
                <span className="mt-0.5 text-[7px]">BOOT</span>
              </div>
            </div>

            {/* CP2102 / CH340 USB Chip representation */}
            <div className="w-full bg-slate-900 rounded p-1 border border-slate-800 text-center">
              <span className="text-[7px] font-mono text-slate-400 font-semibold block">
                CP2102 USB-UART
              </span>
            </div>
          </div>
        </div>

        {/* Right Pin Header Column */}
        <div className="flex flex-col justify-between space-y-1.5 py-1">
          {rightPins.map((pin) => (
            <PinHandle key={pin.id} pin={pin} selected={selected} />
          ))}
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="px-3 py-1.5 bg-slate-950/80 border-t border-slate-800/80 rounded-b-xl flex items-center justify-between text-[8px] font-mono text-slate-400">
        <span>Dual-Core 32-bit</span>
        <span className="text-blue-400">30 Pins Total</span>
      </div>
    </div>
  );
}
