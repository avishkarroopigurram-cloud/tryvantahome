// DEV-ONLY: Realistic mock data for the Tryvanta preview mode.
// This module is gated by import.meta.env.VITE_PREVIEW_MODE so it has
// zero impact on production builds.
import type {
  Device,
  Room,
  Scene,
  Automation,
  Camera,
  User,
  Home,
  EnergySummary,
  HomeMember,
} from "@/lib/types";

// ── Identity ─────────────────────────────────────────────────────────────────

export const MOCK_USER: User = {
  id: "usr_demo_001",
  email: "alex@tryvanta.dev",
  full_name: "Alex Chen",
  is_active: true,
  is_superuser: false,
  email_verified: true,
};

export const MOCK_HOME: Home = {
  id: "home_demo_001",
  name: "The Chen Residence",
  timezone: "Asia/Kolkata",
  tariff_per_kwh: 7.5,
  currency: "INR",
};

// ── Rooms ─────────────────────────────────────────────────────────────────────

export const INITIAL_ROOMS: Room[] = [
  { id: "room-lr",  name: "Living Room",    kind: "living_room", icon: "living_room", order: 0, device_count: 5 },
  { id: "room-mb",  name: "Master Bedroom", kind: "bedroom",     icon: "bedroom",     order: 1, device_count: 3 },
  { id: "room-kit", name: "Kitchen",        kind: "kitchen",     icon: "kitchen",     order: 2, device_count: 2 },
  { id: "room-gar", name: "Garage",         kind: "garage",      icon: "garage",      order: 3, device_count: 2 },
  { id: "room-out", name: "Outdoor",        kind: "outdoor",     icon: "outdoor",     order: 4, device_count: 2 },
];

// ── Devices ───────────────────────────────────────────────────────────────────

const NOW = new Date().toISOString();

