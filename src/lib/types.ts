// Type contracts — match the FastAPI schemas in backend/app/schemas/*.
export interface Device {
  id: string;
  dm_device_id: string;
  name: string;
  kind: string;
  room_id: string | null;
  manufacturer: string;
  model: string;
  protocol: string;
  capabilities: string[];
  last_state: Record<string, any>;
  online: boolean;
  signal_percent: number | null;
  battery_percent: number | null;
  latency_ms: number | null;
  last_seen: string | null;
  is_favorite: boolean;
  order: number;
}
export interface Room {
  id: string;
  name: string;
  kind: string;
  icon: string;
  order: number;
  device_count: number;
}
export interface SceneAction {
  device_id: string;
  command: string;
  params: Record<string, any>;
}
export interface Scene {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_favorite: boolean;
  order: number;
  actions: SceneAction[];
}
export interface Automation {
  id: string;
  name: string;
  enabled: boolean;
  trigger: any;
  conditions: any[];
  actions: any[];
  cooldown_s: number;
  fire_count: number;
}
export interface EnergyPoint {
  bucket: string;
  kwh: number;
  cost: number;
  avg_watts: number;
  peak_watts: number;
}
export interface EnergySummary {
  period: string;
  total_kwh: number;
  total_cost: number;
  currency: string;
  points: EnergyPoint[];
  by_device: Record<string, number>;
  by_room: Record<string, number>;
}
export interface Camera {
  id: string;
  name: string;
  room_id: string | null;
  online: boolean;
  motion_detection: boolean;
  recording: boolean;
}
export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
  email_verified: boolean;
}
export interface Home {
  id: string;
  name: string;
  timezone: string;
  tariff_per_kwh: number;
  currency: string;
}
export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}
export interface HomeMember {
  home_id?: string;
  user_id?: string;
  role: string;
}
