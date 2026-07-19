import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Video, Circle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, tokens, API_BASE } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Camera } from "@/lib/types";

export const Route = createFileRoute("/_app/cameras")({
  component: CamerasPage,
});

function CamerasPage() {
  const [cams, setCams] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [rtsp, setRtsp] = useState("");

  async function load() {
    try {
      setCams(await api.get<Camera[]>("/cameras"));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!name.trim() || !rtsp.trim()) return;
    try {
      await api.post("/cameras", { name, rtsp_url: rtsp });
      setName("");
      setRtsp("");
      setAdding(false);
      toast.success("Camera added");
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Video
          </p>
          <h1 className="mt-2 font-serif text-4xl">Cameras</h1>
        </div>
        <Button
          variant={adding ? "outline" : "default"}
          onClick={() => setAdding(!adding)}
        >
          <Plus className="mr-2 h-4 w-4" />
          {adding ? "Cancel" : "Add camera"}
        </Button>
      </header>

      {adding && (
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input
              placeholder="Front door"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>RTSP URL</Label>
            <Input
              placeholder="rtsp://user:pass@host:554/stream"
              value={rtsp}
              onChange={(e) => setRtsp(e.target.value)}
            />
          </div>
          <Button onClick={add}>Add camera</Button>
        </div>
      )}

      {loading ? (
        <div className="grid min-h-[30vh] place-items-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : cams.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
          No cameras yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {cams.map((c) => (
            <CameraCard key={c.id} camera={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function CameraCard({ camera }: { camera: Camera }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Snapshot id={camera.id} />
      <div className="flex items-center justify-between px-4 py-3">
        <div className="font-medium">{camera.name}</div>
        <div className="flex items-center gap-3 text-xs">
          {camera.recording && (
            <span className="inline-flex items-center gap-1 text-destructive">
              <Circle className="h-2.5 w-2.5 fill-current" />
              REC
            </span>
          )}
          <span
            className={
              camera.online ? "text-emerald-600" : "text-muted-foreground"
            }
          >
            {camera.online ? "Live" : "Offline"}
          </span>
        </div>
      </div>
    </div>
  );
}

// Snapshot needs the auth header, so we can't use a bare <img src>. Fetch as a
// blob with credentials and object-URL it.
function Snapshot({ id }: { id: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let obj: string | undefined;
    fetch(`${API_BASE}/api/v1/cameras/${id}/snapshot`, {
      headers: {
        Authorization: `Bearer ${tokens.access ?? ""}`,
        "X-Home-Id": tokens.home ?? "",
      },
    })
      .then((r) => (r.ok ? r.blob() : null))
      .then((b) => {
        if (b) {
          obj = URL.createObjectURL(b);
          setUrl(obj);
        }
      })
      .catch(() => {});
    return () => {
      if (obj) URL.revokeObjectURL(obj);
    };
  }, [id]);
  return url ? (
    <img
      src={url}
      alt="Camera snapshot"
      className="h-48 w-full object-cover"
    />
  ) : (
    <div className="grid h-48 w-full place-items-center bg-muted text-muted-foreground">
      <Video className="h-8 w-8 opacity-40" />
    </div>
  );
}
