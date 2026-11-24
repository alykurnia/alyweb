import { create } from 'zustand';
import { Project, BoardType, ProjectCategory, ProjectStatus } from '@/types/project';
import { INITIAL_PROJECTS } from './mock-data';

const STORAGE_KEY = 'iot_lab_projects_v1';

interface ProjectInput {
  name: string;
  description: string;
  board: BoardType;
  category: ProjectCategory;
  status?: ProjectStatus;
  tags?: string[];
}

interface AppState {
  projects: Project[];
  isLoaded: boolean;
  
  // UI States
  isCreateModalOpen: boolean;
  selectedBoardForNewProject?: BoardType;
  editingProject: Project | null;
  deletingProjectId: string | null;
  viewingProject: Project | null;
  isMobileSidebarOpen: boolean;
  activeWorkspaceId: string;
  globalSearchQuery: string;
  
  // Actions
  loadProjects: () => void;
  createProject: (input: ProjectInput) => Project;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  resetProjects: () => void;
  
  // UI Setters
  setCreateModalOpen: (open: boolean) => void;
  openCreateModalWithBoard: (board?: BoardType) => void;
  setEditingProject: (project: Project | null) => void;
  setDeletingProjectId: (id: string | null) => void;
  setViewingProject: (project: Project | null) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setActiveWorkspaceId: (id: string) => void;
  setGlobalSearchQuery: (query: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  projects: [],
  isLoaded: false,
  isCreateModalOpen: false,
  selectedBoardForNewProject: undefined,
  editingProject: null,
  deletingProjectId: null,
  viewingProject: null,
  isMobileSidebarOpen: false,
  activeWorkspaceId: 'ws-1',
  globalSearchQuery: '',

  loadProjects: () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          set({ projects: parsed, isLoaded: true });
          return;
        }
      }
      // Seed with initial projects
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
      set({ projects: INITIAL_PROJECTS, isLoaded: true });
    } catch {
      set({ projects: INITIAL_PROJECTS, isLoaded: true });
    }
  },

  createProject: (input: ProjectInput) => {
    const newProject: Project = {
      id: `proj-${Date.now().toString(36)}`,
      name: input.name.trim(),
      description: input.description.trim() || 'No description provided.',
      board: input.board,
      category: input.category,
      status: input.status || 'In Progress',
      lastModified: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      tags: input.tags || [input.board.split(' ')[0], input.category],
      componentsCount: 1,
      linesOfCode: 42,
    };

    const updatedProjects = [newProject, ...get().projects];
    set({ projects: updatedProjects, isCreateModalOpen: false, selectedBoardForNewProject: undefined });

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
    }
    return newProject;
  },

  updateProject: (id: string, data: Partial<Project>) => {
    const updatedProjects = get().projects.map((p) =>
      p.id === id
        ? {
            ...p,
            ...data,
            lastModified: new Date().toISOString(),
          }
        : p
    );
    set({ projects: updatedProjects, editingProject: null });

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
      } catch (e) {
        console.error('Failed to update localStorage:', e);
      }
    }
  },

  deleteProject: (id: string) => {
    const updatedProjects = get().projects.filter((p) => p.id !== id);
    set({ projects: updatedProjects, deletingProjectId: null });

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
      } catch (e) {
        console.error('Failed to remove from localStorage:', e);
      }
    }
  },

  resetProjects: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
    }
    set({ projects: INITIAL_PROJECTS });
  },

  setCreateModalOpen: (open: boolean) => {
    set({
      isCreateModalOpen: open,
      selectedBoardForNewProject: open ? get().selectedBoardForNewProject : undefined,
    });
  },

  openCreateModalWithBoard: (board?: BoardType) => {
    set({
      isCreateModalOpen: true,
      selectedBoardForNewProject: board,
    });
  },

  setEditingProject: (project: Project | null) => set({ editingProject: project }),
  setDeletingProjectId: (id: string | null) => set({ deletingProjectId: id }),
  setViewingProject: (project: Project | null) => set({ viewingProject: project }),
  setMobileSidebarOpen: (open: boolean) => set({ isMobileSidebarOpen: open }),
  setActiveWorkspaceId: (id: string) => set({ activeWorkspaceId: id }),
  setGlobalSearchQuery: (query: string) => set({ globalSearchQuery: query }),
}));
