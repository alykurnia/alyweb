'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Project } from '@/types/project';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatRelativeTime } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import {
  Cpu,
  Clock,
  MoreVertical,
  ExternalLink,
  Edit2,
  Trash2,
  Layers,
  Code2,
} from 'lucide-react';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { setViewingProject, setEditingProject, setDeletingProjectId } = useAppStore();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <Card hoverable className="group flex flex-col justify-between relative">
      <div>
        {/* Card Header */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <Badge variant="status" status={project.status} showDot>
              {project.status}
            </Badge>
            <Badge variant="category" category={project.category}>
              {project.category}
            </Badge>
          </div>

          {/* Action Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!isMenuOpen);
              }}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
              aria-label="Project actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 animate-in fade-in-50 zoom-in-95">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    setViewingProject(project);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  <span>Inspect Details</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    setEditingProject(project);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Edit Metadata</span>
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    setDeletingProjectId(project.id);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Delete Project</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Card Content */}
        <div className="px-5 py-3">
          <h3
            onClick={() => setViewingProject(project)}
            className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer tracking-tight"
          >
            {project.name}
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
            {project.description}
          </p>

          {/* Microcontroller Specs Chip */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 font-mono text-[11px] bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-md">
              <Cpu className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-medium truncate max-w-[150px]">{project.board}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <span className="flex items-center gap-1" title="Connected components">
                <Layers className="w-3 h-3" />
                {project.componentsCount || 4}
              </span>
              <span className="flex items-center gap-1" title="Firmware code lines">
                <Code2 className="w-3 h-3" />
                {project.linesOfCode || 120}L
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 rounded-b-xl flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Clock className="w-3 h-3" />
          <span>{formatRelativeTime(project.lastModified)}</span>
        </div>

        <Button
          size="xs"
          variant="secondary"
          rightIcon={<ExternalLink className="w-3 h-3" />}
          onClick={() => setViewingProject(project)}
          className="hover:border-blue-300 hover:text-blue-600"
        >
          Open
        </Button>
      </div>
    </Card>
  );
}
