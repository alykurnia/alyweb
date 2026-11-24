'use client';

import React from 'react';
import { useSimulationStore } from '@/stores/simulationStore';
import {
  CheckCircle2,
  X,
  ShieldAlert,
} from 'lucide-react';

export function ValidationModal() {
  const {
    isValidationModalOpen,
    toggleValidationModal,
    validationIssues,
  } = useSimulationStore();

  if (!isValidationModalOpen) return null;

  const fatalIssues = validationIssues.filter((i) => i.severity === 'FATAL');
  const errorIssues = validationIssues.filter((i) => i.severity === 'ERROR');
  const warningIssues = validationIssues.filter((i) => i.severity === 'WARNING');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden font-sans flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-base font-bold text-white">
                Circuit Electrical & Wiring Verification
              </h2>
              <p className="text-xs text-slate-400">
                Automated electrical design rule check (DRC)
              </p>
            </div>
          </div>
          <button
            onClick={toggleValidationModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {validationIssues.length === 0 ? (
            <div className="p-6 text-center space-y-2 bg-slate-950/60 rounded-xl border border-emerald-900/40">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-emerald-300">
                All Electrical DRC Checks Passed
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No short circuits, voltage mismatches, or unconnected power rails detected. The circuit is ready for safe simulation.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Fatal Short Circuits */}
              {fatalIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="p-3.5 rounded-lg bg-rose-950/50 border border-rose-800/80 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-rose-700 text-white font-mono text-[10px] font-bold uppercase tracking-wider">
                      FATAL
                    </span>
                    <span className="font-semibold text-rose-200 text-xs">
                      {issue.rule}
                    </span>
                  </div>
                  <p className="text-xs text-rose-300 font-mono leading-relaxed">
                    {issue.message}
                  </p>
                  <p className="text-[11px] text-rose-400">
                    Fix: Remove the wire directly connecting VCC and GND to prevent simulation abort.
                  </p>
                </div>
              ))}

              {/* Error Issues */}
              {errorIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-800/80 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-amber-600 text-white font-mono text-[10px] font-bold uppercase tracking-wider">
                      ERROR
                    </span>
                    <span className="font-semibold text-amber-200 text-xs">
                      {issue.rule}
                    </span>
                  </div>
                  <p className="text-xs text-amber-300 font-mono leading-relaxed">
                    {issue.message}
                  </p>
                </div>
              ))}

              {/* Warning Issues */}
              {warningIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                      WARNING
                    </span>
                    <span className="font-semibold text-slate-300 text-xs">
                      {issue.rule}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono leading-relaxed">
                    {issue.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={toggleValidationModal}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
