// Auth-gated layout. Every child route requires an access token.
import {
  createFileRoute,
  Outlet,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { tokens } from "@/lib/api";

export const Route = createFileRoute("/_app")({
  ssr: false,
  component: AppGate,
});

function AppGate() {
  const { user, loading, backendOffline } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // No token, no attempt.
    if (!loading && !tokens.access) {
      navigate({ to: "/login", replace: true });
    }
    // Had a token but bootstrap cleared it (e.g. 401).
    if (!loading && tokens.access && !user && !backendOffline) {
      navigate({ to: "/login", replace: true });
    }
  }, [loading, user, backendOffline, navigate]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tokens.access) return null;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
