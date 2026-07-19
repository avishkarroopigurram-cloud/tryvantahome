import {
  Lightbulb,
  Fan,
  ToggleLeft,
  Plug,
  Blinds,
  AirVent,
  Tv,
  Video,
  Lock,
  Activity,
  Home,
  Sofa,
  BedDouble,
  ChefHat,
  UtensilsCrossed,
  Bath,
  Car,
  Trees,
  Film,
  Moon,
  Sun,
  Zap,
  LayoutGrid,
  Layers,
  Cctv,
  Cpu,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  light: Lightbulb,
  fan: Fan,
  switch: ToggleLeft,
  socket: Plug,
  curtain: Blinds,
  ac: AirVent,
  tv: Tv,
  cctv: Cctv,
  lock: Lock,
  sensor: Activity,
  custom: Cpu,
  living_room: Sofa,
  bedroom: BedDouble,
  kitchen: ChefHat,
  dining: UtensilsCrossed,
  bathroom: Bath,
  garage: Car,
  outdoor: Trees,
  room: Home,
  film: Film,
  moon: Moon,
  sun: Sun,
  scene: Layers,
  group: LayoutGrid,
  energy: Zap,
  video: Video,
};

export function DeviceIcon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const C = MAP[name] || Cpu;
  return <C className={className} />;
}
