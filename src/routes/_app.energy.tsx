import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
} from "recharts";
import { Zap, TrendingUp, Loader2, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EnergySummary } from "@/lib/types";

export const Route = createFileRoute("/_app/energy")({
  component: EnergyPage,
});

const PERIODS = ["day", "week", "month"] as const;
const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function EnergyPage() {
  const { home } = useAuth();
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("day");
  const [data, setData] = useState<EnergySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<EnergySummary>(`/energy/summary?period=${period}`)
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [period, home?.id]);

  const cur =
    data?.currency === "INR"
      ? "₹"
      : data?.currency === "USD"
        ? "$"
        : data?.currency === "EUR"
          ? "€"
          : data?.currency || "";

  const fmtBucket = (b: string) => {
    const d = new Date(b);
    return period === "day"
      ? d.getHours() + ":00"
      : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };
  const chartData =
    data?.points.map((p) => ({ ...p, label: fmtBucket(p.bucket) })) || [];
  const roomData = Object.entries(data?.by_room || {}).map(([name, kwh]) => ({
    name,
    kwh,
  }));

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Consumption
          </p>
          <h1 className="mt-2 font-serif text-4xl">Energy</h1>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
          <TabsList>
            {PERIODS.map((p) => (
              <TabsTrigger key={p} value={p} className="capitalize">
                {p}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </header>

      {loading ? (
        <div className="grid min-h-[40vh] place-items-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MetricCard
              icon={<Zap className="h-4 w-4" />}
              label="Total"
              value={`${(data?.total_kwh ?? 0).toFixed(2)} kWh`}
            />
            <MetricCard
              icon={<Wallet className="h-4 w-4" />}
              label="Cost"
              value={`${cur}${(data?.total_cost ?? 0).toFixed(2)}`}
            />
            <MetricCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Peak"
              value={`${Math.max(0, ...chartData.map((c) => c.peak_watts)).toFixed(0)} W`}
            />
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Consumption · {period}
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="ea" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="var(--color-border)"
                />
                <XAxis
                  dataKey="label"
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="kwh"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#ea)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </section>

          {roomData.length > 0 && (
            <section className="rounded-lg border border-border bg-card p-5">
              <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                By room
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={roomData}
                  margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--color-border)"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-background)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="kwh" radius={[4, 4, 0, 0]}>
                    {roomData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </section>
          )}

          {Object.keys(data?.by_device || {}).length > 0 && (
            <section className="rounded-lg border border-border bg-card p-5">
              <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Top devices
              </h2>
              <ul className="divide-y divide-border">
                {Object.entries(data!.by_device)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8)
                  .map(([name, kwh]) => (
                    <li
                      key={name}
                      className="flex items-center justify-between py-2.5 text-sm"
                    >
                      <span>{name}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {kwh.toFixed(2)} kWh
                      </span>
                    </li>
                  ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-5">
      <span className="grid h-8 w-8 place-items-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="font-serif text-3xl leading-tight tabular-nums">
        {value}
      </div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
