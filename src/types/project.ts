export type ProjectCategory =
  | 'Smart Farming'
  | 'Smart Home'
  | 'Environmental Monitoring'
  | 'Robotics'
  | 'General IoT';

export type ProjectStatus = 'In Progress' | 'Draft' | 'Completed';

export type BoardType =
  | 'ESP32 DevKit V1'
  | 'ESP32-C3 Super Mini'
  | 'ESP8266 NodeMCU'
  | 'Wemos D1 Mini'
  | 'Arduino Uno'
  | 'Arduino Nano';

export interface Project {
  id: string;
  name: string;
  description: string;
  board: BoardType;
  category: ProjectCategory;
  status: ProjectStatus;
  lastModified: string;
  createdAt: string;
  tags?: string[];
  componentsCount?: number;
  linesOfCode?: number;
}

export type ViewMode = 'grid' | 'list';
