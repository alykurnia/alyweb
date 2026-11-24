'use client';

import React, { useState } from 'react';
import {
  Cpu,
  Wifi,
  WifiOff,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Radio,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useHardwareStore } from '../stores/hardwareStore';

export function DeviceManager() {
  const {
    registeredDevices,
    activeDeviceId,
    setActiveDeviceId,
    pairDevice,
    removeDevice,
    renameDevice,
    isPairModalOpen,
    setPairModalOpen,
    connectBridge,
    bridgeStatus,
  } = useHardwareStore();

  const [newId, setNewId] = useState('');
  const [newToken, setNewToken] = useState('iotlab-secret-token-2026');
  const [newName, setNewName] = useState('');
  const [newBoard, setNewBoard] = useState('esp32-devkit');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');

  const handlePairSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId.trim() || !newToken.trim()) return;

    pairDevice(newId.trim(), newToken.trim(), newName.trim() || undefined, newBoard);
    setNewId('');
    setNewName('');
  };

  const handleStartRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditNameValue(currentName);
  };

  const handleConfirmRename = (id: string) => {
    if (editNameValue.trim()) {
      renameDevice(id, editNameValue.trim());
      setEditingId(null);
    }
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '0s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            Physical Device Registry & Pairing
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage physical ESP32 and IoT microcontrollers connected through the Local Hardware Bridge.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => connectBridge()}
            title="Reconnect to Local Bridge"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Sync Bridge</span>
          </button>

          <button
            onClick={() => setPairModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Pair New Device</span>
          </button>
        </div>
      </div>

      {/* Device Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {registeredDevices.map((device) => {
          const isSelected = activeDeviceId === device.deviceId;
          const isOnline = device.status === 'connected';

          return (
            <div
              key={device.deviceId}
              onClick={() => setActiveDeviceId(device.deviceId)}
              className={`bg-slate-900 border rounded-xl p-5 transition-all cursor-pointer relative ${
                isSelected
                  ? 'border-blue-500/80 shadow-[0_0_15px_rgba(59,130,246,0.15)] bg-slate-900/90'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Top row: Status & Actions */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isOnline
                        ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse'
                        : 'bg-slate-600'
                    }`}
                  />
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                      isOnline
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isOnline ? 'Online' : 'Disconnected'}
                  </span>
                </div>

                {/* Edit / Delete actions */}
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleStartRename(device.deviceId, device.name)}
                    className="p-1 text-slate-500 hover:text-slate-300 rounded"
                    title="Rename"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {registeredDevices.length > 1 && (
                    <button
                      onClick={() => removeDevice(device.deviceId)}
                      className="p-1 text-slate-500 hover:text-red-400 rounded"
                      title="Remove Device"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Device Title */}
              <div className="mt-3">
                {editingId === device.deviceId ? (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      autoFocus
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleConfirmRename(device.deviceId);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="bg-slate-950 px-2 py-1 text-xs border border-blue-500 rounded text-white focus:outline-none w-full"
                    />
                    <button
                      onClick={() => handleConfirmRename(device.deviceId)}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <h3 className="font-bold text-sm text-white truncate">{device.name}</h3>
                )}
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  ID: <span className="text-slate-300">{device.deviceId}</span>
                </div>
              </div>

              {/* Specs and Connection Info */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Board Type</span>
                  <span className="font-medium text-slate-200">{device.boardType}</span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>Firmware</span>
                  <span className="font-mono text-slate-200">v{device.firmwareVersion}</span>
                </div>

                {device.ipAddress && (
                  <div className="flex items-center justify-between text-slate-400">
                    <span>IP Address</span>
                    <span className="font-mono text-blue-400">{device.ipAddress}</span>
                  </div>
                )}

                {device.rssi !== undefined && (
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Wi-Fi Signal</span>
                    <span className="flex items-center gap-1 font-mono text-emerald-400">
                      <Wifi className="w-3 h-3" />
                      {device.rssi} dBm
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-400">
                  <span>Uptime</span>
                  <span className="flex items-center gap-1 font-mono text-slate-300">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {formatUptime(device.uptimeSeconds)}
                  </span>
                </div>
              </div>

              {/* Capabilities Badges */}
              <div className="mt-4 flex flex-wrap gap-1">
                {(device.capabilities || []).map((cap) => (
                  <span
                    key={cap}
                    className="text-[9px] uppercase font-mono px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700/60"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pairing Modal */}
      {isPairModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Pair Physical IoT Device
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter the Device ID and secret pairing token programmed inside your ESP32 firmware (<code className="text-blue-400">src/config.h</code>).
              </p>
            </div>

            <form onSubmit={handlePairSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Device Identifier</label>
                <input
                  required
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder="e.g. esp32-lab-001"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Friendly Name</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. ESP32 DevKit Hydroponics"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Pairing Secret Token</label>
                <input
                  required
                  value={newToken}
                  onChange={(e) => setNewToken(e.target.value)}
                  placeholder="Secret token matching firmware config"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Target Board Architecture</label>
                <select
                  value={newBoard}
                  onChange={(e) => setNewBoard(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
                >
                  <option value="esp32-devkit">ESP32 DevKit V1 (Xtensa Dual-Core)</option>
                  <option value="esp8266-nodemcu">ESP8266 NodeMCU</option>
                  <option value="arduino-uno">Arduino Uno R3</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPairModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Register & Pair
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
