import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useRealtime } from "@/lib/realtime";
import { DeviceCard } from "@/components/DeviceCard";
import type { Device, Room } from "@/lib/types";

export const Route = createFileRoute("/_app/rooms/$roomId")({
  component: RoomDetail,
});

function RoomDetail() {
  const { roomId } = Route.useParams();
  const [devices, setDevices] = useState<Device[]>([]);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [d, rooms] = await Promise.all([
      api.get<Device[]>(`/devices?room_id=${roomId}`),
      api.get<Room[]>("/rooms"),
    ]);
    setDevices(d);
    setRoom(rooms.find((r) => r.id === roomId) || null);
    setLoading(false);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useRealtime((e) => {
    if (e.type === "device.state" && e.device_id) {
      setDevices((ds) =>
        ds.map((d) =>
          d.id === e.device_id
            ? { ...d, last_state: { ...d.last_state, ...e.state } }
            : d,
        ),
      );
    }
  });

  if (loading)
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          to="/rooms"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Rooms
        </Link>
        <h1 className="mt-4 font-serif text-4xl">{room?.name}</h1>
        <p className="text-sm text-muted-foreground">
          {devices.length} device{devices.length !== 1 ? "s" : ""}
        </p>
      </div>

      {devices.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No devices in this room yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {devices.map((d) => (
            <DeviceCard
              key={d.id}
              device={d}
              onChange={(nd) =>
                setDevices((ds) => ds.map((x) => (x.id === nd.id ? nd : x)))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
