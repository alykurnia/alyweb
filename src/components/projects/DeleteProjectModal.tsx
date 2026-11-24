'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Trash2 } from 'lucide-react';

export function DeleteProjectModal() {
  const { deletingProjectId, setDeletingProjectId, deleteProject, projects } = useAppStore();

  const targetProject = projects.find((p) => p.id === deletingProjectId);

  if (!targetProject) return null;

  const handleClose = () => {
    setDeletingProjectId(null);
  };

  const handleConfirmDelete = () => {
    deleteProject(targetProject.id);
  };

  return (
    <Modal
      isOpen={!!deletingProjectId}
      onClose={handleClose}
      title="Delete Project Confirmation"
      subtitle="This action permanently removes this project from your workspace."
      icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
      maxWidth="sm"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            leftIcon={<Trash2 className="w-4 h-4" />}
            onClick={handleConfirmDelete}
          >
            Delete Project
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-slate-700 leading-relaxed">
          Are you sure you want to delete{' '}
          <strong className="text-slate-900 font-semibold">&ldquo;{targetProject.name}&rdquo;</strong>?
        </p>
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
          <p className="font-semibold mb-1">Target Hardware: {targetProject.board}</p>
          <p className="text-rose-700">
            Associated schematic configurations, sensor mappings, and code files will be erased.
          </p>
        </div>
      </div>
    </Modal>
  );
}
