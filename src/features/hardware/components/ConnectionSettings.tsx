'use client';

import React, { useState } from 'react';
import {
  Settings,
  Radio,
  CheckCircle2,
  AlertCircle,
  Key,
  RefreshCw,
  Server,
  ShieldCheck,
} from 'lucide-react';
import { useHardwareStore } from '../stores/hardwareStore';

export function ConnectionSettings() {
  const {
    bridgeUrl,
    setBridgeUrl,
    bridgeStatus,
    bridgeError,
    connectBridge,
    disconnectBridge,
  } = useHardwareStore();

  const [inputUrl, setInputUrl] = useState(bridgeUrl);
  const [saveFeedback, setSaveFeedback] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      setBridgeUrl(inputUrl.trim());
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2000);
    }
  };

  const isConnected = bridgeStatus === 'connected';

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" />
          Local Hardware Bridge Configuration
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure connection parameters between the browser and the local bridge agent running on your computer.
        </p>
      </div>

      {/* Connection Status Card */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Bridge Connection Status</span>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse'
                  : bridgeStatus === 'connecting'
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-rose-500'
              }`}
            />
            <span
              className={`text-xs font-bold uppercase font-mono ${
                isConnected ? 'text-emerald-400' : bridgeStatus === 'connecting' ? 'text-amber-400' : 'text-rose-400'
              }`}
            >
              {bridgeStatus}
            </span>
          </div>
        </div>

        {bridgeError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{bridgeError}</span>
          </div>
        )}

        {/* URL Form */}
        <form onSubmit={handleSave} className="space-y-3 pt-2">
          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1">
              Local Bridge WebSocket URL
            </label>
            <input
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="ws://127.0.0.1:8765/ws/client"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Default: <code className="text-blue-400">ws://127.0.0.1:8765/ws/client</code>
            </p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Update Bridge URL
            </button>

            {isConnected ? (
              <button
                type="button"
                onClick={() => disconnectBridge()}
                className="px-3.5 py-2 bg-slate-800 hover:bg-rose-600/80 text-slate-300 hover:text-white rounded-lg text-xs transition-colors"
              >
                Disconnect Bridge
              </button>
            ) : (
              <button
                type="button"
                onClick={() => connectBridge()}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Connect Bridge
              </button>
            )}

            {saveFeedback && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Saved & Reconnecting!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Security Details Card */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3 text-xs">
        <h3 className="font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Security Architecture & Handshake Rules
        </h3>
        <ul className="list-disc list-inside space-y-1.5 text-slate-400 text-[11px] leading-relaxed">
          <li>Local-only bridge binding on <code>127.0.0.1</code> protects against remote internet probing.</li>
          <li>ESP32 hardware connects to bridge via <code>ws://&lt;LOCAL_IP&gt;:8765/ws/device</code>.</li>
          <li>Each device requires a cryptographic pairing token in the initial <code>hello</code> handshake.</li>
          <li>Stale commands older than 5,000ms are discarded automatically to prevent delayed actuation.</li>
        </ul>
      </div>
    </div>
  );
}
