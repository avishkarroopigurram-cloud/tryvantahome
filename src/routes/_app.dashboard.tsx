import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Power, Zap } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { RelayCard } from "@/components/RelayCard";
import { ESP32_BASE, setRelay, type RelayId } from "@/lib/esp32";
import type { ReactNode } from "react";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

// ─── Relay definitions ────────────────────────────────────────────────────────
interface Relay {
  id: RelayId;
  name: string;
  on: boolean;
  busy: boolean;
}

const INITIAL_RELAYS: Relay[] = [
  { id: 1, name: "Relay 1", on: false, busy: false },
  { id: 2, name: "Relay 2", on: false, busy: false },
  { id: 3, name: "Relay 3", on: false, busy: false },
  { id: 4, name: "Relay 4", on: false, busy: false },
];

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard() {
  const { home } = useAuth();
  const [relays, setRelays] = useState<Relay[]>(INITIAL_RELAYS);

  const activeCount = relays.filter((r) => r.on).length;

  /** Optimistic state flip — called immediately before the HTTP request. */
  function handleOptimistic(id: RelayId, nextOn: boolean) {
    setRelays((rs) =>
      rs.map((r) => (r.id === id ? { ...r, on: nextOn, busy: true } : r)),
    );
  }

  /** Settle — confirm or roll back the optimistic update. */
  function handleSettle(id: RelayId, confirmed: boolean) {
    setRelays((rs) =>
      rs.map((r) => {
        if (r.id !== id) return r;
        // On rollback, revert to the opposite of what we optimistically set.
        return confirmed ? { ...r, busy: false } : { ...r, on: !r.on, busy: false };
      }),
    );
  }

  /** Turn every active relay off. */
  async function allOff() {
    const active = relays.filter((r) => r.on);
    if (active.length === 0) return;

    // Optimistically flip them all off.
    setRelays((rs) => rs.map((r) => (r.on ? { ...r, on: false, busy: true } : r)));

    const results = await Promise.allSettled(
      active.map((r) => setRelay(r.id, "off")),
    );

    setRelays((rs) =>
      rs.map((r) => {
        if (!active.find((a) => a.id === r.id)) return r;
        const result = results[active.findIndex((a) => a.id === r.id)];
        if (result.status === "rejected") {
          // Rollback this relay.
          return { ...r, on: true, busy: false };
        }
        return { ...r, busy: false };
      }),
    );

    const failures = results.filter((r) => r.status === "rejected").length;
    if (failures > 0) {
      toast.error(`${failures} relay(s) did not respond`, {
        description: `Check ESP32 at ${ESP32_BASE}`,
      });
    } else {
      toast.success("All relays off");
    }
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {home?.name}
          </p>
          <h1 className="mt-2 font-serif text-4xl leading-tight md:text-5xl">
            Good to see you.
          </h1>
        </div>
      </header>

      {/* Stat cards */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={<Power className="h-4 w-4" />}
          label="Active"
          value={`${activeCount}/4`}
        />
        <StatCard
          icon={<Zap className="h-4 w-4" />}
          label="Devices"
          value={4}
        />
      </section>

      {/* Quick actions */}
      <section>
        <SectionTitle>Quick actions</SectionTitle>
        <div className="flex gap-3">
          <button
            onClick={allOff}
            disabled={activeCount === 0}
            className="flex min-w-[110px] flex-col items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-destructive/40 hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Power className="h-5 w-5 text-destructive" />
            <span className="text-xs">All Off</span>
          </button>
        </div>
      </section>

      {/* Relay grid */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-sm font-medium tracking-tight">
            ESP32 Relay Board
          </h2>
          <span className="text-xs text-muted-foreground">
            · {ESP32_BASE}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {relays.map((r) => (
            <RelayCard
              key={r.id}
              id={r.id}
              name={r.name}
              on={r.on}
              busy={r.busy}
              onOptimistic={handleOptimistic}
              onSettle={handleSettle}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
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

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
      {children}
    </h2>
  );
}
