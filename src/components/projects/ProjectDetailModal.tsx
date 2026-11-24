'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SUPPORTED_BOARDS } from '@/lib/mock-data';
import {
  Cpu,
  Calendar,
  Layers,
  FileCode,
  Edit,
  ExternalLink,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

export function ProjectDetailModal() {
  const { viewingProject, setViewingProject, setEditingProject } = useAppStore();

  if (!viewingProject) return null;

  const boardSpec = SUPPORTED_BOARDS.find((b) => b.name === viewingProject.board);

  const handleEdit = () => {
    const proj = viewingProject;
    setViewingProject(null);
    setEditingProject(proj);
  };

  return (
    <Modal
      isOpen={!!viewingProject}
      onClose={() => setViewingProject(null)}
      title={viewingProject.name}
      subtitle={`Project ID: ${viewingProject.id} • Created ${new Date(viewingProject.createdAt).toLocaleDateString()}`}
      icon={<Cpu className="w-5 h-5 text-blue-600" />}
      maxWidth="lg"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            leftIcon={<Edit className="w-4 h-4" />}
            onClick={handleEdit}
          >
            Edit Metadata
          </Button>
          <Link href="/simulator" onClick={() => setViewingProject(null)}>
            <Button
              type="button"
              variant="primary"
              leftIcon={<ExternalLink className="w-4 h-4" />}
            >
              Open Simulator
            </Button>
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        {/* Status & Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="status" status={viewingProject.status} showDot>
            {viewingProject.status}
          </Badge>
          <Badge variant="category" category={viewingProject.category}>
            {viewingProject.category}
          </Badge>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-900 text-white">
            <Cpu className="w-3 h-3 text-blue-400" />
            {viewingProject.board}
          </span>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Description
          </h4>
          <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
            {viewingProject.description}
          </p>
        </div>

        {/* Target Board Specifications */}
        {boardSpec && (
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-blue-600" />
                Target Board Specifications: {boardSpec.name}
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                {boardSpec.family}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-mono">CPU Clock</span>
                <span className="font-semibold text-slate-800 font-mono">{boardSpec.clockSpeed}</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-mono">Flash Storage</span>
                <span className="font-semibold text-slate-800 font-mono">{boardSpec.flash}</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-mono">Operating Voltage</span>
                <span className="font-semibold text-slate-800 font-mono">{boardSpec.voltage}</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-mono">GPIO Count</span>
                <span className="font-semibold text-slate-800 font-mono">{boardSpec.gpioCount} Pins</span>
              </div>
            </div>
          </div>
        )}

        {/* Project Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center gap-3">
            <div className="p-2 rounded bg-blue-50 text-blue-600">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Components</span>
              <span className="text-xs font-semibold text-slate-800">
                {viewingProject.componentsCount || 4} Wired
              </span>
            </div>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center gap-3">
            <div className="p-2 rounded bg-indigo-50 text-indigo-600">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Firmware Code</span>
              <span className="text-xs font-semibold text-slate-800 font-mono">
                {viewingProject.linesOfCode || 180} LoC
              </span>
            </div>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center gap-3">
            <div className="p-2 rounded bg-emerald-50 text-emerald-600">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Last Modified</span>
              <span className="text-xs font-semibold text-slate-800">
                {new Date(viewingProject.lastModified).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {viewingProject.tags && viewingProject.tags.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Hardware Tags
            </span>
            <div className="flex flex-wrap gap-1.5">
              {viewingProject.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 border border-slate-200 font-mono"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
