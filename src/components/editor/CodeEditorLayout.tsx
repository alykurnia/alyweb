'use client';

import React, { useEffect } from 'react';
import { EditorToolbar } from './EditorToolbar';
import { FileExplorer } from './FileExplorer';
import { MonacoEditorPane } from './MonacoEditorPane';
import { BottomPanel } from './BottomPanel';
import { useCodeEditorStore } from '@/stores/codeEditorStore';
import { useSimulationStore } from '@/stores/simulationStore';

export function CodeEditorLayout() {
  const { init } = useCodeEditorStore();
  const { initEngineListeners } = useSimulationStore();

  useEffect(() => {
    init();
    initEngineListeners();
  }, [init, initEngineListeners]);

  return (
    <div className="flex-1 h-screen flex flex-col bg-slate-950 overflow-hidden">
      {/* Top Engineering Toolbar */}
      <EditorToolbar />

      {/* Main Workstation Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Project File Explorer & Templates */}
        <FileExplorer />

        {/* Center & Bottom: Monaco Editor + Bottom Terminal Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Monaco Editor Pane */}
          <MonacoEditorPane />

          {/* Bottom Compilation / Serial / Problems Panel */}
          <BottomPanel />
        </div>
      </div>
    </div>
  );
}
