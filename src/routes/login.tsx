import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  ssr: false,
  component: LoginPage,
});

function LoginPage() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      const msg = (err as Error).message || "Authentication failed";
      // Show "Access denied" prominently; other errors as a standard toast.
      if (msg.toLowerCase().includes("access denied") || msg.toLowerCase().includes("not authorised")) {
        toast.error("Access denied", {
          description: "This email address is not authorised to access Tryvanta Home.",
        });
      } else {
        toast.error(msg);
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
            Welcome back
          </p>
          <h1 className="mt-2 font-serif text-4xl leading-tight">Sign in</h1>

          <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
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
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="mt-2 rounded-md"
              disabled={busy}
            >
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
