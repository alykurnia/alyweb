'use client';

import React from 'react';
import { NodeProps } from '@xyflow/react';
import { CircuitNode, CircuitNodeData } from '@/types/circuit';
import { PinHandle } from './PinHandle';
import { useSimulationStore } from '@/stores/simulationStore';
import { cn } from '@/lib/utils';
import { Zap, RotateCw, ToggleLeft, Volume2, Flame } from 'lucide-react';

export function ActuatorNode({ id, data, selected }: NodeProps<CircuitNode>) {
  const nodeData = data as CircuitNodeData;
  const def = nodeData.componentDefinition;
  const pins = def.pins;
  const props = nodeData.properties || {};

  const live = useSimulationStore((s) => s.liveActuators[id]);
  const simState = useSimulationStore((s) => s.state);
  const isSimActive = simState === 'running' || simState === 'paused';

  const isLED = def.typeId === 'led';
  const isRelay = def.typeId === 'relay' || def.typeId === 'relay-module';
  const isServo = def.typeId === 'servo' || def.typeId === 'servo-sg90';
  const isBuzzer = def.typeId === 'buzzer';

  const ledColor = String(props.color || 'red');

  // LED state
  const isLedOn = isSimActive && Boolean(live?.state?.isOn);
  const isLedBurnt = isSimActive && Boolean(live?.state?.isBurntOut);
  const ledBrightness = typeof live?.state?.brightness === 'number' ? live.state.brightness : 0;

  // Relay state
  const isRelayEnergized = isSimActive && Boolean(live?.state?.isEnergized);

  // Servo state
  const servoAngle = isSimActive && typeof live?.state?.angle === 'number' ? live.state.angle : 90;

  // Buzzer state
  const isBuzzerSounding = isSimActive && Boolean(live?.state?.isSounding);

  return (
    <div
      className={cn(
        'relative rounded-xl bg-slate-900 text-white border-2 border-slate-700 shadow-xl transition-all select-none p-3',
        selected && 'border-amber-500 ring-2 ring-amber-500/50 shadow-amber-900/30 shadow-xl'
      )}
      style={{ minWidth: 160 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 min-w-0">
          {isLED && <Zap className={cn('w-3.5 h-3.5 shrink-0', isLedOn ? 'text-amber-300 animate-pulse' : 'text-rose-400')} />}
          {isRelay && <ToggleLeft className={cn('w-3.5 h-3.5 shrink-0', isRelayEnergized ? 'text-emerald-400' : 'text-blue-400')} />}
          {isServo && <RotateCw className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
          {isBuzzer && <Volume2 className={cn('w-3.5 h-3.5 shrink-0', isBuzzerSounding ? 'text-purple-400 animate-bounce' : 'text-slate-400')} />}
          <span className="text-[11px] font-bold text-slate-100 truncate">
            {nodeData.label || def.name}
          </span>
        </div>
        <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-300">
          {def.voltage}
        </span>
      </div>

      {/* Visual Actuator Package */}
      <div className="my-2 p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex flex-col items-center justify-center relative">
        {/* 5mm LED Bulb */}
        {isLED && (
          <div className="flex flex-col items-center">
            {isLedBurnt ? (
              <div className="flex flex-col items-center">
                <div className="w-8 h-10 rounded-t-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-orange-500" />
                </div>
                <span className="text-[8px] text-rose-400 font-mono font-bold mt-1">BURNT OUT</span>
              </div>
            ) : (
              <>
                <div
                  className={cn(
                    'w-8 h-10 rounded-t-full border transition-all duration-200 flex items-center justify-center',
                    isLedOn
                      ? cn(
                          'scale-105',
                          ledColor === 'red' && 'bg-rose-500 border-rose-300 shadow-[0_0_24px_rgba(244,63,94,0.9)] animate-pulse',
                          ledColor === 'green' && 'bg-emerald-500 border-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.9)] animate-pulse',
                          ledColor === 'blue' && 'bg-blue-500 border-blue-300 shadow-[0_0_24px_rgba(59,130,246,0.9)] animate-pulse',
                          ledColor === 'yellow' && 'bg-amber-400 border-amber-200 shadow-[0_0_24px_rgba(251,191,36,0.9)] animate-pulse'
                        )
                      : cn(
                          'opacity-40',
                          ledColor === 'red' && 'bg-rose-900 border-rose-800',
                          ledColor === 'green' && 'bg-emerald-900 border-emerald-800',
                          ledColor === 'blue' && 'bg-blue-900 border-blue-800',
                          ledColor === 'yellow' && 'bg-amber-900 border-amber-800'
                        )
                  )}
                >
                  <div className={cn('w-3 h-3 rounded-full', isLedOn ? 'bg-white/80' : 'bg-white/20')} />
                </div>
                <div className="w-9 h-1.5 bg-slate-700 rounded-xs mt-0.5" />
                {isSimActive && (
                  <span className={cn('text-[9px] font-mono font-bold mt-1', isLedOn ? 'text-emerald-400' : 'text-slate-500')}>
                    {isLedOn ? `ON (${ledBrightness}%)` : 'OFF'}
                  </span>
                )}
              </>
            )}
          </div>
        )}

        {/* 5V Songle Blue Relay Box */}
        {isRelay && (
          <div
            className={cn(
              'w-24 h-18 rounded border p-1.5 flex flex-col justify-between text-white transition-all',
              isRelayEnergized
                ? 'bg-blue-600 border-emerald-400 shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                : 'bg-blue-800 border-blue-600 opacity-90'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[7px] font-mono font-bold">SONGLE</span>
              <span
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  isRelayEnergized
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]'
                    : 'bg-slate-600'
                )}
              />
            </div>
            <div className="text-center font-mono">
              <span className="text-[8px] font-bold block leading-none">SRD-05VDC</span>
              <span className="text-[6px] text-blue-200 block">10A 250VAC</span>
            </div>
            <div className="flex items-center justify-between text-[7px] font-mono">
              <span className="text-blue-200">ACTIVE LOW</span>
              <span className={cn('font-bold', isRelayEnergized ? 'text-emerald-300' : 'text-slate-400')}>
                {isRelayEnergized ? 'CLOSED' : 'OPEN'}
              </span>
            </div>
          </div>
        )}

        {/* SG90 Micro Servo */}
        {isServo && (
          <div className="flex flex-col items-center py-1">
            {/* White Rotating Horn */}
            <div
              className="relative w-14 h-4 bg-slate-200 rounded-full border border-slate-400 flex items-center justify-center shadow-xs transition-transform duration-300 ease-out"
              style={{ transform: `rotate(${servoAngle - 90}deg)` }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
              <div className="absolute left-1 w-1.5 h-1.5 rounded-full bg-slate-400" />
              <div className="absolute right-1 w-1.5 h-1.5 rounded-full bg-slate-400" />
            </div>

            {/* Blue Motor Body */}
            <div className="w-16 h-12 bg-blue-600 rounded border border-blue-400 shadow-md p-1 mt-1.5 text-center font-mono flex flex-col justify-between">
              <span className="text-[8px] font-bold text-white leading-tight">Tower Pro</span>
              <span className="text-[7px] text-blue-200">SG90 9g</span>
              <span className="text-[7px] text-amber-300 font-bold">{servoAngle}°</span>
            </div>
          </div>
        )}

        {/* Piezo Sounder Buzzer */}
        {isBuzzer && (
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center transition-all',
                isBuzzerSounding
                  ? 'bg-purple-900 border-purple-400 shadow-[0_0_16px_rgba(168,85,247,0.8)] animate-pulse'
                  : 'bg-slate-800 border-slate-600 shadow-inner'
              )}
            >
              <div className="w-4 h-4 rounded-full bg-slate-950 flex items-center justify-center">
                <span className={cn('text-[7px] font-bold', isBuzzerSounding ? 'text-purple-300' : 'text-slate-400')}>+</span>
              </div>
              <span className="text-[6px] font-mono text-slate-400 mt-0.5">85dB</span>
            </div>
            {isSimActive && (
              <span className={cn('text-[8px] font-mono mt-1', isBuzzerSounding ? 'text-purple-300 font-bold' : 'text-slate-500')}>
                {isBuzzerSounding ? 'BEEPING' : 'SILENT'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Pin Headers */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-around gap-2">
        {pins.map((pin) => (
          <PinHandle key={pin.id} pin={pin} selected={selected} />
        ))}
      </div>
    </div>
  );
}
