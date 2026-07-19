import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { DeviceCard } from "@/components/DeviceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Device, Room } from "@/lib/types";

export const Route = createFileRoute("/_app/devices/$deviceId")({
  component: DeviceDetail,
});

function DeviceDetail() {
  const { deviceId } = Route.useParams();
  const [device, setDevice] = useState<Device | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [d, r] = await Promise.all([
      api.get<Device>(`/devices/${deviceId}`),
      api.get<Room[]>("/rooms"),
    ]);
    setDevice(d);
    setRooms(r);
    setLoading(false);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  async function patch(body: Partial<Device>) {
    try {
      const updated = await api.patch<Device>(`/devices/${deviceId}`, body);
      setDevice(updated);
      toast.success("Saved");
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  }

  if (loading || !device)
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Home
      </Link>

      <DeviceCard device={device} onChange={setDevice} />

      <div className="flex flex-col gap-5 rounded-lg border border-border bg-card p-6">
        <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Settings
        </h2>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            defaultValue={device.name}
            onBlur={(e) =>
              e.target.value !== device.name &&
              patch({ name: e.target.value })
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="room">Room</Label>
          <Select
            value={device.room_id || "__none"}
            onValueChange={(v) =>
              patch({ room_id: v === "__none" ? null : v })
            }
          >
            <SelectTrigger id="room">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">Unassigned</SelectItem>
              {rooms.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>Favorite</Label>
            <p className="text-xs text-muted-foreground">
              Pin to the top of Home
            </p>
          </div>
          <Switch
            checked={device.is_favorite}
            onCheckedChange={(v) => patch({ is_favorite: v })}
          />
        </div>
        <div className="hairline space-y-1 border-t pt-4 text-xs text-muted-foreground">
          <div>
            ID:{" "}
            <span className="font-mono text-foreground">
              {device.dm_device_id}
            </span>
          </div>
          <div>
            {device.protocol} · {device.manufacturer} {device.model}
          </div>
          <div>Capabilities: {device.capabilities.join(", ") || "—"}</div>
        </div>
      </div>
    </div>
  );
}
