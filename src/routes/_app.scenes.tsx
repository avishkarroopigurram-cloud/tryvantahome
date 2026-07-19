import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Play, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { DeviceIcon } from "@/components/DeviceIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Device, Scene } from "@/lib/types";

export const Route = createFileRoute("/_app/scenes")({
  component: ScenesPage,
});

function ScenesPage() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<Record<string, boolean>>({});

  async function load() {
    try {
      const [s, d] = await Promise.all([
        api.get<Scene[]>("/scenes"),
        api.get<Device[]>("/devices"),
      ]);
      setScenes(s);
      setDevices(d);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function activate(s: Scene) {
    try {
      const r = await api.post<{ ok: boolean }>(`/scenes/${s.id}/activate`);
      if (r.ok) toast.success(`${s.name} activated`);
      else toast.warning(`${s.name} partially applied`);
    } catch {
      toast.error("Failed");
    }
  }

  async function create() {
    if (!name.trim()) return;
    const actions = Object.keys(picked)
      .filter((id) => picked[id])
      .map((device_id) => ({
        device_id,
        command: "turn_on",
        params: {},
      }));
    if (actions.length === 0) {
      toast.error("Pick at least one device");
      return;
    }
    try {
      await api.post("/scenes", { name, actions });
      setName("");
      setPicked({});
      setCreating(false);
      toast.success("Scene created");
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  }

  async function remove(id: string) {
    await api.del(`/scenes/${id}`);
    toast.success("Deleted");
    load();
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            One-tap moods
          </p>
          <h1 className="mt-2 font-serif text-4xl">Scenes</h1>
        </div>
        <Button
          variant={creating ? "outline" : "default"}
          onClick={() => setCreating(!creating)}
        >
          <Plus className="mr-2 h-4 w-4" />
          {creating ? "Cancel" : "New scene"}
        </Button>
      </header>

      {creating && (
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
          <div className="flex flex-col gap-1.5">
            <Label>Scene name</Label>
            <Input
              placeholder="e.g. Movie Mode"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-2 block">
              Turn on these devices
            </Label>
            <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              {devices.map((d) => (
                <label
                  key={d.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md border border-border bg-background p-2.5 hover:bg-muted"
                >
                  <Checkbox
                    checked={!!picked[d.id]}
                    onCheckedChange={(v) =>
                      setPicked((p) => ({ ...p, [d.id]: !!v }))
                    }
                  />
                  <DeviceIcon
                    name={d.kind}
                    className="h-4 w-4 text-muted-foreground"
                  />
                  <span className="truncate text-sm">{d.name}</span>
                </label>
              ))}
            </div>
          </div>
          <Button onClick={create}>Create scene</Button>
        </div>
      )}

      {loading ? (
        <div className="grid min-h-[30vh] place-items-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : scenes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
          No scenes yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {scenes.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
            >
              <div
                className="grid h-11 w-11 place-items-center rounded-md"
                style={{ background: `${s.color}18`, color: s.color }}
              >
                <DeviceIcon name={s.icon} className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground">
                  {s.actions.length} action
                  {s.actions.length !== 1 ? "s" : ""}
                </div>
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={() => activate(s)}
                aria-label="Activate"
              >
                <Play className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => remove(s.id)}
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
