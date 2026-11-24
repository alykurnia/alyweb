'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { ArrowLeft, Check, Save } from 'lucide-react';

export default function PreferencesPage() {
  const [defaultBoard, setDefaultBoard] = useState('ESP32 DevKit V1');
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState('14px');
  const [baudRate, setBaudRate] = useState('115200');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl space-y-6 pb-12">
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Workbench & Hardware Preferences
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure default development environments, compiler preferences, and serial baud settings.
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          leftIcon={saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          onClick={handleSave}
          className="text-xs"
        >
          {saved ? 'Saved!' : 'Save Preferences'}
        </Button>
      </div>

      <Card className="p-6 border-slate-200 shadow-xs space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Default Microcontroller Target"
            value={defaultBoard}
            onChange={(e) => setDefaultBoard(e.target.value)}
            options={[
              { value: 'ESP32 DevKit V1', label: 'ESP32 DevKit V1 (Standard)' },
              { value: 'ESP32-C3 Super Mini', label: 'ESP32-C3 Super Mini' },
              { value: 'ESP8266 NodeMCU', label: 'ESP8266 NodeMCU' },
              { value: 'Arduino Uno', label: 'Arduino Uno' },
            ]}
          />

          <Select
            label="Default Theme Appearance"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            options={[
              { value: 'light', label: 'Light Mode (Default Workstation)' },
              { value: 'navy', label: 'High-Contrast Navy (Engineering)' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Monaco Editor Font Size"
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            options={[
              { value: '12px', label: '12px (Compact)' },
              { value: '14px', label: '14px (Recommended)' },
              { value: '16px', label: '16px (Comfortable)' },
            ]}
          />

          <Select
            label="Serial Monitor Default Baud Rate"
            value={baudRate}
            onChange={(e) => setBaudRate(e.target.value)}
            options={[
              { value: '9600', label: '9600 baud (Classic AVR)' },
              { value: '115200', label: '115200 baud (Standard ESP32/ESP8266)' },
              { value: '921600', label: '921600 baud (High-Speed Flashing)' },
            ]}
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Sprint 1 Settings Foundation</span>
          <span className="font-mono text-emerald-600">Preferences Synced Locally</span>
        </div>
      </Card>
    </div>
  );
}
