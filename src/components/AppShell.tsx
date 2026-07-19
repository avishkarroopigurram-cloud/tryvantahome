// App shell: editorial sidebar on desktop, bottom nav on mobile.
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { type ReactNode } from "react";
// DEV-ONLY: preview banner — renders nothing when VITE_PREVIEW_MODE is unset.
import { DevPreviewBanner } from "@/components/DevPreviewBanner";
import {
  LayoutDashboard,
  DoorOpen,
  Zap,
  Workflow,
  Layers,
  Video,
  Settings as SettingsIcon,
  LogOut,
  Mic,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV: Array<{
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}> = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/rooms", label: "Rooms", icon: DoorOpen },
  { to: "/energy", label: "Energy", icon: Zap },
  { to: "/automations", label: "Automations", icon: Workflow },
  { to: "/scenes", label: "Scenes", icon: Layers },
  { to: "/cameras", label: "Cameras", icon: Video },
  { to: "/genesis", label: "GENESIS", icon: Sparkles },
];

const MOBILE_NAV = NAV.slice(0, 5);

export function AppShell({ children }: { children: ReactNode }) {
  const { home, homes, switchHome, logout, backendOffline } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  const isActive = (to: string, end?: boolean) =>
    end ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-sidebar px-4 py-6 md:flex">
        <Link
          to="/dashboard"
          className="mb-8 flex items-center gap-2 px-2"
        >
          <span className="grid h-8 w-8 place-items-center rounded-md bg-foreground text-background text-sm font-bold">
            T
          </span>
          <span className="font-serif text-xl leading-none">Tryvanta</span>
        </Link>

        {homes.length > 1 && home && (
          <Select
            value={home.id}
            onValueChange={(v) => switchHome(v)}
          >
            <SelectTrigger className="mb-4 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {homes.map((h) => (
                <SelectItem key={h.id} value={h.id}>
                  {h.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <nav className="flex flex-col gap-0.5">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive(n.to, n.end)
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-0.5 pt-4">
          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              isActive("/settings")
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <SettingsIcon className="h-4 w-4" />
            Settings
          </Link>
          <button
            onClick={async () => {
              await logout();
              navigate({ to: "/login" });
            }}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:hidden">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-foreground text-background text-xs font-bold">
            T
          </span>
          <span className="text-sm font-medium">{home?.name || "Tryvanta"}</span>
        </Link>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => navigate({ to: "/genesis" })}
          aria-label="Open GENESIS"
        >
          <Mic className="h-4 w-4" />
        </Button>
      </header>

      <main className="min-w-0 flex-1 px-4 pb-24 pt-6 md:px-10 md:pb-10 md:pt-10">
        {/* DEV-ONLY: renders nothing when VITE_PREVIEW_MODE is unset */}
        <DevPreviewBanner />
        {backendOffline && (
          <div className="mb-6 rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
            <span className="font-medium">Backend offline.</span>{" "}
            <span className="text-muted-foreground">
              Cannot reach the Tryvanta API at{" "}
              <code className="text-foreground">{import.meta.env.VITE_API_BASE || "same origin"}</code>. Live data will resume automatically.
            </span>
          </div>
        )}
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-border bg-background/95 py-2 backdrop-blur md:hidden">
        {MOBILE_NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-medium",
              isActive(n.to, n.end)
                ? "text-primary"
                : "text-muted-foreground",
            )}
          >
            <n.icon className="h-5 w-5" />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
