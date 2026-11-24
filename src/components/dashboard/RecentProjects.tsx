'use client';

import React from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/lib/utils';
import {
  FolderKanban,
  ArrowRight,
  Cpu,
  Clock,
  ExternalLink,
  Plus,
} from 'lucide-react';

export function RecentProjects() {
  const { projects, setViewingProject, openCreateModalWithBoard } = useAppStore();

  // Pick top 4 recent projects
  const recentList = projects.slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
            <FolderKanban className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Projects</h2>
            <p className="text-xs text-slate-500">Your most active hardware builds and active prototypes</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="xs"
            variant="ghost"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => openCreateModalWithBoard()}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            New Project
          </Button>

          <Link href="/projects">
            <Button
              size="xs"
              variant="secondary"
              rightIcon={<ArrowRight className="w-3 h-3" />}
              className="text-xs font-medium text-slate-700 hover:text-slate-900"
            >
              View All
            </Button>
          </Link>
        </div>
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {recentList.map((project) => (
          <Card
            key={project.id}
            hoverable
            onClick={() => setViewingProject(project)}
            className="group flex flex-col justify-between border-slate-200/90 hover:border-blue-300 transition-all shadow-xs"
          >
            <div className="p-4 sm:p-5">
              {/* Header: Badges */}
              <div className="flex items-center justify-between gap-1 mb-2.5">
                <Badge variant="status" status={project.status} showDot>
                  {project.status}
                </Badge>
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatRelativeTime(project.lastModified)}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 tracking-tight">
                {project.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {project.description}
              </p>

              {/* Target Board Tag */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                  <Cpu className="w-3 h-3 text-blue-600 shrink-0" />
                  <span className="truncate max-w-[130px]">{project.board}</span>
                </div>
                <Badge variant="category" category={project.category} className="text-[10px] py-0 px-2">
                  {project.category}
                </Badge>
              </div>
            </div>

            {/* Footer Action */}
            <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 rounded-b-xl flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                HAL: Active
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewingProject(project);
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group/btn"
              >
                <span>Open Project</span>
                <ExternalLink className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
