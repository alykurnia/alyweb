'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Terminal,
  Trash2,
  Download,
  Send,
  Workflow,
  Code2,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Activity,
  Cpu,
  Radio,
  Filter,
} from 'lucide-react';
import { useCodeEditorStore } from '@/stores/codeEditorStore';
import { useSimulationStore } from '@/stores/simulationStore';
import { useHardwareStore } from '@/features/hardware/stores/hardwareStore';
import { SUPPORTED_BOARDS } from '@/lib/compiler/types';

export default function SerialMonitorPage() {
  const {
    serialMessages,
    serialBaudRate,
    setSerialBaudRate,
    serialAutoScroll,
    setSerialAutoScroll,
    serialTimestamps,
    setSerialTimestamps,
    clearSerial,
    sendSerial,
    exportSerialLog,
    selectedBoard,
    runtimeStatus,
  } = useCodeEditorStore();

  const {
    hardwareModeEnabled,
    registeredDevices,
    activeDeviceId,
    bridgeStatus,
  } = useHardwareStore();

  const activeDevice = registeredDevices.find((d) => d.deviceId === activeDeviceId);

  const { state: simState } = useSimulationStore();
  const [inputTx, setInputTx] = useState('');
  const [lineEnding, setLineEnding] = useState<'none' | 'nl' | 'cr' | 'both'>('nl');
  const [viewMode, setViewMode] = useState<'ascii' | 'hex'>('ascii');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'hardware' | 'simulation'>('all');
  const terminalRef = useRef<HTMLDivElement>(null);

  const currentBoard = SUPPORTED_BOARDS[selectedBoard];

  const filteredMessages = serialMessages.filter((msg) => {
    if (sourceFilter === 'all') return true;
    if (sourceFilter === 'hardware') return msg.source === 'hardware';
    if (sourceFilter === 'simulation') return msg.source !== 'hardware';
    return true;
  });

  const hwCount = serialMessages.filter((m) => m.source === 'hardware').length;
  const simCount = serialMessages.filter((m) => m.source !== 'hardware').length;

  useEffect(() => {
    if (serialAutoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [filteredMessages, serialAutoScroll]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputTx.trim()) return;

    let textToSend = inputTx;
    if (lineEnding === 'nl') textToSend += '\n';
    else if (lineEnding === 'cr') textToSend += '\r';
    else if (lineEnding === 'both') textToSend += '\r\n';

    sendSerial(textToSend, hardwareModeEnabled ? 'hardware' : 'simulation');
    setInputTx('');
  };

  const handleQuickCommand = (cmd: string) => {
    sendSerial(`${cmd}\n`, hardwareModeEnabled ? 'hardware' : 'simulation');
  };

  const toHexDump = (str: string) => {
    return Array.from(str)
      .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase())
      .join(' ');
  };

  return (
    <div className="flex-1 h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Header */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Terminal className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white">UART Serial Telemetry Monitor</h1>
              {hardwareModeEnabled ? (
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  PHYSICAL HW ({activeDevice?.name || 'ESP32'})
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                  COM-VIRTUAL / UART0
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Target: {hardwareModeEnabled ? (activeDevice?.name || 'ESP32 Physical Board') : `${currentBoard.name} (${currentBoard.architecture})`}
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex items-center gap-2">
          <Link
            href="/hardware"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-medium transition-colors"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Hardware Center</span>
          </Link>
          <Link
            href="/code-editor"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
          >
            <Code2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Code Editor</span>
          </Link>
          <Link
            href="/circuit-builder"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-medium transition-colors"
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>Circuit Canvas</span>
          </Link>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="h-11 bg-slate-900/70 border-b border-slate-800/80 px-6 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          {/* Stream Source Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
            <button
              onClick={() => setSourceFilter('all')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                sourceFilter === 'all' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Streams ({serialMessages.length})
            </button>
            <button
              onClick={() => setSourceFilter('hardware')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                sourceFilter === 'hardware' ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3 h-3 text-purple-400" />
              <span>Physical HW ({hwCount})</span>
            </button>
            <button
              onClick={() => setSourceFilter('simulation')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                sourceFilter === 'simulation' ? 'bg-blue-900/60 text-blue-300 border border-blue-700/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3 h-3 text-blue-400" />
              <span>Simulation ({simCount})</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Baud Rate */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Baud Rate:</span>
            <select
              value={serialBaudRate}
              onChange={(e) => setSerialBaudRate(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs focus:outline-none"
            >
              <option value={9600}>9600 baud</option>
              <option value={19200}>19200 baud</option>
              <option value={38400}>38400 baud</option>
              <option value={57600}>57600 baud</option>
              <option value={115200}>115200 baud</option>
            </select>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Autoscroll */}
          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={serialAutoScroll}
              onChange={(e) => setSerialAutoScroll(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0"
            />
            <span>Autoscroll</span>
          </label>

          {/* Timestamps */}
          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={serialTimestamps}
              onChange={(e) => setSerialTimestamps(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0"
            />
            <span>Show Timestamps</span>
          </label>

          <div className="h-4 w-px bg-slate-800" />

          {/* View Mode */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
            <button
              onClick={() => setViewMode('ascii')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                viewMode === 'ascii' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ASCII
            </button>
            <button
              onClick={() => setViewMode('hex')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                viewMode === 'hex' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              HEX
            </button>
          </div>
        </div>

        {/* Clear & Export */}
        <div className="flex items-center gap-2">
          <button
            onClick={clearSerial}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
          <button
            onClick={exportSerialLog}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Log</span>
          </button>
        </div>
      </div>

      {/* Terminal Output Display */}
      <div
        ref={terminalRef}
        className="flex-1 p-6 overflow-y-auto font-mono text-xs select-text space-y-1 bg-slate-950"
      >
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <Activity className="w-10 h-10 text-slate-700 mb-3 animate-pulse" />
            <div className="text-sm font-medium text-slate-400">
              {sourceFilter === 'hardware'
                ? 'No Physical Hardware Serial Messages'
                : sourceFilter === 'simulation'
                ? 'No Simulation Serial Messages'
                : 'Serial Terminal Stream Idle'}
            </div>
            <div className="text-xs text-slate-600 mt-1 max-w-sm text-center">
              {sourceFilter === 'hardware'
                ? 'Connect your physical ESP32 via Local Bridge (ws://127.0.0.1:8765) to stream live hardware telemetry and logs.'
                : 'Write code in the Code Editor and click "Run" to begin streaming simulation telemetry.'}
            </div>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className={`leading-relaxed flex items-start flex-wrap gap-x-1.5 ${
                msg.type === 'error'
                  ? 'text-red-400 font-semibold'
                  : msg.type === 'info'
                  ? 'text-sky-400'
                  : msg.type === 'tx'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {serialTimestamps && (
                <span className="text-slate-600 select-none">
                  [{new Date(msg.timestamp).toLocaleTimeString()}]
                </span>
              )}
              {msg.source === 'hardware' ? (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 select-none font-mono">
                  [PHYSICAL HW]
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 select-none font-mono">
                  [SIMULATION]
                </span>
              )}
              {msg.type === 'tx' && <span className="text-amber-500 mr-1 select-none">&gt;&gt;</span>}
              <span>{viewMode === 'hex' ? toHexDump(msg.text) : msg.text}</span>
            </div>
          ))
        )}
      </div>

      {/* Bottom Command Transmission Bar */}
      <div className="bg-slate-900 border-t border-slate-800 p-4 space-y-3">
        {/* Quick AT Macro Buttons */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px]">Quick Macros:</span>
          {['AT', 'AT+GMR', 'STATUS', 'RESET', 'HELP'].map((cmd) => (
            <button
              key={cmd}
              onClick={() => handleQuickCommand(cmd)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700/80 transition-colors"
            >
              {cmd}
            </button>
          ))}
          {hardwareModeEnabled && (
            <span className="text-[10px] text-purple-400/80 italic ml-2">
              (Transmitting to active physical device: {activeDevice?.deviceId || 'ESP32'})
            </span>
          )}
        </div>

        {/* Transmit Form */}
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input
            value={inputTx}
            onChange={(e) => setInputTx(e.target.value)}
            placeholder={
              hardwareModeEnabled
                ? `Send serial command to physical ${activeDevice?.name || 'ESP32'}...`
                : "Type serial data, command, or string to transmit to virtual MCU..."
            }
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
          />

          {/* Line Ending Selector */}
          <select
            value={lineEnding}
            onChange={(e) => setLineEnding(e.target.value as any)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none"
          >
            <option value="none">No line ending</option>
            <option value="nl">Newline (\n)</option>
            <option value="cr">Carriage return (\r)</option>
            <option value="both">Both NL & CR</option>
          </select>

          <button
            type="submit"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors text-white ${
              hardwareModeEnabled ? 'bg-purple-600 hover:bg-purple-500' : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Transmit</span>
          </button>
        </form>
      </div>
    </div>
  );
}
