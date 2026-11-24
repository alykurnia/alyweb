'use client';

import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { ViewMode, ProjectCategory, BoardType, ProjectStatus } from '@/types/project';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectTable } from '@/components/projects/ProjectTable';
import { ProjectFilters } from '@/components/projects/ProjectFilters';
import { Button } from '@/components/ui/Button';
import { Plus, FolderKanban, RotateCcw } from 'lucide-react';

export default function MyProjectsPage() {
  const {
    projects,
    openCreateModalWithBoard,
    globalSearchQuery,
    setGlobalSearchQuery,
    resetProjects,
  } = useAppStore();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<ProjectCategory | 'All'>('All');
  const [boardFilter, setBoardFilter] = useState<BoardType | 'All'>('All');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'status'>('recent');

  // Compute status counts for the filter pills
  const counts = useMemo(() => {
    return {
      all: projects.length,
      inProgress: projects.filter((p) => p.status === 'In Progress').length,
      draft: projects.filter((p) => p.status === 'Draft').length,
      completed: projects.filter((p) => p.status === 'Completed').length,
    };
  }, [projects]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Search query filter (combines globalSearchQuery and local search)
    if (globalSearchQuery.trim()) {
      const q = globalSearchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.board.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((tag) => tag.toLowerCase().includes(q)))
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter((p) => p.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'All') {
      result = result.filter((p) => p.category === categoryFilter);
    }

    // Board filter
    if (boardFilter !== 'All') {
      result = result.filter((p) => p.board === boardFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      }
      // 'recent' default
      return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
    });

    return result;
  }, [projects, globalSearchQuery, statusFilter, categoryFilter, boardFilter, sortBy]);

  const handleResetFilters = () => {
    setGlobalSearchQuery('');
    setStatusFilter('All');
    setCategoryFilter('All');
    setBoardFilter('All');
    setSortBy('recent');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              My Projects
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {projects.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage your microcontroller codebases, circuit schematics, and sensor pinout configs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={() => {
              if (confirm('Reset projects to default sample data?')) {
                resetProjects();
              }
            }}
            title="Reset to default mock projects"
            className="text-xs"
          >
            Reset Demo Data
          </Button>

          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => openCreateModalWithBoard()}
            className="text-xs font-semibold"
          >
            Create Project
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <ProjectFilters
        searchQuery={globalSearchQuery}
        onSearchChange={setGlobalSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        boardFilter={boardFilter}
        onBoardChange={setBoardFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onResetFilters={handleResetFilters}
        counts={counts}
      />

      {/* Projects Display: Grid or Table */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <FolderKanban className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">No matching projects found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, status filters, or board categories.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Button size="xs" variant="secondary" onClick={handleResetFilters}>
              Clear All Filters
            </Button>
            <Button
              size="xs"
              variant="primary"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => openCreateModalWithBoard()}
            >
              Create New Project
            </Button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <ProjectTable projects={filteredProjects} />
      )}
    </div>
  );
}
