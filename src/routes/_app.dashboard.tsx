import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Power, Activity, Wifi, Loader2, RefreshCw } from "lucide-react";
import { api, ApiError, NetworkError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRealtime } from "@/lib/realtime";
import { DeviceCard } from "@/components/DeviceCard";
import { DeviceIcon } from "@/components/DeviceIcon";
import { Button } from "@/components/ui/button";
import type { Device, Room, Scene } from "@/lib/types";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { home } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      const [d, r, s] = await Promise.all([
        api.get<Device[]>("/devices"),
        api.get<Room[]>("/rooms"),
        api.get<Scene[]>("/scenes"),
      ]);
      setDevices(d);
      setRooms(r);
      setScenes(s);
    } catch (e) {
      if (e instanceof NetworkError) setError("Cannot reach the backend.");
      else setError((e as ApiError).message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [home?.id]);

  useRealtime((e) => {
    if (e.type === "device.state" && e.device_id) {
      setDevices((ds) =>
        ds.map((d) =>
          d.id === e.device_id
            ? {
                ...d,
                last_state: { ...d.last_state, ...e.state },
                online: true,
              }
            : d,
        ),
      );
    } else if (["discovery.complete", "device.updated"].includes(e.type)) {
      load();
    }
  });

  const stats = useMemo(
    () => ({
      online: devices.filter((d) => d.online).length,
      on: devices.filter((d) => d.last_state?.power).length,
      total: devices.length,
    }),
    [devices],
  );

  async function runScene(id: string, name: string) {
    try {
      await api.post(`/scenes/${id}/activate`);
      toast.success(`${name} activated`);
    } catch {
      toast.error("Scene failed");
    }
  }

  async function allOff() {
    await Promise.allSettled(
      devices
        .filter((d) => d.last_state?.power)
        .map((d) =>
          api.post(`/devices/${d.id}/command`, { command: "turn_off" }),
        ),
    );
    toast.success("Turning everything off");
    load();
  }

  async function discover() {
    try {
      await api.post("/devices/discover");
      toast.success("Discovery started");
      setTimeout(load, 2000);
    } catch {
      toast.error("Discovery failed");
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const byRoom = rooms.map((r) => ({
    room: r,
    items: devices.filter((d) => d.room_id === r.id),
  }));
  const unassigned = devices.filter((d) => !d.room_id);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {home?.name}
          </p>
          <h1 className="mt-2 font-serif text-4xl leading-tight md:text-5xl">
            Good to see you.
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </header>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={<Wifi className="h-4 w-4" />}
          label="Online"
          value={`${stats.online}/${stats.total}`}
        />
        <StatCard
          icon={<Power className="h-4 w-4" />}
          label="Active"
          value={stats.on}
        />
        <StatCard
          icon={<Activity className="h-4 w-4" />}
          label="Devices"
          value={stats.total}
        />
        <StatCard
          icon={<span className="font-serif italic">S</span>}
          label="Scenes"
          value={scenes.length}
        />
      </section>

      {scenes.length > 0 && (
        <section>
          <SectionTitle>Quick actions</SectionTitle>
          <div className="flex gap-3 overflow-x-auto pb-2">
            <button
              onClick={allOff}
              className="flex min-w-[110px] flex-col items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-destructive/40 hover:bg-destructive/5"
            >
              <Power className="h-5 w-5 text-destructive" />
              <span className="text-xs">All Off</span>
            </button>
            {scenes.map((s) => (
              <button
                key={s.id}
                onClick={() => runScene(s.id, s.name)}
                className="flex min-w-[110px] flex-col items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <div
                  className="grid h-8 w-8 place-items-center rounded-md"
                  style={{ background: `${s.color}18`, color: s.color }}
                >
                  <DeviceIcon name={s.icon} className="h-4 w-4" />
                </div>
                <span className="whitespace-nowrap text-xs">{s.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {byRoom
        .filter((g) => g.items.length)
        .map(({ room, items }) => (
          <section key={room.id}>
            <div className="mb-4 flex items-center gap-2">
              <DeviceIcon name={room.icon} className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium tracking-tight">
                {room.name}
              </h2>
              <span className="text-xs text-muted-foreground">
                · {items.length}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((d) => (
                <DeviceCard
                  key={d.id}
                  device={d}
                  onChange={(nd) =>
                    setDevices((ds) =>
                      ds.map((x) => (x.id === nd.id ? nd : x)),
                    )
                  }
                />
              ))}
            </div>
          </section>
        ))}

      {unassigned.length > 0 && (
        <section>
          <SectionTitle>Unassigned</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {unassigned.map((d) => (
              <DeviceCard key={d.id} device={d} />
            ))}
          </div>
        </section>
      )}

      {devices.length === 0 && !error && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
          <p className="font-serif text-2xl">No devices yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Scan the network for compatible Tryvanta hardware.
          </p>
          <Button className="mt-6" onClick={discover}>
            Discover devices
          </Button>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
      <span className="grid h-8 w-8 place-items-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="font-serif text-2xl leading-none">{value}</div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
      {children}
    </h2>
  );
}
