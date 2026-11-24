'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { BoardType, ProjectCategory, ProjectStatus } from '@/types/project';
import { Edit3, Check } from 'lucide-react';

const BOARD_OPTIONS: { value: BoardType; label: string }[] = [
  { value: 'ESP32 DevKit V1', label: 'ESP32 DevKit V1 (240MHz, Wi-Fi & BLE, 30 GPIO)' },
  { value: 'ESP32-C3 Super Mini', label: 'ESP32-C3 Super Mini (RISC-V 160MHz, BLE 5)' },
  { value: 'ESP8266 NodeMCU', label: 'ESP8266 NodeMCU (Tensilica 80MHz, Wi-Fi)' },
  { value: 'Wemos D1 Mini', label: 'Wemos D1 Mini (Compact ESP8266, 9 GPIO)' },
  { value: 'Arduino Uno', label: 'Arduino Uno (ATmega328P 16MHz, 14 GPIO, 5V)' },
  { value: 'Arduino Nano', label: 'Arduino Nano (ATmega328P, Breadboard Form)' },
];

const CATEGORY_OPTIONS: { value: ProjectCategory; label: string }[] = [
  { value: 'Smart Farming', label: 'Smart Farming' },
  { value: 'Smart Home', label: 'Smart Home' },
  { value: 'Environmental Monitoring', label: 'Environmental Monitoring' },
  { value: 'Robotics', label: 'Robotics' },
  { value: 'General IoT', label: 'General IoT' },
];

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Completed', label: 'Completed' },
];

export function EditProjectModal() {
  const { editingProject, setEditingProject, updateProject } = useAppStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [board, setBoard] = useState<BoardType>('ESP32 DevKit V1');
  const [category, setCategory] = useState<ProjectCategory>('Smart Farming');
  const [status, setStatus] = useState<ProjectStatus>('In Progress');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name);
      setDescription(editingProject.description);
      setBoard(editingProject.board);
      setCategory(editingProject.category);
      setStatus(editingProject.status);
      setError('');
    }
  }, [editingProject]);

  if (!editingProject) return null;

  const handleClose = () => {
    setEditingProject(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    updateProject(editingProject.id, {
      name: name.trim(),
      description: description.trim(),
      board,
      category,
      status,
    });
  };

  return (
    <Modal
      isOpen={!!editingProject}
      onClose={handleClose}
      title="Edit Project Metadata"
      subtitle={`Refine metadata for ${editingProject.name}`}
      icon={<Edit3 className="w-5 h-5 text-blue-600" />}
      maxWidth="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            leftIcon={<Check className="w-4 h-4" />}
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </>
      }
    >
      <form onSubmit={handleSave} className="space-y-4">
        <Input
          label="Project Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
          }}
          error={error}
          required
        />

        <Textarea
          label="Project Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Microcontroller Board"
            value={board}
            onChange={(e) => setBoard(e.target.value as BoardType)}
            options={BOARD_OPTIONS}
          />

          <Select
            label="Project Category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ProjectCategory)}
            options={CATEGORY_OPTIONS}
          />
        </div>

        <Select
          label="Project Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          options={STATUS_OPTIONS}
        />
      </form>
    </Modal>
  );
}
