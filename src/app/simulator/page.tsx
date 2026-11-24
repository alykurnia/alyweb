'use client';

import React from 'react';
import Link from 'next/link';
import { Cpu, Play, Sliders, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function SimulatorPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4">
      {/* Simulation Engine Active Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/60 shadow-xl text-white relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Sprint 3 — Simulation Engine Operational
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Interactive IoT Circuit Simulation Engine
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Test and run circuits in real-time right inside the Circuit Builder. Simulate virtual GPIO states, PWM output, live sensors (DHT22, Ultrasonic, Soil Moisture, MQ135), glowing LEDs, relays, rotating servos, and telemetry on 16x2 LCD & OLED displays.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link href="/circuit-builder">
              <Button
                variant="primary"
                leftIcon={<Play className="w-4 h-4 fill-current" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="bg-blue-600 hover:bg-blue-500 font-semibold shadow-lg shadow-blue-500/30"
              >
                Launch Simulation in Circuit Builder
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Simulator Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 w-fit">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Virtual GPIO Controller</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Hardware-accurate pin restrictions for ESP32 DevKit V1 and Arduino Uno. Tracks INPUT, OUTPUT, PWM duty cycle, ADC conversions, and input-only pins (GPIO 34-39).
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 w-fit">
            <Sliders className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Interactive Sensor Sliders</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Adjust real-time environment sliders while simulation is running: temperature, humidity, obstacle distance, air quality PPM, and soil moisture levels.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 w-fit">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Electrical DRC Verification</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Automated circuit design rule check catches short circuits (VCC-GND), 5V/3.3V voltage mismatches, missing power rails, and unresisted LEDs safely before execution.
          </p>
        </div>
      </div>
    </div>
  );
}
