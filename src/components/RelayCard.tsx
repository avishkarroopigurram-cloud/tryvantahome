// Relay toggle card — talks directly to the ESP32 over HTTP.
// Optimistic UI: state flips immediately; rolls back with a toast on failure.
import { Power } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { setRelay, ESP32_BASE, type RelayId } from "@/lib/esp32";

interface RelayCardProps {
  id: RelayId;
  name: string;
  on: boolean;
  busy: boolean;
  /** Called with the intended next state before the HTTP request fires (optimistic). */
  onOptimistic: (id: RelayId, nextOn: boolean) => void;
  /** Called when the HTTP request settles — pass true to confirm, false to rollback. */
  onSettle: (id: RelayId, confirmed: boolean) => void;
}

export function RelayCard({
  id,
  name,
  on,
  busy,
  onOptimistic,
  onSettle,
}: RelayCardProps) {
  async function toggle() {
    if (busy) return;
    const nextOn = !on;
    onOptimistic(id, nextOn);
    try {
      await setRelay(id, nextOn ? "on" : "off");
      onSettle(id, true);
    } catch (err) {
      onSettle(id, false);
      toast.error(`Relay ${id} unreachable`, {
        description: `Cannot reach ESP32 at ${ESP32_BASE}. Check power and network.`,
      });
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-card p-4 transition-all",
        on && "border-primary/40 shadow-[0_0_0_1px_theme(colors.primary/20%)]",
        busy && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "grid h-10 w-10 place-items-center rounded-md transition-colors",
            on
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Power className="h-5 w-5" />
        </div>
        <Switch checked={on} disabled={busy} onCheckedChange={toggle} />
      </div>

      <div>
        <div className="font-medium leading-tight tracking-tight">{name}</div>
        <div className="mt-1 text-[11px]">
          {on ? (
            <span className="text-emerald-600">On</span>
          ) : (
            <span className="text-muted-foreground">Off</span>
          )}
        </div>
      </div>
    </div>
  );
}
