import { BoardType } from './project';

export interface BoardSpec {
  id: string;
  name: BoardType;
  family: 'ESP32' | 'ESP8266' | 'Arduino';
  chipset: string;
  clockSpeed: string;
  flash: string;
  connectivity: string[];
  voltage: string;
  gpioCount: number;
  analogPins: number;
  description: string;
  color: string;
  badge: string;
  pinoutPreviewUrl?: string;
}

export interface QuickAccessItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  href?: string;
  action?: string;
  badge?: string;
}
