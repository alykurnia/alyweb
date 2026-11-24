'use client';

import React from 'react';
import {
  Activity,
  Thermometer,
  Droplets,
  Ruler,
  Sun,
  Gauge,
  Wind,
  Wifi,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { useHardwareStore } from '../stores/hardwareStore';

export function HardwareMonitor() {
  const { registeredDevices, activeDeviceId, clearTelemetry } = useHardwareStore();

  const activeDevice = registeredDevices.find((d) => d.deviceId === activeDeviceId) || registeredDevices[0];
  const isOnline = activeDevice && activeDevice.status === 'connected';
  const tel = activeDevice?.currentTelemetry;
  const history = activeDevice?.telemetryHistory || [];

  // Helper to generate mini SVG sparkline
  const renderSparkline = (key: string, strokeColor: string) => {
    const points = history
      .map((h) => Number(h[key]))
      .filter((v) => !isNaN(v));

    if (points.length < 2) {
      return (
        <div className="h-9 flex items-center justify-center text-[10px] text-slate-600 italic">
          Waiting for telemetry history...
        </div>
      );
    }

    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 160;
    const height = 36;

    const pathData = points
      .map((pt, idx) => {
        const x = (idx / (points.length - 1)) * width;
        const y = height - ((pt - min) / range) * (height - 8) - 4;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <svg className="w-full h-9 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <path d={pathData} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  };

  if (!activeDevice || !isOnline) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center space-y-4 max-w-xl mx-auto my-8">
        <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center mx-auto text-slate-500">
          <Cpu className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">No Physical Hardware Telemetry Stream</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            There is currently no physical ESP32 streaming live telemetry.
            To view real hardware readings, connect your ESP32 board to the Local Bridge Agent.
          </p>
        </div>

        <div className="p-4 bg-slate-950 rounded-lg text-left text-xs font-mono text-slate-300 space-y-2 border border-slate-800/80">
          <div className="text-blue-400 font-semibold">// How to connect your physical device:</div>
          <div>1. Run Local Bridge: <code className="text-emerald-400">cd bridge && npm start</code></div>
          <div>2. Program ESP32 with firmware from <code className="text-amber-400">firmware/esp32-devkit-v1</code></div>
          <div>3. Ensure Wi-Fi credentials in <code className="text-slate-400">src/config.h</code> match your local network</div>
          <div>4. Set pairing token: <code className="text-purple-400">iotlab-secret-token-2026</code></div>
        </div>
      </div>
    );
  }

  // Detect which sensors are reporting real data
  const hasTemp = tel?.temperature !== undefined;
  const hasHum = tel?.humidity !== undefined;
  const hasSoil = tel?.soil_moisture !== undefined;
  const hasDistance = tel?.distance !== undefined;
  const hasLight = tel?.light_lux !== undefined;
  const hasPressure = tel?.pressure !== undefined;
  const hasGas = tel?.gas_ppm !== undefined;

  const hasAnySensor = hasTemp || hasHum || hasSoil || hasDistance || hasLight || hasPressure || hasGas;

  return (
    <div className="space-y-6">
      {/* Device Telemetry Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
            <h2 className="text-base font-bold text-white">{activeDevice.name}</h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              LIVE HARDWARE TELEMETRY
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Device ID: <span className="font-mono text-slate-300">{activeDevice.deviceId}</span> • IP: <span className="font-mono text-blue-400">{activeDevice.ipAddress || '192.168.1.x'}</span> • Firmware: <span className="font-mono text-slate-300">v{activeDevice.firmwareVersion}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>RSSI: {activeDevice.rssi || -65} dBm</span>
          </div>

          <button
            onClick={() => clearTelemetry(activeDevice.deviceId)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Sensor Widgets Grid */}
      {!hasAnySensor ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
          Physical device is connected, but no sensors are reporting data yet.
          Ensure sensor feature flags (<code className="text-amber-400">#define ENABLE_DHT22 1</code>, etc.) are enabled in the ESP32 firmware.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Temperature (DHT22 / DS18B20) */}
          {hasTemp && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="font-medium flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-rose-400" />
                    Ambient Temperature
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">ACTIVE</span>
                </div>
                <div className="text-2xl font-bold text-white mt-2 font-mono">
                  {tel?.temperature} <span className="text-sm font-normal text-slate-400">°C</span>
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-800/80">
                {renderSparkline('temperature', '#f43f5e')}
              </div>
            </div>
          )}

          {/* Humidity (DHT22) */}
          {hasHum && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="font-medium flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-blue-400" />
                    Relative Humidity
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">ACTIVE</span>
                </div>
                <div className="text-2xl font-bold text-white mt-2 font-mono">
                  {tel?.humidity} <span className="text-sm font-normal text-slate-400">% RH</span>
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-800/80">
                {renderSparkline('humidity', '#3b82f6')}
              </div>
            </div>
          )}

          {/* Soil Moisture */}
          {hasSoil && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="font-medium flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Soil Moisture Level
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">ACTIVE</span>
                </div>
                <div className="text-2xl font-bold text-white mt-2 font-mono">
                  {tel?.soil_moisture} <span className="text-sm font-normal text-slate-400">%</span>
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-800/80">
                {renderSparkline('soil_moisture', '#10b981')}
              </div>
            </div>
          )}

          {/* Distance (HC-SR04) */}
          {hasDistance && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="font-medium flex items-center gap-1.5">
                    <Ruler className="w-4 h-4 text-purple-400" />
                    Ultrasonic Distance
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">ACTIVE</span>
                </div>
                <div className="text-2xl font-bold text-white mt-2 font-mono">
                  {tel?.distance} <span className="text-sm font-normal text-slate-400">cm</span>
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-800/80">
                {renderSparkline('distance', '#a855f7')}
              </div>
            </div>
          )}

          {/* Ambient Light (BH1750) */}
          {hasLight && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="font-medium flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-amber-400" />
                    Ambient Light
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">ACTIVE</span>
                </div>
                <div className="text-2xl font-bold text-white mt-2 font-mono">
                  {tel?.light_lux} <span className="text-sm font-normal text-slate-400">lx</span>
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-800/80">
                {renderSparkline('light_lux', '#f59e0b')}
              </div>
            </div>
          )}

          {/* Barometric Pressure (BMP280) */}
          {hasPressure && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="font-medium flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-cyan-400" />
                    Atmospheric Pressure
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">ACTIVE</span>
                </div>
                <div className="text-2xl font-bold text-white mt-2 font-mono">
                  {tel?.pressure} <span className="text-sm font-normal text-slate-400">hPa</span>
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-800/80">
                {renderSparkline('pressure', '#06b6d4')}
              </div>
            </div>
          )}

          {/* Gas Concentration (MQ135) */}
          {hasGas && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="font-medium flex items-center gap-1.5">
                    <Wind className="w-4 h-4 text-orange-400" />
                    Air Gas Concentration
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">ACTIVE</span>
                </div>
                <div className="text-2xl font-bold text-white mt-2 font-mono">
                  {tel?.gas_ppm} <span className="text-sm font-normal text-slate-400">PPM</span>
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-800/80">
                {renderSparkline('gas_ppm', '#f97316')}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
