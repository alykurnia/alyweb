'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  Hammer,
  AlertTriangle,
  Activity,
  ChevronDown,
  ChevronUp,
  Trash2,
  Download,
  Send,
  CheckCircle2,
  AlertCircle,
  Info,
  Radio,
  Cpu,
} from 'lucide-react';
import { useCodeEditorStore, BottomPanelTab } from '@/stores/codeEditorStore';
import { useHardwareStore } from '@/features/hardware/stores/hardwareStore';
import { SUPPORTED_BOARDS } from '@/lib/compiler/types';

export function BottomPanel() {
  const {
    activeBottomTab,
    setActiveBottomTab,
    isBottomPanelCollapsed,
    toggleBottomPanel,
    bottomPanelHeight,
    compilationStatus,
    compilationOutput,
    binarySize,
    diagnostics,
    selectedBoard,
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
    runtimeLogs,
    selectFile,
    files,
  } = useCodeEditorStore();

  const { hardwareModeEnabled, activeDeviceId } = useHardwareStore();
  const [inputTx, setInputTx] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'hardware' | 'simulation'>('all');
  const serialScrollRef = useRef<HTMLDivElement>(null);
  const currentBoard = SUPPORTED_BOARDS[selectedBoard];

  const filteredSerialMessages = serialMessages.filter((msg) => {
    if (sourceFilter === 'all') return true;
    if (sourceFilter === 'hardware') return msg.source === 'hardware';
    if (sourceFilter === 'simulation') return msg.source !== 'hardware';
    return true;
  });

  const hwCount = serialMessages.filter((m) => m.source === 'hardware').length;
  const simCount = serialMessages.filter((m) => m.source !== 'hardware').length;

  // Auto-scroll serial output
  useEffect(() => {
    if (serialAutoScroll && serialScrollRef.current) {
      serialScrollRef.current.scrollTop = serialScrollRef.current.scrollHeight;
    }
  }, [filteredSerialMessages, serialAutoScroll]);

  const handleSendSerial = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (inputTx.trim()) {
      sendSerial(inputTx.trim(), hardwareModeEnabled ? 'hardware' : 'simulation');
      setInputTx('');
    }
  };

  const errorCount = diagnostics.filter((d) => d.severity === 'error').length;
  const warningCount = diagnostics.filter((d) => d.severity === 'warning').length;

  return (
    <div
      style={{ height: isBottomPanelCollapsed ? '34px' : `${bottomPanelHeight}px` }}
      className="bg-slate-900 border-t border-slate-800 flex flex-col transition-all duration-150 select-none text-xs"
    >
      {/* Panel Tab Header */}
      <div className="h-8.5 bg-slate-900/95 border-b border-slate-800/80 px-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* Compilation Tab */}
          <button
            onClick={() => setActiveBottomTab('compilation')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeBottomTab === 'compilation' && !isBottomPanelCollapsed
                ? 'bg-slate-800 text-blue-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Hammer className="w-3.5 h-3.5 text-amber-400" />
            <span>Compilation</span>
            {compilationStatus === 'compiling' && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          {/* Serial Monitor Tab */}
          <button
            onClick={() => setActiveBottomTab('serial')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeBottomTab === 'serial' && !isBottomPanelCollapsed
                ? 'bg-slate-800 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Serial Monitor</span>
            {serialMessages.length > 0 && (
              <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                {serialMessages.length}
              </span>
            )}
          </button>

          {/* Problems Tab */}
          <button
            onClick={() => setActiveBottomTab('problems')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeBottomTab === 'problems' && !isBottomPanelCollapsed
                ? 'bg-slate-800 text-red-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Problems</span>
            {(errorCount > 0 || warningCount > 0) && (
              <span className={`px-1 rounded text-[10px] ${errorCount > 0 ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'}`}>
                {errorCount + warningCount}
              </span>
            )}
          </button>

          {/* Runtime Log Tab */}
          <button
            onClick={() => setActiveBottomTab('runtime')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeBottomTab === 'runtime' && !isBottomPanelCollapsed
                ? 'bg-slate-800 text-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span>Runtime Log</span>
          </button>
        </div>

        {/* Right Tab Controls: Collapse/Expand */}
        <button
          onClick={toggleBottomPanel}
          title={isBottomPanelCollapsed ? 'Expand Panel' : 'Collapse Panel'}
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
        >
          {isBottomPanelCollapsed ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Tab Body */}
      {!isBottomPanelCollapsed && (
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-950 font-mono text-xs">
          {/* TAB 1: COMPILATION */}
          {activeBottomTab === 'compilation' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Binary Memory Usage Bar (if compiled) */}
              {binarySize && (
                <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-4">
                    {/* Flash Bar */}
                    <div>
                      <span className="text-slate-400">Flash: </span>
                      <span className="text-blue-300 font-semibold">
                        {(binarySize.flashUsed / 1024).toFixed(1)} KB / {(binarySize.flashTotal / 1024).toFixed(1)} KB
                      </span>
                      <span className="text-slate-500 ml-1">
                        ({Math.round((binarySize.flashUsed / binarySize.flashTotal) * 100)}%)
                      </span>
                    </div>

                    {/* SRAM Bar */}
                    <div>
                      <span className="text-slate-400">RAM: </span>
                      <span className="text-emerald-300 font-semibold">
                        {(binarySize.ramUsed / 1024).toFixed(1)} KB / {(binarySize.ramTotal / 1024).toFixed(1)} KB
                      </span>
                      <span className="text-slate-500 ml-1">
                        ({Math.round((binarySize.ramUsed / binarySize.ramTotal) * 100)}%)
                      </span>
                    </div>
                  </div>

                  <div className="text-slate-400 text-[10px]">
                    Core: <span className="text-slate-300">{currentBoard.core}</span>
                  </div>
                </div>
              )}

              {/* Log Output Body */}
              <div className="flex-1 p-3 overflow-y-auto text-slate-300 leading-relaxed whitespace-pre-wrap select-text">
                {compilationOutput}
              </div>
            </div>
          )}

          {/* TAB 2: SERIAL MONITOR */}
          {activeBottomTab === 'serial' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Serial Toolbar */}
              <div className="h-8 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-3">
                  {/* Stream Filter */}
                  <div className="flex items-center bg-slate-950 rounded border border-slate-800 p-0.5">
                    <button
                      onClick={() => setSourceFilter('all')}
                      className={`px-1.5 py-0.2 rounded text-[10px] transition-colors ${
                        sourceFilter === 'all' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      All ({serialMessages.length})
                    </button>
                    <button
                      onClick={() => setSourceFilter('hardware')}
                      className={`px-1.5 py-0.2 rounded text-[10px] flex items-center gap-1 transition-colors ${
                        sourceFilter === 'hardware' ? 'bg-purple-900/60 text-purple-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Radio className="w-2.5 h-2.5 text-purple-400" />
                      <span>HW ({hwCount})</span>
                    </button>
                    <button
                      onClick={() => setSourceFilter('simulation')}
                      className={`px-1.5 py-0.2 rounded text-[10px] flex items-center gap-1 transition-colors ${
                        sourceFilter === 'simulation' ? 'bg-blue-900/60 text-blue-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Cpu className="w-2.5 h-2.5 text-blue-400" />
                      <span>Sim ({simCount})</span>
                    </button>
                  </div>

                  {/* Baud Selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Baud:</span>
                    <select
                      value={serialBaudRate}
                      onChange={(e) => setSerialBaudRate(Number(e.target.value))}
                      className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-1.5 py-0.5 text-xs focus:outline-none"
                    >
                      <option value={9600}>9600 baud</option>
                      <option value={19200}>19200 baud</option>
                      <option value={38400}>38400 baud</option>
                      <option value={57600}>57600 baud</option>
                      <option value={115200}>115200 baud</option>
                    </select>
                  </div>

                  {/* Auto-scroll toggle */}
                  <label className="flex items-center gap-1 text-slate-400 cursor-pointer hover:text-slate-200">
                    <input
                      type="checkbox"
                      checked={serialAutoScroll}
                      onChange={(e) => setSerialAutoScroll(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-700 text-blue-500 focus:ring-0"
                    />
                    <span>Autoscroll</span>
                  </label>

                  {/* Timestamp toggle */}
                  <label className="flex items-center gap-1 text-slate-400 cursor-pointer hover:text-slate-200">
                    <input
                      type="checkbox"
                      checked={serialTimestamps}
                      onChange={(e) => setSerialTimestamps(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-700 text-blue-500 focus:ring-0"
                    />
                    <span>Timestamps</span>
                  </label>
                </div>

                {/* Clear & Export Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={clearSerial}
                    title="Clear Terminal Output"
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={exportSerialLog}
                    title="Export Serial Log"
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Serial Messages Stream */}
              <div
                ref={serialScrollRef}
                className="flex-1 p-3 overflow-y-auto space-y-0.5 select-text font-mono text-[11px]"
              >
                {filteredSerialMessages.length === 0 ? (
                  <div className="text-slate-600 italic">
                    {sourceFilter === 'hardware'
                      ? 'No physical hardware serial telemetry yet. Connect an ESP32 device via Local Bridge.'
                      : 'Serial terminal listening on virtual UART port at ' + serialBaudRate + ' baud. Click "Run" to begin streaming.'}
                  </div>
                ) : (
                  filteredSerialMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`leading-relaxed flex items-start flex-wrap gap-x-1 ${
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
                        <span className="px-1 py-0.2 rounded text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 select-none font-mono">
                          [PHYSICAL HW]
                        </span>
                      ) : (
                        <span className="px-1 py-0.2 rounded text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 select-none font-mono">
                          [SIMULATION]
                        </span>
                      )}
                      {msg.type === 'tx' && <span className="text-amber-500 mr-0.5 select-none">&gt;&gt;</span>}
                      <span>{msg.text}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Serial Transmit Form */}
              <form
                onSubmit={handleSendSerial}
                className="h-8.5 px-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
              >
                <input
                  value={inputTx}
                  onChange={(e) => setInputTx(e.target.value)}
                  placeholder={
                    hardwareModeEnabled
                      ? `Send command to physical hardware device (${activeDeviceId || 'ESP32'})...`
                      : "Send text or AT command to virtual UART..."
                  }
                  className="flex-1 bg-slate-950 border border-slate-700/80 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  title="Send (Enter)"
                  className={`flex items-center gap-1 px-3 py-1 text-white rounded text-xs font-medium transition-colors ${
                    hardwareModeEnabled ? 'bg-purple-600 hover:bg-purple-500' : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  <Send className="w-3 h-3" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: PROBLEMS & DIAGNOSTICS */}
          {activeBottomTab === 'problems' && (
            <div className="flex-1 p-3 overflow-y-auto select-text">
              {diagnostics.length === 0 ? (
                <div className="flex items-center gap-2 text-slate-500 italic">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>No syntax, structural, or hardware design rule issues detected.</span>
                </div>
              ) : (
                <div className="space-y-1">
                  {diagnostics.map((diag, idx) => {
                    const targetFile = files.find((f) => f.name === diag.file);
                    return (
                      <div
                        key={idx}
                        onClick={() => targetFile && selectFile(targetFile.id)}
                        className="px-2.5 py-1.5 rounded bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 flex items-start gap-2.5 cursor-pointer transition-colors"
                      >
                        {diag.severity === 'error' ? (
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        ) : diag.severity === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                        )}

                        <div className="flex-1">
                          <div className="text-slate-200">{diag.message}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                            {diag.file} [{diag.line}:{diag.column}] • Source: {diag.source || 'compiler'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RUNTIME LOG */}
          {activeBottomTab === 'runtime' && (
            <div className="flex-1 p-3 overflow-y-auto space-y-0.5 select-text text-slate-400">
              {runtimeLogs.length === 0 ? (
                <div className="text-slate-600 italic">
                  Runtime execution log is idle. Run program to observe execution events.
                </div>
              ) : (
                runtimeLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed font-mono">
                    {log}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
