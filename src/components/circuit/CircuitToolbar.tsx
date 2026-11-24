'use client';

import React, { useRef } from 'react';
import { useCircuitStore } from '@/stores/circuitStore';
import { useReactFlow } from '@xyflow/react';
import { Button } from '@/components/ui/Button';
import { CIRCUIT_TEMPLATES } from '@/lib/circuit-templates';
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Magnet,
  Trash2,
  Save,
  Download,
  Upload,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function CircuitToolbar() {
  const {
    projectName,
    setProjectName,
    undo,
    redo,
    history,
    showGrid,
    toggleGrid,
    snapToGrid,
    toggleSnap,
    deleteSelected,
    selectedNode,
    selectedEdge,
    saveToStorage,
    exportJSON,
    importJSON,
    clearCircuit,
    loadTemplate,
    setNotification,
  } = useCircuitStore();

  const reactFlow = useReactFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;
  const hasSelection = !!selectedNode || !!selectedEdge;

  const handleZoomIn = () => reactFlow.zoomIn({ duration: 200 });
  const handleZoomOut = () => reactFlow.zoomOut({ duration: 200 });
  const handleFitView = () => reactFlow.fitView({ padding: 0.2, duration: 300 });

  const handleExportJSON = () => {
    const jsonStr = exportJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}-circuit.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotification({
      type: 'success',
      message: `Exported circuit JSON file: ${a.download}`,
    });
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importJSON(content);
      if (!res.success) {
        setNotification({
          type: 'error',
          message: res.error || 'Failed to import JSON.',
        });
      } else {
        setTimeout(() => handleFitView(), 100);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="h-13 bg-white border-b border-slate-200/90 px-4 flex items-center justify-between gap-3 shadow-2xs select-none">
      {/* Left: Project Name & Template Selector */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
            Circuit:
          </span>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="text-xs font-bold text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-200 focus:border-blue-500 rounded px-2 py-1 max-w-[200px] sm:max-w-[260px] truncate transition-colors"
            title="Edit Project Name"
          />
        </div>

        {/* Template Quick Loader */}
        <div className="hidden md:flex items-center gap-1.5 border-l border-slate-200 pl-3">
          <span className="text-[10px] text-slate-400 font-medium">Template:</span>
          <select
            onChange={(e) => {
              if (e.target.value) {
                loadTemplate(e.target.value);
                setTimeout(() => handleFitView(), 50);
              }
            }}
            defaultValue=""
            className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="" disabled>
              Load Preset Template...
            </option>
            {CIRCUIT_TEMPLATES.map((tmpl) => (
              <option key={tmpl.id} value={tmpl.id}>
                {tmpl.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Center: Undo / Redo & Zoom & View controls */}
      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/90 rounded-lg p-0.5">
        <button
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className="p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-200 my-auto mx-0.5" />

        <button
          onClick={handleZoomIn}
          title="Zoom In (Ctrl +)"
          className="p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out (Ctrl -)"
          className="p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleFitView}
          title="Fit View to Screen"
          className="p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-200 my-auto mx-0.5" />

        <button
          onClick={toggleGrid}
          title="Toggle Grid Lines"
          className={cn(
            'p-1.5 rounded transition-colors',
            showGrid ? 'bg-white text-blue-600 shadow-2xs font-semibold' : 'text-slate-500 hover:bg-white'
          )}
        >
          <Grid className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={toggleSnap}
          title="Toggle Snap to Grid (15px)"
          className={cn(
            'p-1.5 rounded transition-colors',
            snapToGrid ? 'bg-white text-blue-600 shadow-2xs font-semibold' : 'text-slate-500 hover:bg-white'
          )}
        >
          <Magnet className="w-3.5 h-3.5" />
        </button>

        {/* Delete Selection */}
        <button
          onClick={deleteSelected}
          disabled={!hasSelection}
          title="Delete Selected (Delete/Backspace)"
          className="p-1.5 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Storage, Clear, Export, Import */}
      <div className="flex items-center gap-1.5">
        {/* Hidden File Input for JSON Import */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".json,application/json"
          onChange={handleImportFile}
          className="hidden"
        />

        <Button
          size="xs"
          variant="outline"
          leftIcon={<Upload className="w-3 h-3 text-slate-500" />}
          onClick={() => fileInputRef.current?.click()}
          title="Import Circuit JSON"
          className="hidden sm:inline-flex text-xs"
        >
          Import
        </Button>

        <Button
          size="xs"
          variant="outline"
          leftIcon={<Download className="w-3 h-3 text-slate-500" />}
          onClick={handleExportJSON}
          title="Export Circuit JSON"
          className="hidden sm:inline-flex text-xs"
        >
          Export
        </Button>

        <Button
          size="xs"
          variant="secondary"
          leftIcon={<RotateCcw className="w-3 h-3 text-slate-500" />}
          onClick={() => {
            if (confirm('Clear entire circuit workspace? This will remove all placed components and wires.')) {
              clearCircuit();
            }
          }}
          title="Clear Canvas"
          className="text-xs"
        >
          Clear
        </Button>

        <Button
          size="xs"
          variant="primary"
          leftIcon={<Save className="w-3.5 h-3.5" />}
          onClick={saveToStorage}
          title="Save Circuit to Local Storage"
          className="text-xs font-semibold shadow-xs"
        >
          Save
        </Button>
      </div>
    </div>
  );
}
