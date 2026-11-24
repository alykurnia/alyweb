import React, { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { ProjectStatus, ProjectCategory } from '@/types/project';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'status' | 'category' | 'chip';
  status?: ProjectStatus;
  category?: ProjectCategory;
  showDot?: boolean;
}

export function Badge({
  className,
  variant = 'default',
  status,
  category,
  showDot = false,
  children,
  ...props
}: BadgeProps) {
  let styleClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  if (variant === 'status' && status) {
    switch (status) {
      case 'In Progress':
        styleClasses = 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/10';
        dotColor = 'bg-blue-500 animate-pulse';
        break;
      case 'Completed':
        styleClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/10';
        dotColor = 'bg-emerald-500';
        break;
      case 'Draft':
        styleClasses = 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/10';
        dotColor = 'bg-amber-500';
        break;
    }
  } else if (variant === 'category' && category) {
    switch (category) {
      case 'Smart Farming':
        styleClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        break;
      case 'Smart Home':
        styleClasses = 'bg-indigo-50 text-indigo-800 border-indigo-200';
        break;
      case 'Environmental Monitoring':
        styleClasses = 'bg-teal-50 text-teal-800 border-teal-200';
        break;
      case 'Robotics':
        styleClasses = 'bg-purple-50 text-purple-800 border-purple-200';
        break;
      case 'General IoT':
        styleClasses = 'bg-slate-100 text-slate-700 border-slate-200';
        break;
    }
  } else if (variant === 'outline') {
    styleClasses = 'bg-transparent text-slate-600 border-slate-300';
  } else if (variant === 'chip') {
    styleClasses = 'bg-slate-900 text-slate-100 border-slate-800 font-mono';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none transition-colors',
        styleClasses,
        className
      )}
      {...props}
    >
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColor)} />}
      {children || status || category}
    </span>
  );
}