export const INITIAL_DEVICES: Device[] = [
  // Living Room ─────────────────────────────────────────────────
  {
    id: "dev-lr-light", dm_device_id: "esp32-aa11", name: "Ceiling Light",
    kind: "light", room_id: "room-lr",
    manufacturer: "Tryvanta", model: "TL-800", protocol: "esp32",
    capabilities: ["power", "brightness", "color_temp"],
    last_state: { power: true, brightness: 78, color_temp: 4000 },
    online: true, signal_percent: 92, battery_percent: null, latency_ms: 12,
    last_seen: NOW, is_favorite: true, order: 0,
  },
  {
    id: "dev-lr-fan", dm_device_id: "esp32-aa12", name: "Ceiling Fan",
    kind: "fan", room_id: "room-lr",
    manufacturer: "Tryvanta", model: "TF-400", protocol: "esp32",
    capabilities: ["power", "speed"],
    last_state: { power: true, speed: 40 },
    online: true, signal_percent: 88, battery_percent: null, latency_ms: 18,
    last_seen: NOW, is_favorite: false, order: 1,
  },
  {
    id: "dev-lr-ac", dm_device_id: "esp32-aa13", name: "AC",
    kind: "ac", room_id: "room-lr",
    manufacturer: "Daikin", model: "FTKG35", protocol: "ir_bridge",
    capabilities: ["power", "temperature", "mode"],
    last_state: { power: false, temperature: 24, mode: "cool" },
    online: true, signal_percent: 74, battery_percent: null, latency_ms: 45,
    last_seen: NOW, is_favorite: false, order: 2,
  },
  {
    id: "dev-lr-lamp", dm_device_id: "esp32-aa14", name: "Floor Lamp",
    kind: "light", room_id: "room-lr",
    manufacturer: "Tryvanta", model: "TL-200", protocol: "esp32",
    capabilities: ["power", "brightness"],
    last_state: { power: false, brightness: 50 },
    online: true, signal_percent: 81, battery_percent: null, latency_ms: 9,
    last_seen: NOW, is_favorite: false, order: 3,
  },
  {
    id: "dev-lr-motion", dm_device_id: "esp32-aa15", name: "Motion Sensor",
    kind: "motion_sensor", room_id: "room-lr",
    manufacturer: "Tryvanta", model: "TM-100", protocol: "esp32",
    capabilities: ["motion", "temperature", "humidity"],
    last_state: { motion: false, temperature: 26.4, humidity: 55 },
    online: true, signal_percent: 96, battery_percent: 73, latency_ms: 7,
    last_seen: NOW, is_favorite: false, order: 4,
  },
  // Master Bedroom ──────────────────────────────────────────────
  {
    id: "dev-mb-light", dm_device_id: "esp32-bb11", name: "Bedside Lamp",
    kind: "light", room_id: "room-mb",
    manufacturer: "Tryvanta", model: "TL-200", protocol: "esp32",
    capabilities: ["power", "brightness", "color_temp"],
    last_state: { power: false, brightness: 30, color_temp: 2700 },
    online: true, signal_percent: 85, battery_percent: null, latency_ms: 11,
    last_seen: NOW, is_favorite: false, order: 0,
  },
  {
    id: "dev-mb-fan", dm_device_id: "esp32-bb12", name: "Bedroom Fan",
    kind: "fan", room_id: "room-mb",
    manufacturer: "Tryvanta", model: "TF-400", protocol: "esp32",
    capabilities: ["power", "speed"],
    last_state: { power: true, speed: 60 },
    online: true, signal_percent: 79, battery_percent: null, latency_ms: 14,
    last_seen: NOW, is_favorite: false, order: 1,
  },
  {
    id: "dev-mb-ac", dm_device_id: "esp32-bb13", name: "Bedroom AC",
    kind: "ac", room_id: "room-mb",
    manufacturer: "Daikin", model: "FTKG25", protocol: "ir_bridge",
    capabilities: ["power", "temperature", "mode"],
    last_state: { power: false, temperature: 22, mode: "cool" },
    online: false, signal_percent: 42, battery_percent: null, latency_ms: null,
    last_seen: null, is_favorite: false, order: 2,
  },
  // Kitchen ─────────────────────────────────────────────────────
  {
    id: "dev-kit-light", dm_device_id: "esp32-cc11", name: "Under-cabinet Light",
    kind: "light", room_id: "room-kit",
    manufacturer: "Tryvanta", model: "TL-Strip", protocol: "esp32",
    capabilities: ["power", "brightness"],
    last_state: { power: false, brightness: 100 },
    online: true, signal_percent: 90, battery_percent: null, latency_ms: 8,
    last_seen: NOW, is_favorite: false, order: 0,
  },
  {
    id: "dev-kit-plug", dm_device_id: "esp32-cc12", name: "Coffee Machine",
    kind: "smart_plug", room_id: "room-kit",
    manufacturer: "Tryvanta", model: "TP-100", protocol: "esp32",
    capabilities: ["power"],
    last_state: { power: true },
    online: true, signal_percent: 93, battery_percent: null, latency_ms: 6,
    last_seen: NOW, is_favorite: true, order: 1,
  },
  // Garage ──────────────────────────────────────────────────────
  {
    id: "dev-gar-lock", dm_device_id: "esp32-dd11", name: "Garage Door",
    kind: "lock", room_id: "room-gar",
    manufacturer: "Tryvanta", model: "TK-200", protocol: "esp32",
    capabilities: ["lock", "state"],
    last_state: { locked: true, state: "closed" },
    online: true, signal_percent: 65, battery_percent: null, latency_ms: 22,
    last_seen: NOW, is_favorite: false, order: 0,
  },
  {
    id: "dev-gar-sensor", dm_device_id: "esp32-dd12", name: "Garage Sensor",
    kind: "motion_sensor", room_id: "room-gar",
    manufacturer: "Tryvanta", model: "TM-100", protocol: "esp32",
    capabilities: ["motion"],
    last_state: { motion: false },
    online: true, signal_percent: 70, battery_percent: 41, latency_ms: 15,
    last_seen: NOW, is_favorite: false, order: 1,
  },
  // Outdoor ─────────────────────────────────────────────────────
  {
    id: "dev-out-light", dm_device_id: "esp32-ee11", name: "Porch Light",
    kind: "light", room_id: "room-out",
    manufacturer: "Tryvanta", model: "TL-Outdoor", protocol: "esp32",
    capabilities: ["power"],
    last_state: { power: false },
    online: true, signal_percent: 55, battery_percent: null, latency_ms: 28,
    last_seen: NOW, is_favorite: false, order: 0,
  },
  {
    id: "dev-out-cam", dm_device_id: "esp32-ee12", name: "Front Camera",
    kind: "camera", room_id: "room-out",
    manufacturer: "Tryvanta", model: "TC-400", protocol: "rtsp",
    capabilities: ["video", "motion", "snapshot"],
    last_state: { recording: true, motion: false },
    online: true, signal_percent: 88, battery_percent: null, latency_ms: 35,
    last_seen: NOW, is_favorite: false, order: 1,
  },
];

