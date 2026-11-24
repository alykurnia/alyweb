'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSimulationStore } from '@/stores/simulationStore';
import { LogLevel } from '@/simulation/types/simulation';
import {
  Terminal,
  Trash2,
  Download,
  X,
  Search,
  ArrowDown,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function SimulationConsole() {
  const {
    isConsoleOpen,
    toggleConsole,
    logs,
    logFilter,
    setLogFilter,
    logSearchTerm,
    setLogSearchTerm,
    clearLogs,
    exportLogs,
  } = useSimulationStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  if (!isConsoleOpen) return null;

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = logFilter === 'ALL' || log.level === logFilter;
    const matchesSearch =
      !logSearchTerm ||
      log.message.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
      (log.componentId && log.componentId.toLowerCase().includes(logSearchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const filterButtons: (LogLevel | 'ALL')[] = [
    'ALL',
    'INFO',
    'GPIO',
    'SENSOR',
    'ACTUATOR',
    'WARNING',
    'ERROR',
  ];

  const getLevelBadgeClass = (level: LogLevel) => {
    switch (level) {
      case 'ERROR':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      case 'WARNING':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'GPIO':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
      case 'SENSOR':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-800';
      case 'ACTUATOR':
        return 'bg-purple-950/80 text-purple-300 border-purple-800';
      case 'INFO':
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div
      className={cn(
        'absolute bottom-0 left-0 right-0 z-30 bg-slate-950 border-t border-slate-800 shadow-2xl flex flex-col font-mono transition-all duration-200',
        isExpanded ? 'h-96' : 'h-64'
      )}
    >
      {/* Console Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200 tracking-wide">
            SIMULATION CONSOLE
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-sans">
            {filteredLogs.length} events
          </span>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1">
          {filterButtons.map((f) => (
            <button
              key={f}
              onClick={() => setLogFilter(f)}
              className={cn(
                'px-2 py-0.5 rounded text-[10px] transition-colors',
                logFilter === f
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Search, Actions & Controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-2 text-slate-500" />
            <input
              type="text"
              placeholder="Filter logs..."
              value={logSearchTerm}
              onChange={(e) => setLogSearchTerm(e.target.value)}
              className="w-36 pl-7 pr-2 py-0.5 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={cn(
              'p-1 rounded text-slate-400 hover:text-white transition-colors',
              autoScroll && 'text-emerald-400'
            )}
            title={autoScroll ? 'Auto-scroll Enabled' : 'Auto-scroll Paused'}
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={clearLogs}
            className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
            title="Clear Console Output"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={exportLogs}
            className="p-1 rounded text-slate-400 hover:text-blue-400 transition-colors"
            title="Export Logs (.log file)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
            title={isExpanded ? 'Restore Height' : 'Maximize Console'}
          >
            {isExpanded ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={toggleConsole}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
            title="Close Console"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Log Output Stream */}
      <div
        ref={logContainerRef}
        className="flex-1 overflow-y-auto p-2 space-y-1 text-xs select-text"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600 text-xs italic font-sans">
            No simulation log events recorded yet. Click Run to begin.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2.5 py-0.5 px-1 hover:bg-slate-900/60 rounded"
            >
              {/* Time */}
              <span className="text-slate-500 text-[11px] shrink-0 font-medium select-none">
                [{log.timeFormatted}]
              </span>

              {/* Level Badge */}
              <span
                className={cn(
                  'text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider shrink-0 select-none',
                  getLevelBadgeClass(log.level)
                )}
              >
                {log.level}
              </span>

              {/* Component Badge if any */}
              {log.componentId && (
                <span className="text-[10px] text-blue-400 bg-blue-950/40 px-1 rounded shrink-0 border border-blue-900/50">
                  {log.componentId}
                </span>
              )}

              {/* Message */}
              <span
                className={cn(
                  'flex-1 break-words font-mono text-[11px]',
                  log.level === 'ERROR'
                    ? 'text-rose-400 font-semibold'
                    : log.level === 'WARNING'
                    ? 'text-amber-300'
                    : log.level === 'GPIO'
                    ? 'text-emerald-300'
                    : log.level === 'SENSOR'
                    ? 'text-cyan-300'
                    : log.level === 'ACTUATOR'
                    ? 'text-purple-300'
                    : 'text-slate-300'
                )}
              >
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
