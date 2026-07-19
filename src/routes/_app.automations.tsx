import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Workflow, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Automation, Device } from "@/lib/types";

export const Route = createFileRoute("/_app/automations")({
  component: AutomationsPage,
});

const TRIGGERS: Array<[string, string]> = [
  ["motion", "Motion detected"],
  ["temperature", "Temperature"],
  ["humidity", "Humidity"],
  ["schedule", "Time schedule"],
  ["sunrise", "Sunrise"],
  ["sunset", "Sunset"],
  ["device_state", "Device state"],
];

function AutomationsPage() {
  const [autos, setAutos] = useState<Automation[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState("motion");
  const [triggerDevice, setTriggerDevice] = useState("");
  const [actionDevice, setActionDevice] = useState("");
  const [actionCmd, setActionCmd] = useState("turn_on");

  async function load() {
    try {
      const [a, d] = await Promise.all([
        api.get<Automation[]>("/automations"),
        api.get<Device[]>("/devices"),
      ]);
      setAutos(a);
      setDevices(d);
      if (d[0]) {
        setTriggerDevice(d[0].id);
        setActionDevice(d[0].id);
      }
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function create() {
    if (!name.trim() || !actionDevice) return;
    const trigger: any = { type: triggerType };
    if (triggerType === "device_state") trigger.device_id = triggerDevice;
    if (["temperature", "humidity"].includes(triggerType))
      trigger.condition = { op: "gt", value: 30 };
    try {
      await api.post("/automations", {
        name,
        trigger,
        conditions: [],
        actions: [{ device_id: actionDevice, command: actionCmd, params: {} }],
      });
      setName("");
      setCreating(false);
      toast.success("Automation created");
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  }
  async function toggle(a: Automation) {
    try {
      await api.post(`/automations/${a.id}/toggle`);
      setAutos((xs) =>
        xs.map((x) => (x.id === a.id ? { ...x, enabled: !x.enabled } : x)),
      );
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  }
  async function remove(id: string) {
    await api.del(`/automations/${id}`);
    toast.success("Deleted");
    load();
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            When → Then
          </p>
          <h1 className="mt-2 font-serif text-4xl">Automations</h1>
        </div>
        <Button
          variant={creating ? "outline" : "default"}
          onClick={() => setCreating(!creating)}
        >
          <Plus className="mr-2 h-4 w-4" />
          {creating ? "Cancel" : "New"}
        </Button>
      </header>

      {creating && (
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input
              placeholder="e.g. Hallway light at dusk"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>When</Label>
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {triggerType === "device_state" && devices.length > 0 && (
                <Select
                  value={triggerDevice}
                  onValueChange={setTriggerDevice}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Then</Label>
              <Select value={actionDevice} onValueChange={setActionDevice}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={actionCmd} onValueChange={setActionCmd}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="turn_on">Turn on</SelectItem>
                  <SelectItem value="turn_off">Turn off</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={create}>Create automation</Button>
        </div>
      )}

      {loading ? (
        <div className="grid min-h-[30vh] place-items-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : autos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
          No automations yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {autos.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
            >
              <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                <Workflow className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{a.name}</div>
                <div className="text-xs text-muted-foreground">
                  When {a.trigger.type} → {a.actions.length} action
                  {a.actions.length !== 1 ? "s" : ""} · fired {a.fire_count}×
                </div>
              </div>
              <Switch
                checked={a.enabled}
                onCheckedChange={() => toggle(a)}
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => remove(a.id)}
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
