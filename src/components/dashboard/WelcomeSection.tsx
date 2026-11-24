'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/lib/store';
import { Plus, Compass, Radio, Terminal } from 'lucide-react';
import Link from 'next/link';

export function WelcomeSection() {
  const { openCreateModalWithBoard } = useAppStore();

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 via-navy-900 to-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-md">
      {/* Subtle circuit background grid */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#38bdf8 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px',
        }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left: Headline & Description */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-3">
            <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>Interactive IoT Studio • Hardware Lab v1.0</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome to IoT Lab
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Build, explore, and manage your IoT projects in one workspace. From sensor pinouts to
            firmware logic, architect and test your embedded prototypes with ease.
          </p>

          {/* Action Buttons */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              size="md"
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => openCreateModalWithBoard()}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-900/40"
            >
              Create New Project
            </Button>

            <Link href="/component-library">
              <Button
                size="md"
                variant="outline"
                leftIcon={<Compass className="w-4 h-4 text-slate-300" />}
                className="bg-slate-800/80 text-white border-slate-700 hover:bg-slate-700/80 font-medium"
              >
                Explore Components
              </Button>
            </Link>
          </div>
        </div>

        {/* Right: Technical Health & Environment Telemetry */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 min-w-[260px] self-start lg:self-center">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800/80 text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              Environment Telemetry
            </span>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Live
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-400">
              <span>Toolchain:</span>
              <span className="text-slate-200">ESP-IDF / AVR-GCC</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Serial Bridge:</span>
              <span className="text-emerald-400">WebSerial Ready</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Active Target:</span>
              <span className="text-blue-400">ESP32-Xtensa LX6</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
