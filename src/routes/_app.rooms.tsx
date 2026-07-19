import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { DeviceIcon } from "@/components/DeviceIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Room } from "@/lib/types";

export const Route = createFileRoute("/_app/rooms")({
  component: RoomsPage,
});

const KINDS: Array<[string, string]> = [
  ["living_room", "Living Room"],
  ["bedroom", "Bedroom"],
  ["kitchen", "Kitchen"],
  ["dining", "Dining"],
  ["bathroom", "Bathroom"],
  ["garage", "Garage"],
  ["outdoor", "Outdoor"],
];

function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState("living_room");

  async function load() {
    try {
      setRooms(await api.get<Room[]>("/rooms"));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!name.trim()) return;
    try {
      await api.post("/rooms", { name, kind, icon: kind });
      setName("");
      setAdding(false);
      toast.success("Room added");
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Spaces
          </p>
          <h1 className="mt-2 font-serif text-4xl">Rooms</h1>
        </div>
        <Button
          variant={adding ? "outline" : "default"}
          onClick={() => setAdding(!adding)}
        >
          <Plus className="mr-2 h-4 w-4" />
          {adding ? "Cancel" : "Add room"}
        </Button>
      </header>

      {adding && (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
          <Input
            placeholder="Room name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KINDS.map(([k, l]) => (
                <SelectItem key={k} value={k}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={add}>Create room</Button>
        </div>
      )}

      {loading ? (
        <div className="grid min-h-[30vh] place-items-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
          No rooms yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((r) => (
            <Link
              key={r.id}
              to="/rooms/$roomId"
              params={{ roomId: r.id }}
              className="group flex items-center gap-4 rounded-lg border border-border bg-card p-5 transition-all hover:border-foreground/20 hover:shadow-sm"
            >
              <div className="grid h-12 w-12 place-items-center rounded-md bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
                <DeviceIcon name={r.icon} className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{r.name}</div>
                <div className="text-xs text-muted-foreground">
                  {r.device_count} device{r.device_count !== 1 ? "s" : ""}
                </div>
              </div>
              <span className="text-xs text-muted-foreground group-hover:text-foreground">
                →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
