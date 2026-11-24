'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { useAppStore } from '@/lib/store';
import {
  PlusCircle,
  Layers,
  GraduationCap,
  BookOpen,
  ArrowRight,
  Compass,
} from 'lucide-react';

export function QuickAccess() {
  const { openCreateModalWithBoard } = useAppStore();

  const SHORTCUTS = [
    {
      id: 'qa-create',
      title: 'Start a New Project',
      description: 'Choose your microcontroller board, set project domain, and generate pinouts.',
      icon: PlusCircle,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      badge: 'Quick Launch',
      onClick: () => openCreateModalWithBoard(),
    },
    {
      id: 'qa-components',
      title: 'Browse Components',
      description: 'Explore 24+ sensors, actuators, relays, and displays with wiring schematics.',
      icon: Layers,
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      badge: '24 Parts',
      href: '/component-library',
    },
    {
      id: 'qa-tutorials',
      title: 'Read Tutorials',
      description: 'Step-by-step interactive labs covering ESP32 Wi-Fi, MQTT, and sensor telemetry.',
      icon: GraduationCap,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      badge: '12 Hands-on Labs',
      href: '/tutorials',
    },
    {
      id: 'qa-docs',
      title: 'Open Documentation',
      description: 'Comprehensive API references, pinout diagrams, and HAL hardware guides.',
      icon: BookOpen,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      badge: 'v1.0 Docs',
      href: '/documentation',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
          <Compass className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Quick Access & Resources</h2>
          <p className="text-xs text-slate-500">Jump right into hardware authoring and embedded guides</p>
        </div>
      </div>

      {/* Grid of Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SHORTCUTS.map((shortcut) => {
          const Icon = shortcut.icon;

          const cardContent = (
            <Card
              hoverable
              className="p-5 flex flex-col justify-between h-full border-slate-200/90 hover:border-blue-300 transition-all shadow-xs group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${shortcut.bgColor} ${shortcut.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {shortcut.badge}
                  </span>
                </div>

                <h3 className="mt-3.5 text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {shortcut.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  {shortcut.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-blue-600 group-hover:text-blue-700">
                <span>Access Resource</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          );

          if (shortcut.onClick) {
            return (
              <div key={shortcut.id} onClick={shortcut.onClick}>
                {cardContent}
              </div>
            );
          }

          return (
            <Link key={shortcut.id} href={shortcut.href!}>
              {cardContent}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