// ── Scenes ────────────────────────────────────────────────────────────────────

export const INITIAL_SCENES: Scene[] = [
  {
    id: "scene-morning", name: "Morning", icon: "sun", color: "#f59e0b",
    is_favorite: true, order: 0,
    actions: [
      { device_id: "dev-lr-light", command: "turn_on", params: { brightness: 100, color_temp: 5500 } },
      { device_id: "dev-kit-plug", command: "turn_on", params: {} },
      { device_id: "dev-lr-fan",   command: "turn_on", params: { speed: 30 } },
    ],
  },
  {
    id: "scene-movie", name: "Movie Mode", icon: "film", color: "#6366f1",
    is_favorite: true, order: 1,
    actions: [
      { device_id: "dev-lr-light", command: "set_brightness", params: { brightness: 15, color_temp: 2700 } },
      { device_id: "dev-lr-lamp",  command: "turn_off", params: {} },
      { device_id: "dev-lr-fan",   command: "turn_on",  params: { speed: 20 } },
    ],
  },
  {
    id: "scene-goodnight", name: "Good Night", icon: "moon", color: "#8b5cf6",
    is_favorite: false, order: 2,
    actions: [
      { device_id: "dev-lr-light", command: "turn_off", params: {} },
      { device_id: "dev-lr-lamp",  command: "turn_off", params: {} },
      { device_id: "dev-lr-ac",    command: "turn_off", params: {} },
      { device_id: "dev-mb-ac",    command: "turn_on",  params: { temperature: 22 } },
      { device_id: "dev-gar-lock", command: "lock",     params: {} },
      { device_id: "dev-out-light",command: "turn_off", params: {} },
    ],
  },
  {
    id: "scene-away", name: "Away", icon: "shield", color: "#10b981",
    is_favorite: false, order: 3,
    actions: [
      { device_id: "dev-lr-light", command: "turn_off", params: {} },
      { device_id: "dev-lr-fan",   command: "turn_off", params: {} },
      { device_id: "dev-lr-ac",    command: "turn_off", params: {} },
      { device_id: "dev-gar-lock", command: "lock",     params: {} },
    ],
  },
];

// ── Automations ───────────────────────────────────────────────────────────────

export const INITIAL_AUTOMATIONS: Automation[] = [
  {
    id: "auto-001", name: "Porch light at sunset",
    enabled: true, trigger: { type: "sunset" }, conditions: [],
    actions: [{ device_id: "dev-out-light", command: "turn_on", params: {} }],
    cooldown_s: 3600, fire_count: 12,
  },
  {
    id: "auto-002", name: "Motion → Porch light",
    enabled: true, trigger: { type: "motion", device_id: "dev-gar-sensor" }, conditions: [],
    actions: [{ device_id: "dev-out-light", command: "turn_on", params: {} }],
    cooldown_s: 300, fire_count: 47,
  },
  {
    id: "auto-003", name: "Coffee at 7 AM (weekdays)",
    enabled: false,
    trigger: { type: "schedule", time: "07:00", days: ["mon","tue","wed","thu","fri"] },
    conditions: [],
    actions: [{ device_id: "dev-kit-plug", command: "turn_on", params: {} }],
    cooldown_s: 86400, fire_count: 89,
  },
];

