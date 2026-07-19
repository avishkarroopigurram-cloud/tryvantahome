import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, RefreshCw, LogOut, Search } from "lucide-react";
import { toast } from "sonner";
import { api, tokens } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HomeMember, User } from "@/lib/types";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, home, logout, refresh } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.full_name || "");
  const [members, setMembers] = useState<HomeMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    setName(user?.full_name || "");
  }, [user?.full_name]);

  useEffect(() => {
    api
      .get<HomeMember[]>("/users/home/members")
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [home?.id]);

  async function saveProfile() {
    try {
      await api.patch<User>("/users/me", { full_name: name });
      toast.success("Profile saved");
      refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  }

  async function invite() {
    if (!inviteEmail.trim()) return;
    try {
      await api.post(
        `/users/home/invite?email=${encodeURIComponent(inviteEmail)}&role=member`,
      );
      toast.success("Member added");
      setInviteEmail("");
      api.get<HomeMember[]>("/users/home/members").then(setMembers);
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  }

  async function discover() {
    try {
      await api.post("/devices/discover");
      toast.success("Discovery started");
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  }

  async function logoutAll() {
    try {
      await api.post("/auth/logout-all");
    } finally {
      tokens.clear();
      navigate({ to: "/login", replace: true });
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Preferences
        </p>
        <h1 className="mt-2 font-serif text-4xl">Settings</h1>
      </header>

      <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
        <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Profile
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <span>{user?.email}</span>
          {user?.email_verified && (
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fname">Full name</Label>
          <Input
            id="fname"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <Button className="self-start" onClick={saveProfile}>
          Save changes
        </Button>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
        <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Home · {home?.name}
        </h2>
        <Button
          variant="outline"
          className="self-start"
          onClick={discover}
        >
          <Search className="mr-2 h-4 w-4" />
          Discover devices
        </Button>

        <div>
          <Label className="mb-2 block">Members</Label>
          <div className="divide-y divide-border rounded-md border border-border">
            {members.length === 0 && (
              <div className="p-3 text-sm text-muted-foreground">
                No members
              </div>
            )}
            {members.map((m) => (
              <div
                key={m.user_id || m.home_id}
                className="flex items-center justify-between p-3 text-sm"
              >
                <span className="font-mono text-xs">
                  {m.user_id?.slice(0, 8) || "member"}
                </span>
                <span className="text-xs capitalize text-muted-foreground">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              placeholder="Invite by email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <Button variant="outline" onClick={invite}>
              Invite
            </Button>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
        <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Security
        </h2>
        <Button
          variant="outline"
          className="self-start"
          onClick={logoutAll}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Sign out all devices
        </Button>
        <Button
          variant="ghost"
          className="self-start text-destructive hover:text-destructive"
          onClick={async () => {
            await logout();
            navigate({ to: "/login", replace: true });
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </section>

      <p className="text-xs text-muted-foreground">
        API base:{" "}
        <code className="text-foreground">
          {import.meta.env.VITE_API_BASE || "same-origin"}
        </code>
      </p>
    </div>
  );
}
