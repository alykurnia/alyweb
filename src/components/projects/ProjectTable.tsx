'use client';

import React from 'react';
import { Project } from '@/types/project';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatRelativeTime } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { Cpu, Edit2, Trash2, ExternalLink } from 'lucide-react';

interface ProjectTableProps {
  projects: Project[];
}

export function ProjectTable({ projects }: ProjectTableProps) {
  const { setViewingProject, setEditingProject, setDeletingProjectId } = useAppStore();

  if (projects.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
        <p className="text-sm text-slate-500">No projects match the selected criteria.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4">Project Name & Info</th>
              <th className="py-3 px-4">Target Board</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Last Modified</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map((project) => (
              <tr
                key={project.id}
                className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                onClick={() => setViewingProject(project)}
              >
                {/* Name & Description */}
                <td className="py-3.5 px-4 min-w-[240px]">
                  <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {project.name}
                  </div>
                  <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {project.description}
                  </div>
                </td>

                {/* Target Board */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-slate-50 border border-slate-200 px-2 py-1 rounded text-slate-700">
                    <Cpu className="w-3 h-3 text-blue-600 shrink-0" />
                    <span>{project.board}</span>
                  </div>
                </td>

                {/* Category */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <Badge variant="category" category={project.category}>
                    {project.category}
                  </Badge>
                </td>

                {/* Status */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <Badge variant="status" status={project.status} showDot>
                    {project.status}
                  </Badge>
                </td>

                {/* Last Modified */}
                <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                  {formatRelativeTime(project.lastModified)}
                </td>

                {/* Actions */}
                <td
                  className="py-3.5 px-4 text-right whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setViewingProject(project)}
                      title="Inspect project details"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setEditingProject(project)}
                      title="Edit metadata"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setDeletingProjectId(project.id)}
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
