'use client';

import React from 'react';
import { NodeProps } from '@xyflow/react';
import { CircuitNode, CircuitNodeData } from '@/types/circuit';
import { PinHandle } from './PinHandle';
import { useSimulationStore } from '@/stores/simulationStore';
import { cn } from '@/lib/utils';
import { Thermometer, Wind, Droplets, Sun, Gauge, Activity } from 'lucide-react';

export function SensorNode({ id, data, selected }: NodeProps<CircuitNode>) {
  const nodeData = data as CircuitNodeData;
  const def = nodeData.componentDefinition;
  const pins = def.pins;

  const live = useSimulationStore((s) => s.liveSensors[id]);
  const simState = useSimulationStore((s) => s.state);
  const isSimActive = simState === 'running' || simState === 'paused';

  // Custom visual styling based on component type
  const isDHT = def.typeId === 'dht22' || def.typeId === 'dht11';
  const isSonar = def.typeId === 'hc-sr04' || def.typeId === 'ultrasonic';
  const isMQ = def.typeId === 'mq135';
  const isSoil = def.typeId === 'soil-moisture';
  const isLight = def.typeId === 'bh1750';
  const isBMP = def.typeId === 'bmp280';

  return (
    <div
      className={cn(
        'relative rounded-xl bg-slate-900 text-white border-2 border-slate-700 shadow-xl transition-all select-none p-3',
        selected && 'border-blue-500 ring-2 ring-blue-500/50 shadow-blue-900/30 shadow-xl'
      )}
      style={{ minWidth: 175 }}
    >
      {/* Sensor Title Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 min-w-0">
          {isDHT && <Thermometer className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
          {isSonar && <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
          {isMQ && <Wind className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
          {isSoil && <Droplets className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
          {isLight && <Sun className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
          {isBMP && <Gauge className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
          <span className="text-[11px] font-bold text-slate-100 truncate">
            {nodeData.label || def.name}
          </span>
        </div>
        <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          {def.voltage}
        </span>
      </div>

      {/* Sensor Package Visual Representation */}
      <div className="my-2 p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex flex-col items-center justify-center">
        {/* DHT22 White Plastic Grill */}
        {isDHT && (
          <div className="w-20 h-16 bg-slate-100 rounded border border-slate-300 p-1 flex flex-col justify-between shadow-xs">
            <div className="flex flex-col gap-1 py-1">
              <div className="h-1 bg-slate-300 rounded-full" />
              <div className="h-1 bg-slate-300 rounded-full" />
              <div className="h-1 bg-slate-300 rounded-full" />
              <div className="h-1 bg-slate-300 rounded-full" />
            </div>
            <div className="text-[7px] font-mono text-slate-500 font-bold text-center">
              AM2302
            </div>
          </div>
        )}

        {/* HC-SR04 Dual Ultrasonic Transducers */}
        {isSonar && (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 border-2 border-slate-500 flex items-center justify-center shadow-inner">
              <div className="w-7 h-7 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-[8px] font-bold text-slate-300">
                T
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 border-2 border-slate-500 flex items-center justify-center shadow-inner">
              <div className="w-7 h-7 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-[8px] font-bold text-slate-300">
                R
              </div>
            </div>
          </div>
        )}

        {/* MQ135 Round Mesh Gas Dome */}
        {isMQ && (
          <div className="w-14 h-14 rounded-full bg-gradient-to-b from-amber-600 via-amber-700 to-slate-800 border-2 border-amber-500 p-1 flex items-center justify-center shadow-md">
            <div className="w-10 h-10 rounded-full bg-slate-900 border border-amber-400/40 flex items-center justify-center text-[8px] font-mono font-bold text-amber-300">
              MQ-135
            </div>
          </div>
        )}

        {/* Soil Moisture Conductive Trace Fork */}
        {isSoil && (
          <div className="w-20 h-14 bg-emerald-950 rounded border border-emerald-800 p-1 flex flex-col justify-between">
            <div className="text-[7px] font-mono text-emerald-400 text-center font-bold">
              CAPACITIVE PROBE
            </div>
            <div className="flex justify-around items-end h-8">
              <div className="w-2.5 h-7 bg-amber-500/80 rounded-t" />
              <div className="w-2.5 h-7 bg-amber-500/80 rounded-t" />
            </div>
          </div>
        )}

        {/* BMP280 / BH1750 Metallic MEMS Sensor */}
        {(isLight || isBMP || (!isDHT && !isSonar && !isMQ && !isSoil)) && (
          <div className="w-16 h-12 bg-slate-800 rounded border border-slate-700 p-1 flex flex-col items-center justify-center shadow-inner">
            <div className="w-6 h-5 bg-gradient-to-br from-slate-300 to-slate-400 rounded-xs border border-slate-500 flex items-center justify-center text-[7px] font-mono font-bold text-slate-800">
              MEMS
            </div>
            <span className="text-[7px] font-mono text-slate-400 mt-1">I2C BUS</span>
          </div>
        )}

        {/* Live Simulation Readings Overlay Badge */}
        {isSimActive && (
          <div className="mt-2 w-full text-center">
            {live?.isPowered ? (
              <div className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 font-mono text-[9px] font-semibold">
                {isDHT && `${live.readings?.temperature ?? 24}°C | ${live.readings?.humidity ?? 60}%`}
                {isSonar && `Dist: ${live.readings?.distance ?? 25} cm`}
                {isSoil && `Moist: ${live.readings?.moisture ?? 45}%`}
                {isMQ && `Gas: ${live.readings?.ppm ?? 120} PPM`}
                {isLight && `Light: ${live.readings?.lux ?? 450} lx`}
                {isBMP && `${live.readings?.pressure ?? 1013} hPa`}
              </div>
            ) : (
              <div className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500 font-mono text-[8px]">
                UNPOWERED
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pin Headers Container */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-around gap-2">
        {pins.map((pin) => (
          <PinHandle key={pin.id} pin={pin} selected={selected} />
        ))}
      </div>
    </div>
  );
}
