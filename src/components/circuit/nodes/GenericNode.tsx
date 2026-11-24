'use client';

import React from 'react';
import { NodeProps } from '@xyflow/react';
import { CircuitNode, CircuitNodeData } from '@/types/circuit';
import { PinHandle } from './PinHandle';
import { cn } from '@/lib/utils';
import { Radio, Compass, Bluetooth, Minus, Grid, BatteryCharging } from 'lucide-react';

export function GenericNode({ data, selected }: NodeProps<CircuitNode>) {
  const nodeData = data as CircuitNodeData;
  const def = nodeData.componentDefinition;
  const pins = def.pins;

  const isResistor = def.typeId === 'resistor';
  const isBreadboard = def.typeId === 'breadboard-half';
  const isPower = def.typeId === 'power-module-mb102';
  const isLoRa = def.typeId === 'lora-sx1278';
  const isGPS = def.typeId === 'gps-neo6m';
  const isBT = def.typeId === 'bluetooth-hc05';

  const leftPins = pins.filter((p) => p.position === 'left');
  const rightPins = pins.filter((p) => p.position === 'right');
  const topPins = pins.filter((p) => p.position === 'top');
  const bottomPins = pins.filter((p) => p.position === 'bottom');

  return (
    <div
      className={cn(
        'relative rounded-xl bg-slate-900 text-white border-2 border-slate-700 shadow-xl transition-all select-none p-3',
        selected && 'border-purple-500 ring-2 ring-purple-500/50 shadow-purple-900/30 shadow-xl'
      )}
      style={{ minWidth: isBreadboard ? 280 : 180 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 min-w-0">
          {isLoRa && <Radio className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
          {isGPS && <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
          {isBT && <Bluetooth className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
          {isResistor && <Minus className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
          {isBreadboard && <Grid className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
          {isPower && <BatteryCharging className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
          <span className="text-[11px] font-bold text-slate-100 truncate">
            {nodeData.label || def.name}
          </span>
        </div>
        <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-300">
          {def.voltage}
        </span>
      </div>

      {/* Top Pins if any */}
      {topPins.length > 0 && (
        <div className="flex items-center justify-around gap-2 mb-2 pb-1 border-b border-slate-800/80">
          {topPins.map((pin) => (
            <PinHandle key={pin.id} pin={pin} selected={selected} />
          ))}
        </div>
      )}

      {/* Main Body */}
      <div className="flex items-center justify-between gap-2 my-2">
        {/* Left Pins if any */}
        {leftPins.length > 0 && (
          <div className="flex flex-col space-y-2">
            {leftPins.map((pin) => (
              <PinHandle key={pin.id} pin={pin} selected={selected} />
            ))}
          </div>
        )}

        {/* Center Graphic */}
        <div className="flex-1 p-2 rounded-lg bg-slate-950 border border-slate-800 flex flex-col items-center justify-center">
          {/* Resistor Color Code Bands */}
          {isResistor && (
            <div className="flex items-center justify-center gap-1 w-full py-1">
              <div className="w-4 h-0.5 bg-slate-400" />
              <div className="w-16 h-6 bg-[#C99E6B] rounded-sm border border-[#A67B47] flex items-center justify-around px-1 shadow-xs">
                <div className="w-1.5 h-full bg-amber-800" />
                <div className="w-1.5 h-full bg-black" />
                <div className="w-1.5 h-full bg-amber-500" />
                <div className="w-1.5 h-full bg-yellow-400" />
              </div>
              <div className="w-4 h-0.5 bg-slate-400" />
            </div>
          )}

          {/* Breadboard Visual Rails */}
          {isBreadboard && (
            <div className="w-full bg-slate-100 rounded p-1.5 border border-slate-300 text-slate-800 font-mono shadow-xs">
              <div className="flex justify-between text-[7px] text-rose-600 font-bold px-1">
                <span>+ + + + + + + +</span>
                <span>+ + + + + + + +</span>
              </div>
              <div className="flex justify-between text-[7px] text-blue-600 font-bold px-1 my-0.5">
                <span>- - - - - - - -</span>
                <span>- - - - - - - -</span>
              </div>
              <div className="text-[7px] text-slate-500 text-center py-1 bg-white rounded border border-slate-200">
                400 TIE-POINTS BREADBOARD
              </div>
            </div>
          )}

          {/* MB102 Power Supply Visual */}
          {isPower && (
            <div className="text-center font-mono">
              <span className="text-[8px] font-bold text-emerald-400 block">MB102 REGULATOR</span>
              <span className="text-[7px] text-slate-400 block mt-0.5">Dual 3.3V / 5.0V Rails</span>
            </div>
          )}

          {/* LoRa Ra-02 Module */}
          {isLoRa && (
            <div className="text-center font-mono">
              <span className="text-[8px] font-bold text-blue-400 block">SX1278 Ra-02</span>
              <span className="text-[7px] text-slate-400 block mt-0.5">433MHz SPI LoRa</span>
            </div>
          )}

          {/* GPS NEO-6M */}
          {isGPS && (
            <div className="text-center font-mono">
              <div className="w-10 h-10 bg-amber-100 rounded-sm border border-amber-300 flex items-center justify-center text-[7px] font-bold text-amber-900 mx-auto mb-1">
                CERAMIC
              </div>
              <span className="text-[7px] text-slate-400">NEO-6M NMEA</span>
            </div>
          )}

          {/* HC-05 */}
          {isBT && (
            <div className="text-center font-mono">
              <span className="text-[8px] font-bold text-indigo-400 block">HC-05 BLUETOOTH</span>
              <span className="text-[7px] text-slate-400 block mt-0.5">UART SPP 38400</span>
            </div>
          )}
        </div>

        {/* Right Pins if any */}
        {rightPins.length > 0 && (
          <div className="flex flex-col space-y-2">
            {rightPins.map((pin) => (
              <PinHandle key={pin.id} pin={pin} selected={selected} />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Pins if any */}
      {bottomPins.length > 0 && (
        <div className="flex items-center justify-around gap-2 mt-2 pt-1 border-t border-slate-800/80">
          {bottomPins.map((pin) => (
            <PinHandle key={pin.id} pin={pin} selected={selected} />
          ))}
        </div>
      )}
    </div>
  );
}
