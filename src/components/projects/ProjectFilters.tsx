'use client';

import React from 'react';
import { ViewMode, ProjectCategory, BoardType, ProjectStatus } from '@/types/project';
import { Search, LayoutGrid, List, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ProjectFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: ProjectStatus | 'All';
  onStatusChange: (status: ProjectStatus | 'All') => void;
  categoryFilter: ProjectCategory | 'All';
  onCategoryChange: (category: ProjectCategory | 'All') => void;
  boardFilter: BoardType | 'All';
  onBoardChange: (board: BoardType | 'All') => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onResetFilters: () => void;
  counts: {
    all: number;
    inProgress: number;
    draft: number;
    completed: number;
  };
}

const CATEGORIES: ProjectCategory[] = [
  'Smart Farming',
  'Smart Home',
  'Environmental Monitoring',
  'Robotics',
  'General IoT',
];

const BOARDS: BoardType[] = [
  'ESP32 DevKit V1',
  'ESP32-C3 Super Mini',
  'ESP8266 NodeMCU',
  'Wemos D1 Mini',
  'Arduino Uno',
  'Arduino Nano',
];

export function ProjectFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  categoryFilter,
  onCategoryChange,
  boardFilter,
  onBoardChange,
  viewMode,
  onViewModeChange,
  onResetFilters,
  counts,
}: ProjectFiltersProps) {
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'All' ||
    categoryFilter !== 'All' ||
    boardFilter !== 'All';

  return (
    <div className="space-y-3.5 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
      {/* Top Filter Row: Search & View Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects by name, description, tags..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>

        {/* View Toggle & Reset */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<RotateCcw className="w-3.5 h-3.5 text-slate-500" />}
              onClick={onResetFilters}
              className="text-xs text-slate-600 hover:text-slate-900"
            >
              Reset
            </Button>
          )}

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-2xs font-medium'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid View"
              aria-label="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-2xs font-medium'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="List View"
              aria-label="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Filter Row: Status Pills & Dropdown Selects */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Status:
          </span>
          <button
            onClick={() => onStatusChange('All')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'All'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => onStatusChange('In Progress')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              statusFilter === 'In Progress'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50/60 text-blue-700 hover:bg-blue-100/70 border border-blue-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            In Progress ({counts.inProgress})
          </button>
          <button
            onClick={() => onStatusChange('Draft')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              statusFilter === 'Draft'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50/60 text-amber-700 hover:bg-amber-100/70 border border-amber-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Draft ({counts.draft})
          </button>
          <button
            onClick={() => onStatusChange('Completed')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              statusFilter === 'Completed'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100/70 border border-emerald-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Completed ({counts.completed})
          </button>
        </div>

        {/* Dropdowns for Category & Board */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value as ProjectCategory | 'All')}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Board Filter */}
          <select
            value={boardFilter}
            onChange={(e) => onBoardChange(e.target.value as BoardType | 'All')}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option value="All">All Boards</option>
            {BOARDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
