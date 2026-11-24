'use client';

import React, { useState } from 'react';
import { COMPONENT_DEFINITIONS, CATEGORY_LABELS } from '@/lib/component-definitions';
import { ComponentCategory } from '@/types/circuit';
import { useCircuitStore } from '@/stores/circuitStore';
import {
  Search,
  Cpu,
  Thermometer,
  Zap,
  Tv,
  Radio,
  Minus,
  BatteryCharging,
  Plus,
  ChevronDown,
  ChevronRight,
  GripVertical,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ComponentLibrary() {
  const { addNode } = useCircuitStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory | 'all'>('all');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategoryCollapse = (cat: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'microcontroller':
        return <Cpu className="w-4 h-4 text-blue-500" />;
      case 'sensor':
        return <Thermometer className="w-4 h-4 text-emerald-500" />;
      case 'actuator':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'display':
        return <Tv className="w-4 h-4 text-indigo-500" />;
      case 'communication':
        return <Radio className="w-4 h-4 text-sky-500" />;
      case 'passive':
        return <Minus className="w-4 h-4 text-purple-500" />;
      case 'power':
        return <BatteryCharging className="w-4 h-4 text-teal-500" />;
      default:
        return <Cpu className="w-4 h-4 text-slate-500" />;
    }
  };

  const onDragStart = (event: React.DragEvent, typeId: string) => {
    event.dataTransfer.setData('application/reactflow', typeId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const allComponents = Object.values(COMPONENT_DEFINITIONS);

  const filteredComponents = allComponents.filter((comp) => {
    const matchesSearch =
      comp.name.toLowerCase().includes(search.toLowerCase()) ||
      comp.description.toLowerCase().includes(search.toLowerCase()) ||
      comp.pins.some((p) => p.name.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' || comp.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = Object.keys(CATEGORY_LABELS) as ComponentCategory[];

  return (
    <div className="w-72 shrink-0 bg-white border-r border-slate-200/90 flex flex-col h-full select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200/90 bg-slate-50/70">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Component Library
              </h2>
              <p className="text-[10px] text-slate-500 font-medium">
                Drag or click to place onto canvas
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100/70 text-blue-700 font-semibold">
            {allComponents.length} Parts
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search parts, MCU, pins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>

        {/* Category Pills Scroller */}
        <div className="flex items-center gap-1 mt-2.5 overflow-x-auto pb-1 text-[10px] no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'px-2 py-0.5 rounded-full whitespace-nowrap font-medium transition-colors',
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            )}
          >
            All ({allComponents.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-2 py-0.5 rounded-full whitespace-nowrap font-medium transition-colors',
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              )}
            >
              {CATEGORY_LABELS[cat].label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Components List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {categories.map((cat) => {
          const compsInCat = filteredComponents.filter((c) => c.category === cat);
          if (compsInCat.length === 0) return null;

          const isCollapsed = collapsedCategories[cat];

          return (
            <div key={cat} className="space-y-1.5">
              {/* Category Accordion Header */}
              <button
                onClick={() => toggleCategoryCollapse(cat)}
                className="w-full flex items-center justify-between text-left py-1 px-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  {getCategoryIcon(cat)}
                  <span className="text-[11px] font-bold text-slate-800">
                    {CATEGORY_LABELS[cat].label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({compsInCat.length})
                  </span>
                </div>
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {/* Category Component Cards */}
              {!isCollapsed && (
                <div className="space-y-1.5 pl-1">
                  {compsInCat.map((comp) => (
                    <div
                      key={comp.typeId}
                      draggable
                      onDragStart={(e) => onDragStart(e, comp.typeId)}
                      onClick={() => addNode(comp.typeId)}
                      className="group/card relative p-2.5 rounded-lg border border-slate-200/90 bg-white hover:border-blue-400 hover:shadow-xs transition-all cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-start gap-2 min-w-0">
                          <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover/card:text-slate-500 mt-0.5 shrink-0" />
                          <div>
                            <h4 className="text-xs font-semibold text-slate-800 group-hover/card:text-blue-600 transition-colors truncate">
                              {comp.name}
                            </h4>
                            <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 leading-snug">
                              {comp.description}
                            </p>
                          </div>
                        </div>

                        {/* Add Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addNode(comp.typeId);
                          }}
                          title="Place on Canvas"
                          className="p-1 rounded bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 transition-colors shrink-0"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Specs pills */}
                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9px] font-mono text-slate-400">
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                          {comp.voltage}
                        </span>
                        <span className="text-slate-500 font-medium">
                          {comp.pins.length} Pin{comp.pins.length === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filteredComponents.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-400">
            No components match &ldquo;{search}&rdquo;
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-slate-200/90 bg-slate-50/70 text-[10px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1 font-mono">
          <HelpCircle className="w-3 h-3 text-slate-400" />
          Tip: Drag onto canvas
        </span>
        <span className="font-mono text-blue-600 font-semibold">Sprint 2 HAL</span>
      </div>
    </div>
  );
}
