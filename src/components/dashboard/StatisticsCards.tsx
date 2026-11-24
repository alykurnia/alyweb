'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { FolderKanban, Cpu, Layers, GraduationCap, ArrowUpRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export function StatisticsCards() {
  const { projects } = useAppStore();

  const totalProjectsCount = projects.length > 0 ? projects.length : 8;
  const formattedProjects = totalProjectsCount < 10 ? `0${totalProjectsCount}` : `${totalProjectsCount}`;

  const inProgressCount = projects.filter((p) => p.status === 'In Progress').length || 4;
  const completedCount = projects.filter((p) => p.status === 'Completed').length || 2;

  const STATS = [
    {
      id: 'stat-projects',
      title: 'Total Projects',
      value: formattedProjects,
      description: `${inProgressCount} active, ${completedCount} completed`,
      icon: FolderKanban,
      color: 'blue',
      trend: '+2 this month',
      href: '/projects',
    },
    {
      id: 'stat-components',
      title: 'Available Components',
      value: '24',
      description: 'Sensors, actuators, displays',
      icon: Layers,
      color: 'indigo',
      trend: 'DHT22, SCD40 added',
      href: '/component-library',
    },
    {
      id: 'stat-boards',
      title: 'Supported Boards',
      value: '06',
      description: 'ESP32, ESP8266, AVR families',
      icon: Cpu,
      color: 'teal',
      trend: 'RISC-V C3 supported',
      href: '#supported-boards',
    },
    {
      id: 'stat-progress',
      title: 'Learning Progress',
      value: '65%',
      description: '13 of 20 lab modules completed',
      icon: GraduationCap,
      color: 'emerald',
      trend: 'Level: Intermediate',
      href: '/tutorials',
      isProgress: true,
      progressValue: 65,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {STATS.map((stat) => {
        const Icon = stat.icon;

        return (
          <Link key={stat.id} href={stat.href} className="group">
            <Card
              hoverable
              className="p-5 flex flex-col justify-between h-full border-slate-200/90 hover:border-blue-300 transition-all shadow-xs"
            >
              <div>
                {/* Header: Title and Icon */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {stat.title}
                  </span>
                  <div
                    className={`p-2 rounded-lg transition-transform group-hover:scale-105 ${
                      stat.color === 'blue'
                        ? 'bg-blue-50 text-blue-600'
                        : stat.color === 'indigo'
                        ? 'bg-indigo-50 text-indigo-600'
                        : stat.color === 'teal'
                        ? 'bg-teal-50 text-teal-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                {/* Big Metric Value */}
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
                    {stat.value}
                  </span>
                  {stat.trend && !stat.isProgress && (
                    <span className="text-[11px] font-medium text-slate-400 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-0.5 text-blue-500" />
                      {stat.trend}
                    </span>
                  )}
                </div>

                {/* Progress bar for Learning Progress */}
                {stat.isProgress && (
                  <div className="mt-2.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${stat.progressValue}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Description Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="truncate">{stat.description}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