// ── Cameras ───────────────────────────────────────────────────────────────────

export const MOCK_CAMERAS: Camera[] = [
  { id: "cam-001", name: "Front Door",   room_id: "room-out", online: true,  motion_detection: true,  recording: true  },
  { id: "cam-002", name: "Living Room",  room_id: "room-lr",  online: false, motion_detection: false, recording: false },
];

// ── Energy ────────────────────────────────────────────────────────────────────

function randomish(seed: number, range: number): number {
  // Deterministic-ish "random" so chart doesn't flicker on re-render.
  return ((Math.sin(seed * 9301 + 49297) * 233280) / 233280) * range;
}

function makeDay(): EnergySummary {
  const now = new Date();
  const points = Array.from({ length: 24 }, (_, h) => {
    const d = new Date(now);
    d.setHours(h, 0, 0, 0);
    const base = 0.3 + (h >= 7 && h <= 9 ? 1.2 : 0) + (h >= 18 && h <= 22 ? 1.8 : 0);
    const kwh = +(base * (0.85 + randomish(h, 0.3))).toFixed(3);
    return { bucket: d.toISOString(), kwh, cost: +(kwh * 7.5).toFixed(2), avg_watts: Math.round(kwh * 1000), peak_watts: Math.round(kwh * 1350) };
  });
  const total_kwh = +points.reduce((s, p) => s + p.kwh, 0).toFixed(2);
  return {
    period: "day", total_kwh, total_cost: +(total_kwh * 7.5).toFixed(2), currency: "INR", points,
    by_device: { "Ceiling Light": 1.2, "AC": 3.4, "Ceiling Fan": 0.8, "Coffee Machine": 0.4, "Porch Light": 0.3 },
    by_room:   { "Living Room": 5.1,   "Master Bedroom": 2.3, "Kitchen": 0.9, "Outdoor": 0.3 },
  };
}

function makeWeek(): EnergySummary {
  const now = new Date();
  const points = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const kwh = +(6 + randomish(i + 10, 6)).toFixed(2);
    return { bucket: d.toISOString(), kwh, cost: +(kwh * 7.5).toFixed(2), avg_watts: Math.round(kwh * 1000 / 24), peak_watts: Math.round(kwh * 1000 / 12) };
  });
  const total_kwh = +points.reduce((s, p) => s + p.kwh, 0).toFixed(2);
  return {
    period: "week", total_kwh, total_cost: +(total_kwh * 7.5).toFixed(2), currency: "INR", points,
    by_device: { "Ceiling Light": 8.4, "AC": 24.1, "Ceiling Fan": 5.6, "Coffee Machine": 2.8, "Porch Light": 2.1 },
    by_room:   { "Living Room": 35.7, "Master Bedroom": 16.1, "Kitchen": 6.3, "Outdoor": 2.1 },
  };
}

function makeMonth(): EnergySummary {
  const now = new Date();
  const points = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    d.setHours(0, 0, 0, 0);
    const kwh = +(6 + randomish(i + 50, 8)).toFixed(2);
    return { bucket: d.toISOString(), kwh, cost: +(kwh * 7.5).toFixed(2), avg_watts: Math.round(kwh * 1000 / 24), peak_watts: Math.round(kwh * 1000 / 12) };
  });
  const total_kwh = +points.reduce((s, p) => s + p.kwh, 0).toFixed(2);
  return {
    period: "month", total_kwh, total_cost: +(total_kwh * 7.5).toFixed(2), currency: "INR", points,
    by_device: { "Ceiling Light": 36, "AC": 103, "Ceiling Fan": 24, "Coffee Machine": 12, "Porch Light": 9 },
    by_room:   { "Living Room": 153, "Master Bedroom": 69, "Kitchen": 27, "Outdoor": 9 },
  };
}

export function getMockEnergy(period: string): EnergySummary {
  if (period === "week")  return makeWeek();
  if (period === "month") return makeMonth();
  return makeDay();
}

// ── Members ───────────────────────────────────────────────────────────────────

export const MOCK_MEMBERS: HomeMember[] = [];
