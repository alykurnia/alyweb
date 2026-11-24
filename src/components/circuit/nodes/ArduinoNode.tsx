'use client';

import React from 'react';
import { NodeProps } from '@xyflow/react';
import { CircuitNode, CircuitNodeData } from '@/types/circuit';
import { PinHandle } from './PinHandle';
import { cn } from '@/lib/utils';
import { Cpu } from 'lucide-react';

export function ArduinoNode({ data, selected }: NodeProps<CircuitNode>) {
  const nodeData = data as CircuitNodeData;
  const def = nodeData.componentDefinition;

  const topPins = def.pins.filter((p) => p.position === 'top');
  const bottomPins = def.pins.filter((p) => p.position === 'bottom');

  return (
    <div
      className={cn(
        'relative rounded-2xl bg-[#00878F] text-white border-2 border-[#006066] shadow-xl transition-all select-none',
        selected && 'border-amber-400 ring-2 ring-amber-400/50 shadow-teal-900/40 shadow-2xl'
      )}
      style={{ width: 340, height: 260 }}
    >
      {/* Silver USB Type-B Port Visual on Left */}
      <div className="absolute top-8 -left-5 w-6 h-10 bg-gradient-to-r from-slate-300 to-slate-400 rounded-l border border-slate-500 shadow-inner flex items-center justify-center">
        <div className="w-2.5 h-6 bg-slate-900 rounded-xs" />
      </div>

      {/* Black DC Barrel Jack on Bottom-Left */}
      <div className="absolute bottom-6 -left-5 w-6 h-9 bg-slate-950 rounded-l border border-slate-800 shadow-md flex items-center justify-center">
        <div className="w-2 h-4 rounded-full bg-slate-700" />
      </div>

      {/* Top Digital & PWM Pin Header */}
      <div className="px-4 pt-2.5 pb-1 bg-[#00686F] rounded-t-xl border-b border-[#005257] flex items-center justify-between">
        <span className="text-[9px] font-mono font-bold text-teal-200 uppercase tracking-wider">
          DIGITAL (PWM ~)
        </span>
        <div className="flex items-center gap-1.5">
          {topPins.map((pin) => (
            <PinHandle key={pin.id} pin={pin} selected={selected} />
          ))}
        </div>
      </div>

      {/* Middle PCB Surface */}
      <div className="p-4 flex items-center justify-between">
        {/* Left Side: Reset Button & Crystal */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-rose-600 rounded-full border border-rose-800 shadow-xs flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
            <span className="text-[7px] font-mono font-bold text-teal-100">RESET</span>
          </div>

          {/* 16MHz Crystal */}
          <div className="w-6 h-3 bg-gradient-to-r from-slate-300 to-slate-400 rounded-xs border border-slate-500 text-[6px] font-mono text-slate-800 font-bold flex items-center justify-center">
            16.000
          </div>
        </div>

        {/* Center: ATmega328P DIP Chip */}
        <div className="flex flex-col items-center">
          <div className="w-32 h-10 bg-slate-900 rounded-sm border border-slate-700 shadow-md flex items-center justify-between px-2 text-slate-300">
            <div className="flex flex-col justify-between h-full py-0.5 opacity-60">
              <div className="w-1 h-0.5 bg-slate-400"></div>
              <div className="w-1 h-0.5 bg-slate-400"></div>
              <div className="w-1 h-0.5 bg-slate-400"></div>
            </div>
            <div className="text-center">
              <span className="text-[8px] font-mono font-bold text-slate-200 block">ATmega328P</span>
              <span className="text-[6px] font-mono text-slate-400 block">MICROCHIP / ATMEL</span>
            </div>
            <div className="flex flex-col justify-between h-full py-0.5 opacity-60">
              <div className="w-1 h-0.5 bg-slate-400"></div>
              <div className="w-1 h-0.5 bg-slate-400"></div>
              <div className="w-1 h-0.5 bg-slate-400"></div>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[8px] font-bold text-teal-100 font-mono tracking-tight">
            <Cpu className="w-3 h-3" />
            <span>{nodeData.label || 'ARDUINO UNO'}</span>
          </div>
        </div>

        {/* Right Side: LEDs & Gold Uno Logo */}
        <div className="flex flex-col items-end gap-1.5 text-[7px] font-mono text-teal-100">
          <div className="flex items-center gap-1">
            <span>ON</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400"></span>
          </div>
          <div className="flex items-center gap-1">
            <span>L</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-xs shadow-amber-400 animate-pulse"></span>
          </div>
          <div className="flex items-center gap-1">
            <span>TX/RX</span>
            <div className="flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-amber-400"></span>
              <span className="w-1 h-1 rounded-full bg-amber-400"></span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Header: Power & Analog Inputs */}
      <div className="absolute bottom-0 inset-x-0 px-4 py-2 bg-[#00686F] rounded-b-xl border-t border-[#005257] flex items-center justify-between">
        <span className="text-[9px] font-mono font-bold text-teal-200 uppercase tracking-wider">
          POWER / ANALOG IN
        </span>
        <div className="flex items-center gap-1.5">
          {bottomPins.map((pin) => (
            <PinHandle key={pin.id} pin={pin} selected={selected} />
          ))}
        </div>
      </div>
    </div>
  );
}
