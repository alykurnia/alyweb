'use client';

import React from 'react';
import { useSimulationStore } from '@/stores/simulationStore';
import { useCircuitStore } from '@/stores/circuitStore';
import {
  Sliders,
  X,
  Gauge,
  Thermometer,
  Droplets,
  Activity,
  Sun,
  Wind,
  Compass,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function InteractiveSensorPanel() {
  const {
    isSensorsPanelOpen,
    toggleSensorsPanel,
    liveSensors,
    setSensorProperty,
    togglePin,
    state: simState,
    engine,
  } = useSimulationStore();

  const { nodes } = useCircuitStore();

  if (!isSensorsPanelOpen) return null;

  // Filter nodes that are sensors
  const sensorNodes = nodes.filter(
    (n) => n.data.componentDefinition?.category === 'sensor'
  );

  // Microcontrollers in circuit
  const mcuNodes = nodes.filter(
    (n) => n.data.componentDefinition?.category === 'microcontroller'
  );

  const mcuPinsMap = engine.getAllMcuPins();

  return (
    <div className="absolute top-12 right-4 bottom-16 w-84 w-[360px] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Interactive Controls</h3>
        </div>
        <button
          onClick={toggleSensorsPanel}
          className="p-1 rounded text-slate-400 hover:text-white transition-colors"
          title="Close Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {simState !== 'running' && (
          <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 flex items-center gap-2">
            <Activity className="w-4 h-4 shrink-0 animate-pulse" />
            <span>Simulation is {simState}. Start the simulation to interact with live hardware signals.</span>
          </div>
        )}

        {/* SECTION 1: ENVIRONMENTAL SENSORS */}
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
              Sensors ({sensorNodes.length})
            </span>
          </div>

          {sensorNodes.length === 0 ? (
            <p className="text-slate-500 italic py-2">
              No sensors on the canvas. Drag sensors (DHT22, Sonar, Soil, MQ135) to interact with live inputs.
            </p>
          ) : (
            <div className="space-y-4">
              {sensorNodes.map((node) => {
                const live = liveSensors[node.id];
                const typeId = node.data.componentTypeId;

                return (
                  <div
                    key={node.id}
                    className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span className="font-semibold text-white text-xs">
                          {node.data.label}
                        </span>
                      </div>
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-mono uppercase',
                          live?.isPowered
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        )}
                      >
                        {live?.isPowered ? 'Powered' : 'Unpowered'}
                      </span>
                    </div>

                    {/* Sensor specific interactive sliders */}
                    {(typeId === 'dht22' || typeId === 'dht11') && (
                      <div className="space-y-3 pt-1">
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Thermometer className="w-3 h-3 text-rose-400" />
                              Temperature:
                            </span>
                            <span className="text-emerald-400 font-mono font-semibold">
                              {Number(live?.readings?.temperature ?? 28).toFixed(1)} °C
                            </span>
                          </div>
                          <input
                            type="range"
                            min={typeId === 'dht22' ? -40 : 0}
                            max={typeId === 'dht22' ? 80 : 50}
                            step="0.5"
                            value={Number(live?.readings?.temperature ?? 28)}
                            onChange={(e) =>
                              setSensorProperty(node.id, 'temperature', parseFloat(e.target.value))
                            }
                            className="w-full accent-blue-500 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Droplets className="w-3 h-3 text-cyan-400" />
                              Humidity:
                            </span>
                            <span className="text-cyan-400 font-mono font-semibold">
                              {Math.round(Number(live?.readings?.humidity ?? 65))} %
                            </span>
                          </div>
                          <input
                            type="range"
                            min={typeId === 'dht22' ? 0 : 20}
                            max={typeId === 'dht22' ? 100 : 90}
                            step="1"
                            value={Number(live?.readings?.humidity ?? 65)}
                            onChange={(e) =>
                              setSensorProperty(node.id, 'humidity', parseFloat(e.target.value))
                            }
                            className="w-full accent-cyan-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    )}

                    {typeId === 'hc-sr04' && (
                      <div className="space-y-2 pt-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Compass className="w-3 h-3 text-amber-400" />
                            Obstacle Distance:
                          </span>
                          <span className="text-amber-400 font-mono font-semibold">
                            {Number(live?.readings?.distance ?? 25).toFixed(1)} cm
                          </span>
                        </div>
                        <input
                          type="range"
                          min="2"
                          max="400"
                          step="1"
                          value={Number(live?.readings?.distance ?? 25)}
                          onChange={(e) =>
                            setSensorProperty(node.id, 'distance', parseFloat(e.target.value))
                          }
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                        <div className="text-[10px] text-slate-500">
                          Echo duration: {live?.readings?.echoUs ?? 0} µs
                        </div>
                      </div>
                    )}

                    {typeId === 'soil-moisture' && (
                      <div className="space-y-2 pt-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Droplets className="w-3 h-3 text-blue-400" />
                            Moisture Level:
                          </span>
                          <span className="text-blue-400 font-mono font-semibold">
                            {Math.round(Number(live?.readings?.moisture ?? 45))} %
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={Number(live?.readings?.moisture ?? 45)}
                          onChange={(e) =>
                            setSensorProperty(node.id, 'moisture', parseFloat(e.target.value))
                          }
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                        <div className="text-[10px] text-slate-500">
                          Analog Out: {live?.readings?.voltage ?? 0}V
                        </div>
                      </div>
                    )}

                    {typeId === 'mq135' && (
                      <div className="space-y-2 pt-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Wind className="w-3 h-3 text-purple-400" />
                            Gas Level:
                          </span>
                          <span className="text-purple-400 font-mono font-semibold">
                            {live?.readings?.ppm ?? 120} PPM ({String(live?.readings?.airQuality || 'OK')})
                          </span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="1000"
                          step="10"
                          value={Number(live?.readings?.ppm ?? 120)}
                          onChange={(e) =>
                            setSensorProperty(node.id, 'ppm', parseFloat(e.target.value))
                          }
                          className="w-full accent-purple-500 cursor-pointer"
                        />
                      </div>
                    )}

                    {typeId === 'bh1750' && (
                      <div className="space-y-2 pt-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Sun className="w-3 h-3 text-yellow-400" />
                            Light Illuminance:
                          </span>
                          <span className="text-yellow-400 font-mono font-semibold">
                            {live?.readings?.lux ?? 450} lx
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="20000"
                          step="100"
                          value={Number(live?.readings?.lux ?? 450)}
                          onChange={(e) =>
                            setSensorProperty(node.id, 'lux', parseFloat(e.target.value))
                          }
                          className="w-full accent-yellow-500 cursor-pointer"
                        />
                      </div>
                    )}

                    {typeId === 'bmp280' && (
                      <div className="space-y-2 pt-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Gauge className="w-3 h-3 text-emerald-400" />
                            Atmospheric Pressure:
                          </span>
                          <span className="text-emerald-400 font-mono font-semibold">
                            {Number(live?.readings?.pressure ?? 1013.25).toFixed(1)} hPa
                          </span>
                        </div>
                        <input
                          type="range"
                          min="300"
                          max="1100"
                          step="1"
                          value={Number(live?.readings?.pressure ?? 1013.25)}
                          onChange={(e) =>
                            setSensorProperty(node.id, 'pressure', parseFloat(e.target.value))
                          }
                          className="w-full accent-emerald-500 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 2: MANUAL GPIO OUTPUT CONTROLS */}
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
              Manual GPIO Controls
            </span>
          </div>

          {mcuNodes.length === 0 ? (
            <p className="text-slate-500 italic py-2">
              No microcontroller placed on the canvas.
            </p>
          ) : (
            <div className="space-y-3">
              {mcuNodes.map((mcu) => {
                const pins = mcuPinsMap[mcu.id] || [];
                // Filter pins that are connected or output capable
                const activePins = pins.filter(
                  (p) =>
                    p.connectedTo ||
                    p.mode === 'OUTPUT' ||
                    p.mode === 'PWM_OUTPUT' ||
                    p.pinName === 'D2' ||
                    p.pinName === 'D4' ||
                    p.pinName === 'D13'
                );

                return (
                  <div
                    key={mcu.id}
                    className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-2.5"
                  >
                    <div className="flex items-center justify-between font-medium text-white">
                      <span>{mcu.data.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {pins.length} Pins
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {activePins.slice(0, 8).map((pin) => (
                        <div
                          key={pin.pinId}
                          className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800/60"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'w-2 h-2 rounded-full',
                                pin.digitalValue === 'HIGH'
                                  ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                                  : 'bg-slate-600'
                              )}
                            />
                            <div>
                              <div className="font-mono font-semibold text-slate-200">
                                {pin.pinName}
                              </div>
                              {pin.connectedTo && (
                                <div className="text-[9px] text-blue-400 truncate max-w-[140px]">
                                  → {pin.connectedTo.componentName}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-slate-400">
                              {pin.voltage.toFixed(1)}V
                            </span>

                            <button
                              onClick={() => togglePin(mcu.id, pin.pinId)}
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-bold tracking-wider font-mono transition-colors',
                                pin.digitalValue === 'HIGH'
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              )}
                            >
                              {pin.digitalValue}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
