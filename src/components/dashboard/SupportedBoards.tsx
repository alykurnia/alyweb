'use client';

import React from 'react';
import { SUPPORTED_BOARDS } from '@/lib/mock-data';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/lib/store';
import { BoardType } from '@/types/project';
import {
  Cpu,
  Zap,
  Wifi,
  Radio,
  Plus,
} from 'lucide-react';

export function SupportedBoards() {
  const { openCreateModalWithBoard } = useAppStore();

  // Helper to render clean technical PCB visual badge/illustration
  const renderBoardIllustration = (boardName: string, family: string) => {
    const isESP32 = family === 'ESP32';
    const isESP8266 = family === 'ESP8266';

    return (
      <div className="relative w-full h-24 bg-gradient-to-b from-slate-900 to-slate-950 rounded-lg p-3 flex items-center justify-between border border-slate-800 overflow-hidden select-none">
        {/* PCB trace lines */}
        <div className="absolute inset-0 opacity-15">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="20" x2="120" y2="20" stroke="#38bdf8" strokeWidth="1" />
            <line x1="120" y1="20" x2="140" y2="40" stroke="#38bdf8" strokeWidth="1" />
            <line x1="140" y1="40" x2="300" y2="40" stroke="#38bdf8" strokeWidth="1" />
            <circle cx="120" cy="20" r="2" fill="#38bdf8" />
            <circle cx="140" cy="40" r="2" fill="#38bdf8" />
          </svg>
        </div>

        {/* Board Metallic Shield / MCU Representation */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-14 bg-gradient-to-b from-slate-700 to-slate-800 rounded border border-slate-600 shadow-inner flex flex-col items-center justify-center p-1">
            <Cpu className="w-4 h-4 text-blue-400 mb-0.5" />
            <span className="text-[7px] font-mono text-slate-300 tracking-tighter uppercase font-bold text-center leading-none">
              {family === 'Arduino' ? 'ATmega' : family}
            </span>
            <div className="mt-1 flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
              <span className="w-1 h-1 rounded-full bg-blue-400"></span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[9px] font-mono text-slate-400 block uppercase tracking-wider">
              Architecture
            </span>
            <span className="text-xs font-mono font-semibold text-white block">
              {isESP32 ? 'Xtensa / RISC-V' : isESP8266 ? 'Tensilica L106' : 'AVR 8-Bit'}
            </span>
            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
              {(isESP32 || isESP8266) && (
                <span className="flex items-center gap-0.5 text-blue-400">
                  <Wifi className="w-2.5 h-2.5" /> Wi-Fi
                </span>
              )}
              {isESP32 && (
                <span className="flex items-center gap-0.5 text-indigo-400">
                  <Radio className="w-2.5 h-2.5" /> BLE
                </span>
              )}
              {family === 'Arduino' && (
                <span className="flex items-center gap-0.5 text-teal-400">
                  <Zap className="w-2.5 h-2.5" /> 5V TTL
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pinout representation on right edge */}
        <div className="relative z-10 flex flex-col gap-1 items-end opacity-60">
          <div className="w-3 h-1 bg-amber-400/80 rounded-xs" />
          <div className="w-3 h-1 bg-amber-400/80 rounded-xs" />
          <div className="w-3 h-1 bg-amber-400/80 rounded-xs" />
          <div className="w-3 h-1 bg-amber-400/80 rounded-xs" />
          <div className="w-3 h-1 bg-amber-400/80 rounded-xs" />
        </div>
      </div>
    );
  };

  return (
    <div id="supported-boards" className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-teal-50 text-teal-700 rounded-lg border border-teal-200">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Supported Microcontrollers & Development Boards
            </h2>
            <p className="text-xs text-slate-500">
              Validated hardware platforms for hardware emulation, GPIO pinout mapping, and embedded firmware
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
          6 Platforms Active
        </span>
      </div>

      {/* Board Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SUPPORTED_BOARDS.map((board) => (
          <Card
            key={board.id}
            hoverable
            className="flex flex-col justify-between border-slate-200/90 hover:border-slate-300 transition-all shadow-xs group"
          >
            <div className="p-5">
              {/* Board Visual Illustration */}
              {renderBoardIllustration(board.name, board.family)}

              {/* Title & Badge */}
              <div className="mt-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                  {board.name}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {board.badge}
                </span>
              </div>

              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {board.description}
              </p>

              {/* Technical Specifications Grid */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="bg-slate-50 p-2 rounded border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block">Clock Frequency</span>
                  <span className="font-semibold text-slate-800">{board.clockSpeed}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block">Flash Memory</span>
                  <span className="font-semibold text-slate-800">{board.flash}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block">GPIO Available</span>
                  <span className="font-semibold text-slate-800">{board.gpioCount} Pins</span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block">Operating Voltage</span>
                  <span className="font-semibold text-slate-800">{board.voltage}</span>
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 rounded-b-xl flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">
                {board.family} Architecture
              </span>
              <Button
                size="xs"
                variant="primary"
                leftIcon={<Plus className="w-3 h-3" />}
                onClick={() => openCreateModalWithBoard(board.name as BoardType)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium border-slate-900"
              >
                Create with this board
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
