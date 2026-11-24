'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Code2, Cpu, Terminal, Layers, ExternalLink } from 'lucide-react';

const DOC_SECTIONS = [
  {
    title: 'Hardware Abstraction Layer (HAL)',
    description: 'Unified pinout mapping, peripheral registers, and clock frequencies across ESP32, ESP8266, and AVR microcontrollers.',
    icon: Cpu,
    links: ['GPIO Multiplexing', 'ADC & DAC Sampling', 'Hardware PWM Timers', 'SPI & I2C Master/Slave'],
  },
  {
    title: 'Communication Protocols',
    description: 'Integration specs for embedded networking, telemetry streaming, and wireless mesh topologies.',
    icon: Terminal,
    links: ['MQTT 3.1.1 / 5.0 Spec', 'WebSockets Realtime Bridge', 'Bluetooth Low Energy (GATT)', 'HTTP REST Client'],
  },
  {
    title: 'Sensor & Actuator Driver Specs',
    description: 'Timing diagrams, sampling rates, communication packets, and calibration formulas for cataloged components.',
    icon: Layers,
    links: ['I2C Bus Timing & Pullups', 'Interrupt Handling on INT0/INT1', 'Non-blocking Sensor Reading', 'Power Consumption Calculations'],
  },
  {
    title: 'Firmware Architecture & Toolchains',
    description: 'GCC toolchain versions, memory partitioning, partition tables, and OTA firmware updates.',
    icon: Code2,
    links: ['ESP-IDF v5.2 Environment', 'Arduino Core 3.0 API', 'Flash Memory Partition Tables', 'FreeRTOS Task Scheduling'],
  },
];

export default function DocumentationPage() {
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
              Hardware & API Documentation
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              v1.0.4 Reference
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Technical engineering documentation, pinout references, and HAL developer guides for IoT Lab.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DOC_SECTIONS.map((sec, i) => {
          const Icon = sec.icon;
          return (
            <Card key={i} className="p-6 border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">{sec.title}</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">{sec.description}</p>
                <div className="space-y-1.5 pt-3 border-t border-slate-100">
                  {sec.links.map((link, j) => (
                    <div
                      key={j}
                      className="text-xs text-slate-700 hover:text-blue-600 flex items-center justify-between py-1 px-2 rounded hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => alert(`Documentation topic "${link}" is being finalized for Sprint 2 release.`)}
                    >
                      <span>{link}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
