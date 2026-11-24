'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, CheckCircle2, Clock, ExternalLink } from 'lucide-react';

interface Tutorial {
  id: string;
  title: string;
  category: 'ESP32 Basics' | 'Protocols & Networking' | 'Sensors & Displays' | 'Power Management';
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  completed: boolean;
  summary: string;
}

const TUTORIALS: Tutorial[] = [
  {
    id: 'tut-1',
    title: 'ESP32 Wi-Fi & Station Mode Setup',
    category: 'Protocols & Networking',
    duration: '20 mins',
    difficulty: 'Beginner',
    completed: true,
    summary: 'Connect to local WPA2/WPA3 access points, obtain DHCP IP addresses, and handle reconnection fallbacks.',
  },
  {
    id: 'tut-2',
    title: 'Publishing Sensor Telemetry over MQTT',
    category: 'Protocols & Networking',
    duration: '35 mins',
    difficulty: 'Intermediate',
    completed: true,
    summary: 'Configure PubSubClient to publish periodic JSON payloads to Mosquitto and HiveMQ brokers.',
  },
  {
    id: 'tut-3',
    title: 'I2C Bus Addressing with Multiple OLEDs',
    category: 'Sensors & Displays',
    duration: '25 mins',
    difficulty: 'Beginner',
    completed: true,
    summary: 'Scan the I2C bus using Wire.h and drive two SSD1306 displays simultaneously via hardware address jumpers.',
  },
  {
    id: 'tut-4',
    title: 'Deep Sleep & ULP Wakeup Triggers on ESP32',
    category: 'Power Management',
    duration: '40 mins',
    difficulty: 'Advanced',
    completed: false,
    summary: 'Reduce idle current draw down to 10uA and configure external GPIO capacitive touch wakeup.',
  },
  {
    id: 'tut-5',
    title: 'Calibrating Analog Soil Moisture & ADC Non-Linearity',
    category: 'Sensors & Displays',
    duration: '30 mins',
    difficulty: 'Intermediate',
    completed: false,
    summary: 'Overcome ESP32 ADC non-linearity using multi-point polynomial calibration and lookup tables.',
  },
  {
    id: 'tut-6',
    title: 'Building a MicroPython Web Server with WebSockets',
    category: 'ESP32 Basics',
    duration: '45 mins',
    difficulty: 'Intermediate',
    completed: false,
    summary: 'Serve an asynchronous web UI from internal flash and broadcast real-time pin states over WebSockets.',
  },
];

export default function TutorialsPage() {
  return (
    <div className="space-y-6 pb-12">
      <div>
        <Link href="/">
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<ArrowLeft className="w-4 h-4 text-slate-500" />}
            className="text-xs text-slate-600 hover:text-slate-900"
          >
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Interactive IoT Tutorials & Labs
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              65% Completed (13/20)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hands-on learning curriculum engineered for embedded software engineers and makers.
          </p>
        </div>
      </div>

      {/* Progress Card */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-slate-700">Course Completion Track</span>
          <span className="font-mono text-emerald-600 font-bold">13 of 20 Labs Completed (65%)</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '65%' }} />
        </div>
      </div>

      {/* Tutorials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TUTORIALS.map((tut) => (
          <Card key={tut.id} hoverable className="p-5 flex flex-col justify-between border-slate-200/90 shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {tut.category}
                </span>
                {tut.completed ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Completed
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-slate-400">Available</span>
                )}
              </div>

              <h3 className="text-sm font-bold text-slate-900 tracking-tight">{tut.title}</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{tut.summary}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                <Clock className="w-3 h-3" /> {tut.duration} • {tut.difficulty}
              </span>
              <Button size="xs" variant={tut.completed ? 'secondary' : 'primary'} rightIcon={<ExternalLink className="w-3 h-3" />}>
                {tut.completed ? 'Review Lab' : 'Start Lab'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
