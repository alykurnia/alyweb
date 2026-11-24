'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Search, Plus } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface ComponentItem {
  id: string;
  name: string;
  category: 'Sensors' | 'Actuators' | 'Displays' | 'Communication' | 'Power';
  protocol: 'I2C' | 'SPI' | 'UART' | 'GPIO / Analog' | 'One-Wire';
  voltage: string;
  description: string;
  partNumber: string;
}

const COMPONENTS_CATALOG: ComponentItem[] = [
  {
    id: 'comp-1',
    name: 'DHT22 Temperature & Humidity Sensor',
    category: 'Sensors',
    protocol: 'One-Wire',
    voltage: '3.3V - 5V',
    description: 'Capacitive humidity sensor & thermistor with digital output signal.',
    partNumber: 'AM2302',
  },
  {
    id: 'comp-2',
    name: 'BMP280 Barometric Pressure Sensor',
    category: 'Sensors',
    protocol: 'I2C',
    voltage: '3.3V',
    description: 'Precision barometric air pressure and ambient temperature sensor.',
    partNumber: 'BMP280',
  },
  {
    id: 'comp-3',
    name: 'SCD40 Photoacoustic CO2 Sensor',
    category: 'Sensors',
    protocol: 'I2C',
    voltage: '3.3V',
    description: 'Miniaturized NDIR/photoacoustic true CO2 sensor for indoor air quality.',
    partNumber: 'SCD40',
  },
  {
    id: 'comp-4',
    name: 'MPU-6050 6-DoF IMU Gyroscope',
    category: 'Sensors',
    protocol: 'I2C',
    voltage: '3.3V - 5V',
    description: '3-axis accelerometer and 3-axis gyroscope with integrated DMP motion processor.',
    partNumber: 'MPU-6050',
  },
  {
    id: 'comp-5',
    name: 'HC-SR04 Ultrasonic Distance Sensor',
    category: 'Sensors',
    protocol: 'GPIO / Analog',
    voltage: '5V',
    description: 'Sonar distance ranging sensor measuring 2cm to 400cm with 3mm precision.',
    partNumber: 'HC-SR04',
  },
  {
    id: 'comp-6',
    name: 'SSD1306 0.96" OLED Display (128x64)',
    category: 'Displays',
    protocol: 'I2C',
    voltage: '3.3V - 5V',
    description: 'High-contrast monochrome graphic display for live telemetry dashboards.',
    partNumber: 'SSD1306',
  },
  {
    id: 'comp-7',
    name: 'SG90 Micro Servo Motor (9g)',
    category: 'Actuators',
    protocol: 'GPIO / Analog',
    voltage: '4.8V - 6V',
    description: 'Sub-micro servo with 180° rotation angle for robotic arms and dispensers.',
    partNumber: 'SG90',
  },
  {
    id: 'comp-8',
    name: '5V Single-Channel Relay Module',
    category: 'Actuators',
    protocol: 'GPIO / Analog',
    voltage: '5V (250VAC 10A)',
    description: 'Optocoupler isolated electro-mechanical relay to switch mains AC/DC loads.',
    partNumber: 'SRD-05VDC-SL-C',
  },
  {
    id: 'comp-9',
    name: 'INA219 High-Side DC Current Sensor',
    category: 'Sensors',
    protocol: 'I2C',
    voltage: '3.3V - 5V',
    description: 'Bi-directional zero-drift monitor measuring up to +26V and 3.2A.',
    partNumber: 'INA219',
  },
  {
    id: 'comp-10',
    name: 'MAX30102 Pulse Oximeter & Heart Rate',
    category: 'Sensors',
    protocol: 'I2C',
    voltage: '1.8V / 3.3V',
    description: 'Integrated optical biometric sensor with red & IR LEDs for wearable health telemetry.',
    partNumber: 'MAX30102',
  },
  {
    id: 'comp-11',
    name: 'MQ-137 Ammonia & Gas Detector',
    category: 'Sensors',
    protocol: 'GPIO / Analog',
    voltage: '5V',
    description: 'Tin dioxide (SnO2) electrochemical sensor sensitive to NH3 and gas plumes.',
    partNumber: 'MQ-137',
  },
  {
    id: 'comp-12',
    name: '2.9" Tri-Color SPI e-Paper Display',
    category: 'Displays',
    protocol: 'SPI',
    voltage: '3.3V',
    description: 'Ultra-low power reflective bi-stable electronic ink display (Red/Black/White).',
    partNumber: 'GDEW029Z10',
  },
];

export default function ComponentLibraryPage() {
  const { openCreateModalWithBoard } = useAppStore();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const filtered = COMPONENTS_CATALOG.filter((comp) => {
    const matchesSearch =
      comp.name.toLowerCase().includes(search.toLowerCase()) ||
      comp.partNumber.toLowerCase().includes(search.toLowerCase()) ||
      comp.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === 'All' || comp.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Back button */}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Component & Sensor Library
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              24 Available Modules
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Standard electronics library with verified voltage thresholds, pinout mappings, and simulation drivers.
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => openCreateModalWithBoard()}
          className="text-xs"
        >
          Create Project With Parts
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search component by name, IC part number, protocol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto text-xs">
            {['All', 'Sensors', 'Actuators', 'Displays'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  activeCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Components */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <Card
            key={item.id}
            hoverable
            className="p-5 flex flex-col justify-between border-slate-200/90 hover:border-slate-300 shadow-xs group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                  {item.partNumber}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {item.protocol}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {item.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] text-slate-600">VCC: {item.voltage}</span>
              <span className="text-[10px] font-mono font-medium text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                HAL Verified
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}


