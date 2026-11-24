'use client';

import React from 'react';
import Link from 'next/link';
import {
  Play,
  Square,
  RotateCcw,
  Hammer,
  Save,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
  ChevronDown,
  Workflow,
  Sparkles,
} from 'lucide-react';
import { useCodeEditorStore } from '@/stores/codeEditorStore';
import { SUPPORTED_BOARDS } from '@/lib/compiler/types';

export function EditorToolbar() {
  const {
    selectedBoard,
    setBoard,
    compilationStatus,
    runCompile,
    runtimeStatus,
    runProgram,
    stopProgram,
    resetProgram,
    saveAllFiles,
    unsavedFileIds,
  } = useCodeEditorStore();

  const currentBoard = SUPPORTED_BOARDS[selectedBoard];
  const isCompiling = compilationStatus === 'compiling';
  const isRunning = runtimeStatus === 'running';

  return (
    <div className="h-13 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between gap-3 select-none">
      {/* Left: Board Selector & Build Action */}
      <div className="flex items-center gap-2">
        {/* Target Board Selector */}
        <div className="relative group">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 hover:border-slate-600 transition-colors cursor-pointer">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span>{currentBoard.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
              {currentBoard.clockSpeed}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Board Dropdown */}
          <div className="absolute left-0 top-full mt-1 w-64 bg-slate-900 border border-slate-700/80 rounded-lg shadow-xl py-1.5 hidden group-hover:block z-50">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Select Target Board
            </div>
            {Object.values(SUPPORTED_BOARDS).map((b) => (
              <button
                key={b.id}
                onClick={() => setBoard(b.id)}
                className={`w-full px-3 py-2 text-left flex items-start justify-between hover:bg-slate-800 transition-colors ${
                  selectedBoard === b.id ? 'bg-blue-600/15 border-l-2 border-blue-500' : ''
                }`}
              >
                <div>
                  <div className="text-xs font-medium text-slate-200">{b.name}</div>
                  <div className="text-[10px] text-slate-400">{b.tagline}</div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {b.voltage}V
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="h-5 w-px bg-slate-800 mx-1" />

        {/* Build / Compile Button */}
        <button
          onClick={() => runCompile()}
          disabled={isCompiling}
          title="Verify C++ Syntax and Hardware Toolchain"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 hover:text-white rounded-lg border border-slate-700 text-xs font-medium transition-colors"
        >
          <Hammer className={`w-3.5 h-3.5 text-amber-400 ${isCompiling ? 'animate-spin' : ''}`} />
          <span>{isCompiling ? 'Building...' : 'Build'}</span>
        </button>

        {/* Run / Stop / Reset Buttons */}
        {isRunning ? (
          <button
            onClick={() => stopProgram()}
            title="Stop Running Arduino Program"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/90 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop</span>
          </button>
        ) : (
          <button
            onClick={() => runProgram()}
            disabled={isCompiling}
            title="Run Arduino Sketch in Simulation Engine"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run</span>
          </button>
        )}

        <button
          onClick={() => resetProgram()}
          title="Reset Simulation and MCU State"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Save All */}
        <button
          onClick={() => saveAllFiles()}
          title="Save All Files (Ctrl+S)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg text-xs transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save</span>
          {unsavedFileIds.length > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* Right: Status Pill & Quick Nav to Circuit Builder */}
      <div className="flex items-center gap-3">
        {/* Compilation / Runtime Status Pill */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-950/70 border border-slate-800 text-[11px] font-mono">
          <span className="text-slate-400">Runtime:</span>
          {isRunning ? (
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              RUNNING
            </span>
          ) : runtimeStatus === 'paused' ? (
            <span className="text-amber-400">PAUSED</span>
          ) : runtimeStatus === 'error' ? (
            <span className="flex items-center gap-1 text-red-400">
              <AlertCircle className="w-3 h-3" />
              ERROR
            </span>
          ) : (
            <span className="text-slate-500">IDLE</span>
          )}

          <span className="text-slate-700">|</span>

          <span className="text-slate-400">Build:</span>
          {compilationStatus === 'compiled' ? (
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              READY
            </span>
          ) : compilationStatus === 'compiling' ? (
            <span className="text-amber-400 animate-pulse">CHECKING...</span>
          ) : compilationStatus === 'backend_unavailable' ? (
            <span className="text-sky-400">SIM READY</span>
          ) : compilationStatus === 'error' ? (
            <span className="text-red-400">FAILED</span>
          ) : (
            <span className="text-slate-500">IDLE</span>
          )}
        </div>

        {/* Link to Circuit Builder */}
        <Link
          href="/circuit-builder"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-400 hover:text-blue-300 rounded-lg text-xs font-medium transition-all"
        >
          <Workflow className="w-3.5 h-3.5" />
          <span>Circuit Canvas</span>
        </Link>
      </div>
    </div>
  );
}
