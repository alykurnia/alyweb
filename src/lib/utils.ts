import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ProjectStatus, ProjectCategory, BoardType } from '@/types/project';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 172800) return 'Yesterday';
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return dateString;
  }
}

export function getStatusBadgeStyle(status: ProjectStatus): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (status) {
    case 'In Progress':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
      };
    case 'Completed':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'Draft':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
      };
    default:
      return {
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
      };
  }
}

export function getCategoryBadgeStyle(category: ProjectCategory): string {
  switch (category) {
    case 'Smart Farming':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Smart Home':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Environmental Monitoring':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'Robotics':
      return 'bg-violet-50 text-violet-700 border-violet-200';
    case 'General IoT':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function getBoardColor(board: BoardType): { tag: string; chipBg: string } {
  if (board.includes('ESP32')) {
    return { tag: 'ESP32', chipBg: 'bg-rose-50 text-rose-700 border-rose-200' };
  }
  if (board.includes('ESP8266') || board.includes('Wemos')) {
    return { tag: 'ESP8266', chipBg: 'bg-sky-50 text-sky-700 border-sky-200' };
  }
  return { tag: 'Arduino', chipBg: 'bg-cyan-50 text-cyan-800 border-cyan-200' };
}
