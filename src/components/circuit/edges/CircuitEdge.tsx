'use client';

import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
} from '@xyflow/react';
import type { CircuitEdge, CircuitEdgeData } from '@/types/circuit';
import { useCircuitStore } from '@/stores/circuitStore';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CircuitEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data,
}: EdgeProps<CircuitEdge>) {
  const { deleteEdge, setSelectedEdge, edges } = useCircuitStore();
  const edgeData = (data || {}) as CircuitEdgeData;

  const wireColor = edgeData.wireColor || '#64748B';
  const hasWarning = !!edgeData.warning;

  // Use smooth step or bezier path for clean PCB jumper routing
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.25,
  });

  return (
    <>
      {/* Outer Glow / Selection Ring */}
      {selected && (
        <path
          d={edgePath}
          fill="none"
          stroke={hasWarning ? '#F59E0B' : '#38BDF8'}
          strokeWidth={6}
          strokeOpacity={0.4}
          className="pointer-events-none animate-pulse"
        />
      )}

      {/* Main Wire Physical Stroke */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: wireColor,
          strokeWidth: selected ? 3.5 : 2.5,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          filter: selected ? 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' : undefined,
        }}
        markerEnd={markerEnd}
      />

      {/* Interactive Middle Wire Badge & Delete Button */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              const thisEdge = edges.find((item) => item.id === id) || null;
              setSelectedEdge(thisEdge);
            }}
            className={cn(
              'group flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-medium shadow-md transition-all cursor-pointer border',
              selected
                ? 'bg-slate-900 text-white border-blue-400 ring-2 ring-blue-400/30 scale-110'
                : 'bg-white/95 text-slate-800 border-slate-300 hover:border-slate-400 hover:scale-105'
            )}
          >
            {hasWarning && (
              <AlertTriangle className="w-2.5 h-2.5 text-amber-500 animate-bounce" />
            )}
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: wireColor }}
            />
            <span className="truncate max-w-[80px]">
              {edgeData.sourcePinName || 'Pin'} &rarr; {edgeData.targetPinName || 'Pin'}
            </span>

            {/* Delete wire button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteEdge(id);
              }}
              title="Remove wire"
              className="p-0.5 rounded-full hover:bg-rose-100 hover:text-rose-600 text-slate-400 transition-colors ml-0.5"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
