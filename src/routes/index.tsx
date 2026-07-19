// Landing / redirect gate.
// If the user is already authenticated, forward to /dashboard.
// Otherwise, show a minimal editorial hero with a sign-in CTA.
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, navigate]);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-foreground text-background text-xs font-bold">
            T
          </span>
          <span className="font-serif text-lg">Tryvanta</span>
        </div>
        <Link
          to="/login"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Sign in →
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 pt-24 text-center md:pt-40">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
          Tryvanta Home · Platform
        </p>
        <h1 className="mt-6 font-serif text-5xl leading-[1.05] md:text-7xl">
          Your home,{" "}
          <span className="italic text-primary">precisely</span> controlled.
        </h1>
        <p className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
          A multi-tenant smart-home platform for lights, cameras, energy,
          automations and GENESIS voice — running on the Tryvanta Device
          Manager and ESP32 firmware.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="rounded-full">
            <Link to="/login">Sign in to your home</Link>
          </Button>
        </div>

        <dl className="mt-24 grid w-full grid-cols-1 gap-8 text-left sm:grid-cols-3">
          {[
            [
              "Devices",
              "Lights, fans, sockets, curtains, ACs, locks, cameras. Optimistic control with rollback.",
            ],
            [
              "Energy",
              "kWh, cost and per-room breakdown — polled and rolled up server-side.",
            ],
            [
              "GENESIS",
              'Type or speak: "Set fan to 40%", "Movie mode", "Turn off everything upstairs".',
            ],
          ].map(([title, body]) => (
            <div key={title}>
              <dt className="text-sm font-medium tracking-tight">{title}</dt>
              <dd className="mt-2 text-sm text-muted-foreground">{body}</dd>
            </div>
          ))}
        </dl>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 py-10 text-xs text-muted-foreground">
        Runs against your FastAPI backend at{" "}
        <code className="text-foreground">
          {import.meta.env.VITE_API_BASE || "same-origin"}
        </code>
        .
      </footer>
    </div>
  );
}
