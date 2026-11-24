'use client';

import React from 'react';
import { NodeProps } from '@xyflow/react';
import { CircuitNode, CircuitNodeData } from '@/types/circuit';
import { PinHandle } from './PinHandle';
import { useSimulationStore } from '@/stores/simulationStore';
import { cn } from '@/lib/utils';
import { Tv, Monitor } from 'lucide-react';

export function DisplayNode({ id, data, selected }: NodeProps<CircuitNode>) {
  const nodeData = data as CircuitNodeData;
  const def = nodeData.componentDefinition;
  const pins = def.pins;
  const props = nodeData.properties || {};

  const live = useSimulationStore((s) => s.liveDisplays[id]);
  const simState = useSimulationStore((s) => s.state);
  const isSimActive = simState === 'running' || simState === 'paused';

  const isLCD = def.typeId === 'lcd1602' || def.typeId === 'lcd-16x2-i2c';
  const isOLED = def.typeId === 'oled' || def.typeId === 'oled-096-i2c';

  // Real-time LCD lines
  const lcdLine1 = live?.lines?.[0] || String(props.line1 || 'IoT Lab Ready');
  const lcdLine2 = live?.lines?.[1] || String(props.line2 || 'Sensors: Active');

  // Real-time OLED lines
  const oledLines = live?.lines || [
    String(props.headerText || 'IoT Lab SSD1306'),
    String(props.bodyText || 'System Online'),
    'Telemetry Ready',
    'I2C: 0x3C',
  ];

  const isPowered = isSimActive ? live?.isPowered : true;

  return (
    <div
      className={cn(
        'relative rounded-xl bg-slate-900 text-white border-2 border-slate-700 shadow-xl transition-all select-none p-3',
        selected && 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-indigo-900/30 shadow-xl'
      )}
      style={{ minWidth: isLCD ? 240 : 190 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 min-w-0">
          {isLCD ? <Tv className="w-3.5 h-3.5 text-blue-400" /> : <Monitor className="w-3.5 h-3.5 text-cyan-400" />}
          <span className="text-[11px] font-bold text-slate-100 truncate">
            {nodeData.label || def.name}
          </span>
        </div>
        <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-300">
          {String(live?.i2cAddress || props.i2cAddress || (isLCD ? '0x27' : '0x3C'))}
        </span>
      </div>

      {/* Screen Visual Representation */}
      <div className="my-2 p-2 rounded-lg bg-slate-950 border border-slate-800 flex flex-col items-center justify-center">
        {/* LCD 16x2 Matrix Backlight */}
        {isLCD && (
          <div
            className={cn(
              'w-full rounded border-2 p-2 font-mono text-[10px] leading-tight tracking-wider shadow-inner transition-all',
              isPowered
                ? 'bg-[#1A3A8F] border-blue-400 text-cyan-200 shadow-[0_0_12px_rgba(30,58,138,0.6)]'
                : 'bg-slate-900 border-slate-800 text-slate-600 opacity-60'
            )}
          >
            <div className={cn('px-2 py-1 rounded', isPowered ? 'bg-[#122A6D]' : 'bg-slate-950')}>
              <div className="font-semibold truncate font-mono">
                {isPowered ? lcdLine1 : ' '.repeat(16)}
              </div>
              <div className={cn('truncate font-mono', isPowered ? 'text-cyan-300/90' : 'text-slate-700')}>
                {isPowered ? lcdLine2 : ' '.repeat(16)}
              </div>
            </div>
            <div className="flex items-center justify-between mt-1 text-[7px] text-cyan-400/60 uppercase">
              <span>HD44780 I2C</span>
              <span>16x2 CHAR</span>
            </div>
          </div>
        )}

        {/* OLED 0.96 128x64 Deep Black Panel */}
        {isOLED && (
          <div className="w-full bg-slate-950 rounded-lg border-2 border-slate-800 p-2 font-mono shadow-inner">
            <div
              className={cn(
                'border rounded p-1.5 transition-all',
                isPowered
                  ? 'border-cyan-500/50 bg-black shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'border-slate-800 bg-slate-950 opacity-40'
              )}
            >
              {isPowered ? (
                <div className="space-y-0.5">
                  {oledLines.slice(0, 4).map((line, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'text-[8px] truncate',
                        idx === 0
                          ? 'font-bold text-amber-300 border-b border-cyan-500/30 pb-0.5'
                          : 'text-cyan-300'
                      )}
                    >
                      {line}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-10 flex items-center justify-center text-[8px] text-slate-700">
                  DISPLAY OFF
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mt-1 text-[6px] text-slate-500 font-mono">
              <span>SSD1306 OLED</span>
              <span>128x64 PX</span>
            </div>
          </div>
        )}
      </div>

      {/* Pins Layout */}
      <div
        className={cn(
          'pt-2 border-t border-slate-800 flex items-center justify-around gap-2',
          isLCD && 'justify-start pl-2'
        )}
      >
        {pins.map((pin) => (
          <PinHandle key={pin.id} pin={pin} selected={selected} />
        ))}
      </div>
    </div>
  );
}
