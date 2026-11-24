'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { BoardType, ProjectCategory, ProjectStatus } from '@/types/project';
import { Cpu, Plus } from 'lucide-react';
import { SUPPORTED_BOARDS } from '@/lib/mock-data';

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

export function CreateProjectModal() {
  const { isCreateModalOpen, setCreateModalOpen, createProject, selectedBoardForNewProject } =
    useAppStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [board, setBoard] = useState<BoardType>('ESP32 DevKit V1');
  const [category, setCategory] = useState<ProjectCategory>('Smart Farming');
  const [status, setStatus] = useState<ProjectStatus>('In Progress');
  const [errors, setErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    if (selectedBoardForNewProject) {
      setBoard(selectedBoardForNewProject);
    }
  }, [selectedBoardForNewProject]);

  const handleClose = () => {
    setName('');
    setDescription('');
    setErrors({});
    setCreateModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { name?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Project name is required';
    } else if (name.trim().length < 3) {
      newErrors.name = 'Project name must be at least 3 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    createProject({
      name: name.trim(),
      description: description.trim(),
      board,
      category,
      status,
    });

    handleClose();
  };

  const selectedBoardSpec = SUPPORTED_BOARDS.find((b) => b.name === board);

  return (
    <Modal
      isOpen={isCreateModalOpen}
      onClose={handleClose}
      title="Create New IoT Project"
      subtitle="Configure target microcontroller architecture and workspace domain."
      icon={<Cpu className="w-5 h-5 text-blue-600" />}
      maxWidth="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleSubmit}
          >
            Create Project
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Project Name */}
        <Input
          label="Project Name"
          placeholder="e.g., Smart Irrigation Monitor"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors({});
          }}
          error={errors.name}
          required
          autoFocus
        />

        {/* Project Description */}
        <Textarea
          label="Project Description"
          placeholder="Briefly describe sensors, actuators, and communication protocols..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          helperText="Optional technical notes or requirements for this hardware build."
        />

        {/* Board Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Microcontroller Board"
            value={board}
            onChange={(e) => setBoard(e.target.value as BoardType)}
            required
            options={BOARD_OPTIONS}
          />

          <Select
            label="Project Category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ProjectCategory)}
            required
            options={CATEGORY_OPTIONS}
          />
        </div>

        {/* Initial Status */}
        <Select
          label="Initial Project Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          options={[
            { value: 'In Progress', label: 'In Progress (Active Work)' },
            { value: 'Draft', label: 'Draft (Planning & Schematic)' },
            { value: 'Completed', label: 'Completed (Ready for Deployment)' },
          ]}
        />

        {/* Selected Board Preview Spec Box */}
        {selectedBoardSpec && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                Target: {selectedBoardSpec.name}
              </span>
              <span className="font-mono text-[10px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                {selectedBoardSpec.voltage}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mb-2">{selectedBoardSpec.description}</p>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 font-mono text-[10px] text-slate-500">
              <div>
                CPU: <span className="text-slate-700">{selectedBoardSpec.clockSpeed}</span>
              </div>
              <div>
                Flash: <span className="text-slate-700">{selectedBoardSpec.flash}</span>
              </div>
              <div>
                GPIOs: <span className="text-slate-700">{selectedBoardSpec.gpioCount} Pins</span>
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
