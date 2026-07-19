import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ApiError, NetworkError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  ssr: false,
  component: LoginPage,
});

function LoginPage() {
  const { login, register, user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("demo@tryvanta.local");
  const [password, setPassword] = useState("TryvantaDemo123");
  const [fullName, setFullName] = useState("");
  const [homeName, setHomeName] = useState("My Home");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password, fullName, homeName);
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      if (err instanceof NetworkError) {
        toast.error("Backend unreachable", {
          description: `Cannot reach ${import.meta.env.VITE_API_BASE || "the API"}. Is the FastAPI service running?`,
        });
      } else {
        toast.error(
          (err as ApiError).message || "Authentication failed",
        );
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-foreground p-10 text-background md:flex">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-background text-foreground text-xs font-bold">
            T
          </span>
          <span className="font-serif text-lg">Tryvanta Home</span>
        </div>
        <div>
          <p className="font-serif text-4xl leading-tight md:text-5xl">
            One dashboard.{" "}
            <span className="italic text-primary">Every device.</span>
          </p>
          <p className="mt-6 max-w-sm text-sm text-background/60">
            Multi-tenant control over the Tryvanta Device Manager and ESP32
            firmware — lights, energy, cameras, automations, and GENESIS voice.
          </p>
        </div>
        <p className="text-xs text-background/40">
          © {new Date().getFullYear()} Tryvanta
        </p>
      </aside>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {mode === "login" ? "Welcome back" : "Create an account"}
          </p>
          <h1 className="mt-2 font-serif text-4xl leading-tight">
            {mode === "login" ? "Sign in" : "Get started"}
          </h1>

          <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
            {mode === "register" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={10}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
              />
            </div>
            {mode === "register" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="homeName">Home name</Label>
                <Input
                  id="homeName"
                  value={homeName}
                  onChange={(e) => setHomeName(e.target.value)}
                  required
                />
              </div>
            )}
            <Button
              type="submit"
              size="lg"
              className="mt-2 rounded-md"
              disabled={busy}
            >
              {busy
                ? "Please wait…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </Button>
            <button
              type="button"
              onClick={() =>
                setMode(mode === "login" ? "register" : "login")
              }
              className="mt-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {mode === "login"
                ? "Need an account? Register →"
                : "Have an account? Sign in →"}
            </button>
          </form>

          <p className="mt-10 text-xs text-muted-foreground">
            Demo credentials:{" "}
            <code className="text-foreground">demo@tryvanta.local</code> /{" "}
            <code className="text-foreground">TryvantaDemo123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
