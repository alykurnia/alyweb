'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import {
  LayoutDashboard,
  FolderKanban,
  Cpu,
  Workflow,
  Code2,
  Terminal,
  Layers,
  GraduationCap,
  FileCode,
  Sliders,
  UserCheck,
  X,
  Radio,
  Sparkles,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  isComingSoon?: boolean;
}

const WORKSPACE_NAV: NavItem[] = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'My Projects', href: '/projects', icon: FolderKanban },
  { name: 'Circuit Builder', href: '/circuit-builder', icon: Workflow, badge: 'Live' },
  { name: 'Simulator', href: '/simulator', icon: Cpu, badge: 'Live' },
  { name: 'Code Editor', href: '/code-editor', icon: Code2, badge: 'IDE' },
  { name: 'Serial Monitor', href: '/serial-monitor', icon: Terminal, badge: 'Live' },
];

const HARDWARE_NAV: NavItem[] = [
  { name: 'Hardware Center', href: '/hardware', icon: Radio, badge: 'ESP32' },
];

const LEARNING_NAV: NavItem[] = [
  { name: 'Component Library', href: '/component-library', icon: Layers, badge: '24 Parts', isComingSoon: true },
  { name: 'Tutorials', href: '/tutorials', icon: GraduationCap, badge: '12 Labs', isComingSoon: true },
  { name: 'Documentation', href: '/documentation', icon: FileCode, isComingSoon: true },
];

const SETTINGS_NAV: NavItem[] = [
  { name: 'Preferences', href: '/preferences', icon: Sliders, isComingSoon: true },
  { name: 'Account Settings', href: '/settings', icon: UserCheck, isComingSoon: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isMobileSidebarOpen, setMobileSidebarOpen } = useAppStore();

  const renderNavSection = (title: string, items: NavItem[]) => (
    <div className="mb-6">
      <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400/80">
        {title}
      </div>
      <ul className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <li key={item.name}>
              <Link
                href={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                className={cn(
                  'group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/25 shadow-xs font-semibold'
                    : 'text-slate-300/85 hover:bg-slate-800/60 hover:text-white'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-colors',
                      isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                </div>

                {item.badge && (
                  <span
                    className={cn(
                      'text-[9px] px-1.5 py-0.5 rounded font-mono font-medium tracking-tight',
                      isActive
                        ? 'bg-blue-500/20 text-blue-300'
                        : item.badge === 'Live'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold'
                        : item.isComingSoon
                        ? 'bg-slate-800 text-slate-400 border border-slate-700/60'
                        : 'bg-slate-800 text-slate-300'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0B1329] text-white border-r border-slate-800/80 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 py-4.5 border-b border-slate-800/80 bg-[#070D1E]/60">
        <Link
          href="/"
          onClick={() => setMobileSidebarOpen(false)}
          className="flex items-center gap-2.5 group"
        >
          {/* Custom Technology-Inspired Symbol */}
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-900/30 ring-1 ring-white/10 group-hover:scale-105 transition-transform">
            <Radio className="w-4 h-4 text-white" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white group-hover:text-blue-300 transition-colors">
                IoT Lab
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-semibold bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                v1.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-tight font-normal">
              Interactive IoT Learning Studio
            </p>
          </div>
        </Link>

        {/* Mobile Close Button */}
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 sidebar-scroll">
        {renderNavSection('Workspace', WORKSPACE_NAV)}
        {renderNavSection('Physical Hardware', HARDWARE_NAV)}
        {renderNavSection('Learning', LEARNING_NAV)}
        {renderNavSection('Settings', SETTINGS_NAV)}
      </div>

      {/* Engineering Footer Status Card */}
      <div className="p-3 border-t border-slate-800/80 bg-[#070D1E]/40">
        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Engine Status
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Ready
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Microcontroller HAL: <span className="font-mono text-slate-200">ESP32 / AVR</span>
          </p>
          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
            <span>Circuit Builder Live</span>
            <span className="font-mono text-emerald-400">Release 1.2.0</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar: Permanent */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
