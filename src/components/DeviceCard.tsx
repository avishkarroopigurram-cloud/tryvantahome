// The core interactive control. Renders the right control surface for the
// device's capabilities. Optimistic UI with rollback on error.
import { useState } from "react";
import { Wifi, WifiOff, Battery, Signal } from "lucide-react";
import { toast } from "sonner";
import { DeviceIcon } from "./DeviceIcon";
import { api, ApiError } from "@/lib/api";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Device } from "@/lib/types";

export function DeviceCard({
  device,
  onChange,
  compact = false,
}: {
  device: Device;
  onChange?: (d: Device) => void;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState(device);
  const state = local.last_state || {};
  const isOn = !!state.power;
  const caps = new Set(local.capabilities);

  async function send(command: string, params: Record<string, any> = {}) {
    setBusy(true);
    const prev = local;
    try {
      const res = await api.post<{ state: Record<string, any> }>(
        `/devices/${local.id}/command`,
        { command, params },
      );
      const next = {
        ...local,
        last_state: { ...state, ...res.state },
        online: true,
      };
      setLocal(next);
      onChange?.(next);
    } catch (e) {
      setLocal(prev);
      const err = e as ApiError;
      toast.error(
        err.errorType === "unsupported_capability"
          ? `${local.name} can't do that`
          : err.message || "command failed",
      );
    } finally {
      setBusy(false);
    }
  }

  const toggle = () => send(isOn ? "turn_off" : "turn_on");
  const level = caps.has("brightness")
    ? state.brightness
    : caps.has("speed")
      ? state.speed
      : null;
  const levelKey = caps.has("brightness") ? "brightness" : "speed";
  const levelCmd = caps.has("brightness") ? "set_brightness" : "set_speed";

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 rounded-lg border bg-card p-4 transition-all",
        isOn && "border-primary/40 shadow-[0_0_0_1px_theme(colors.primary/20%)]",
        !local.online && "opacity-60",
        compact && "p-3 gap-2",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "grid h-10 w-10 place-items-center rounded-md transition-colors",
            isOn
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          <DeviceIcon name={local.kind} className="h-5 w-5" />
        </div>
        {caps.has("power") && local.kind !== "lock" && (
          <Switch
            checked={isOn}
            disabled={busy || !local.online}
            onCheckedChange={toggle}
          />
        )}
        {local.kind === "lock" && (
          <Button
            size="sm"
            variant={state.locked ? "outline" : "destructive"}
            disabled={busy || !local.online}
            onClick={() => send(state.locked ? "unlock" : "lock")}
          >
            {state.locked ? "Locked" : "Unlocked"}
          </Button>
        )}
      </div>

      <div>
        <div className="font-medium leading-tight tracking-tight">
          {local.name}
        </div>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
          {local.online ? (
            <span className="inline-flex items-center gap-1 text-emerald-600">
              <Wifi className="h-3 w-3" />
              online
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-destructive">
              <WifiOff className="h-3 w-3" />
              offline
            </span>
          )}
          {local.signal_percent != null && local.online && (
            <span className="inline-flex items-center gap-1">
              <Signal className="h-3 w-3" />
              {local.signal_percent}%
            </span>
          )}
          {local.battery_percent != null && (
            <span className="inline-flex items-center gap-1">
              <Battery className="h-3 w-3" />
              {local.battery_percent}%
            </span>
          )}
        </div>
      </div>

      {level != null && isOn && (
        <div className="flex items-center gap-3">
          <Slider
            value={[level]}
            min={0}
            max={100}
            step={1}
            disabled={busy}
            onValueChange={(v) =>
              setLocal({
                ...local,
                last_state: { ...state, [levelKey]: v[0] },
              })
            }
            onValueCommit={(v) => send(levelCmd, { value: v[0] })}
            className="flex-1"
          />
          <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
            {level}%
          </span>
        </div>
      )}

      {(state.temperature != null ||
        state.humidity != null ||
        state.motion != null) && (
        <div className="hairline flex gap-4 border-t pt-2 text-[11px] text-muted-foreground">
          {state.temperature != null && (
            <span className="tabular-nums">{state.temperature}°C</span>
          )}
          {state.humidity != null && (
            <span className="tabular-nums">{state.humidity}%RH</span>
          )}
          {state.motion != null && (
            <span className={state.motion ? "text-primary" : ""}>
              {state.motion ? "Motion" : "Clear"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
