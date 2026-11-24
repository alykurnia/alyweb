'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { ComponentPin } from '@/types/circuit';
import { cn } from '@/lib/utils';

interface PinHandleProps {
  pin: ComponentPin;
  selected?: boolean;
}

export function getPinColor(pin: ComponentPin): { bg: string; border: string; ring: string; text: string } {
  switch (pin.type) {
    case 'power_vcc':
      return {
        bg: 'bg-rose-500',
        border: 'border-rose-600',
        ring: 'hover:ring-rose-400',
        text: 'text-rose-400',
      };
    case 'power_gnd':
      return {
        bg: 'bg-slate-900',
        border: 'border-slate-700',
        ring: 'hover:ring-slate-400',
        text: 'text-slate-400',
      };
    case 'gpio_digital':
    case 'gpio_pwm':
      return {
        bg: 'bg-amber-500',
        border: 'border-amber-600',
        ring: 'hover:ring-amber-400',
        text: 'text-amber-400',
      };
    case 'gpio_analog':
      return {
        bg: 'bg-blue-500',
        border: 'border-blue-600',
        ring: 'hover:ring-blue-400',
        text: 'text-blue-400',
      };
    case 'comm_i2c':
    case 'comm_spi':
    case 'comm_uart':
    case 'comm_onewire':
      return {
        bg: 'bg-emerald-500',
        border: 'border-emerald-600',
        ring: 'hover:ring-emerald-400',
        text: 'text-emerald-400',
      };
    case 'passive':
    default:
      return {
        bg: 'bg-purple-500',
        border: 'border-purple-600',
        ring: 'hover:ring-purple-400',
        text: 'text-purple-400',
      };
  }
}

export function PinHandle({ pin }: PinHandleProps) {
  const colors = getPinColor(pin);
  const isLeft = pin.position === 'left';
  const isRight = pin.position === 'right';
  const isTop = pin.position === 'top';
  const isBottom = pin.position === 'bottom';

  const reactFlowPos = isLeft
    ? Position.Left
    : isRight
    ? Position.Right
    : isTop
    ? Position.Top
    : Position.Bottom;

  return (
    <div
      className={cn(
        'group relative flex items-center gap-1.5 z-10',
        isLeft && 'flex-row',
        isRight && 'flex-row-reverse',
        isTop && 'flex-col',
        isBottom && 'flex-col-reverse'
      )}
      title={`${pin.name} (${pin.voltage} • ${pin.type.replace('_', ' ')} • ${pin.description || ''})`}
    >
      {/* Container for overlapping target/source handles */}
      <div className="relative flex items-center justify-center w-3.5 h-3.5">
        {/* Target handle for receiving wires */}
        <Handle
          type="target"
          position={reactFlowPos}
          id={pin.id}
          className={cn(
            '!w-3.5 !h-3.5 !rounded-full !border-2 !transition-transform !duration-150',
            colors.bg,
            colors.border,
            'hover:scale-125 !z-20 cursor-crosshair shadow-xs ring-1 ring-white/50'
          )}
        />
        {/* Source handle for initiating wires */}
        <Handle
          type="source"
          position={reactFlowPos}
          id={pin.id}
          className={cn(
            '!w-3.5 !h-3.5 !rounded-full !border-2 !transition-transform !duration-150 !opacity-0 !z-30 cursor-crosshair'
          )}
        />
      </div>

      {/* Pin Name Label */}
      <span
        className={cn(
          'text-[9px] font-mono font-medium tracking-tight whitespace-nowrap select-none transition-colors pointer-events-none',
          colors.text,
          'group-hover:text-white font-bold'
        )}
      >
        {pin.name}
      </span>
    </div>
  );
}
