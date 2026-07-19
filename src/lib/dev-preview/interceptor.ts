// DEV-ONLY: Fetch interceptor for Tryvanta preview mode.
// Patches window.fetch to intercept /api/v1/ calls and return mock responses.
// This file is only ever imported when import.meta.env.VITE_PREVIEW_MODE is set.

import type { Device, Room, Scene, Automation } from "@/lib/types";
import {
  MOCK_USER,
  MOCK_HOME,
  INITIAL_ROOMS,
  INITIAL_DEVICES,
  INITIAL_SCENES,
  INITIAL_AUTOMATIONS,
  MOCK_CAMERAS,
  getMockEnergy,
  MOCK_MEMBERS,
} from "./mock-data";

// Mutable in-memory state so UI interactions feel live within a session.
let devices: Device[] = INITIAL_DEVICES.map((d) => ({ ...d }));
let rooms: Room[]     = INITIAL_ROOMS.map((r) => ({ ...r }));
let scenes: Scene[]   = INITIAL_SCENES.map((s) => ({ ...s }));
let automations: Automation[] = INITIAL_AUTOMATIONS.map((a) => ({ ...a }));

// ── Response helpers ──────────────────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
function noContent(): Response {
  return new Response(null, { status: 204 });
}

// ── Router ────────────────────────────────────────────────────────────────────

function route(method: string, rawPath: string, body: any): Response | null {
  // Strip the /api/v1 prefix for matching.
  const p = rawPath.replace(/^\/api\/v1/, "");

  // ── Auth ────────────────────────────────────────────────────────────────────
  if (method === "POST" && (p === "/auth/login" || p === "/auth/refresh")) {
    return json({ access_token: "dev_access", refresh_token: "dev_refresh", token_type: "bearer", expires_in: 86400 });
  }
  if (method === "POST" && (p === "/auth/logout" || p === "/auth/logout-all")) {
    return noContent();
  }

  // ── Users ───────────────────────────────────────────────────────────────────
  if (method === "GET"   && p === "/users/me")          return json(MOCK_USER);
  if (method === "PATCH" && p === "/users/me")          return json({ ...MOCK_USER, ...body });
  if (method === "GET"   && p === "/users/me/homes")    return json([MOCK_HOME]);
  if (method === "GET"   && p === "/users/home/members") return json(MOCK_MEMBERS);
  if (method === "POST"  && p.startsWith("/users/home/invite")) return noContent();

  // ── Devices ─────────────────────────────────────────────────────────────────
  if (p.startsWith("/devices")) {
    const bare = p.split("?")[0];

    // List all (with optional room_id filter)
    if (method === "GET" && bare === "/devices") {
      const qs  = rawPath.includes("?") ? rawPath.slice(rawPath.indexOf("?")) : "";
      const url  = new URLSearchParams(qs.replace("?", ""));
      const rid  = url.get("room_id");
      return json(rid ? devices.filter((d) => d.room_id === rid) : devices);
    }

    // Discover
    if (method === "POST" && bare === "/devices/discover") {
      return json({ message: "Discovery started" });
    }

    // Single device
    const singleMatch = bare.match(/^\/devices\/([^/]+)$/);
    if (singleMatch) {
      const id = singleMatch[1];
      if (method === "GET") {
        const d = devices.find((x) => x.id === id);
        return d ? json(d) : json({ detail: "not found" }, 404);
      }
      if (method === "PATCH") {
        devices = devices.map((d) => (d.id === id ? { ...d, ...body } : d));
        const updated = devices.find((d) => d.id === id);
        return updated ? json(updated) : json({ detail: "not found" }, 404);
      }
      if (method === "DELETE") {
        devices = devices.filter((d) => d.id !== id);
        return noContent();
      }
    }

    // Device command
    const cmdMatch = bare.match(/^\/devices\/([^/]+)\/command$/);
    if (method === "POST" && cmdMatch) {
      const id  = cmdMatch[1];
      const cmd = body?.command as string | undefined;
      devices = devices.map((d) => {
        if (d.id !== id) return d;
        const st = { ...d.last_state };
        if (cmd === "turn_on")  st.power = true;
        if (cmd === "turn_off") st.power = false;
        if (cmd === "set_brightness" && body?.params?.brightness !== undefined)
          st.brightness = body.params.brightness;
        if (cmd === "set_speed" && body?.params?.speed !== undefined)
          st.speed = body.params.speed;
        if (cmd === "lock")   st.locked = true;
        if (cmd === "unlock") st.locked = false;
        return { ...d, last_state: st };
      });
      return noContent();
    }
  }

  // ── Rooms ────────────────────────────────────────────────────────────────────
  if (method === "GET"  && p === "/rooms") return json(rooms);
  if (method === "POST" && p === "/rooms") {
    const r: Room = {
      id: `room-${Date.now()}`, name: body.name, kind: body.kind,
      icon: body.icon || body.kind, order: rooms.length, device_count: 0,
    };
    rooms = [...rooms, r];
    return json(r, 201);
  }
  const roomMatch = p.match(/^\/rooms\/([^/]+)$/);
  if (roomMatch) {
    const id = roomMatch[1];
    if (method === "GET") {
      const r = rooms.find((x) => x.id === id);
      return r ? json(r) : json({ detail: "not found" }, 404);
    }
    if (method === "DELETE") {
      rooms = rooms.filter((r) => r.id !== id);
      return noContent();
    }
  }

  // ── Scenes ───────────────────────────────────────────────────────────────────
  if (method === "GET"  && p === "/scenes") return json(scenes);
  if (method === "POST" && p === "/scenes") {
    const s: Scene = {
      id: `scene-${Date.now()}`, name: body.name, icon: "sparkles",
      color: "#6366f1", is_favorite: false, order: scenes.length,
      actions: body.actions || [],
    };
    scenes = [...scenes, s];
    return json(s, 201);
  }
  const sceneActivateMatch = p.match(/^\/scenes\/([^/]+)\/activate$/);
  if (method === "POST" && sceneActivateMatch) return json({ ok: true });
  const sceneDeleteMatch = p.match(/^\/scenes\/([^/]+)$/);
  if (method === "DELETE" && sceneDeleteMatch) {
    scenes = scenes.filter((s) => s.id !== sceneDeleteMatch[1]);
    return noContent();
  }

  // ── Automations ──────────────────────────────────────────────────────────────
  if (method === "GET"  && p === "/automations") return json(automations);
  if (method === "POST" && p === "/automations") {
    const a: Automation = {
      id: `auto-${Date.now()}`, name: body.name, enabled: true,
      trigger: body.trigger, conditions: body.conditions || [],
      actions: body.actions || [], cooldown_s: 300, fire_count: 0,
    };
    automations = [...automations, a];
    return json(a, 201);
  }
  const autoToggleMatch = p.match(/^\/automations\/([^/]+)\/toggle$/);
  if (method === "POST" && autoToggleMatch) {
    const id = autoToggleMatch[1];
    automations = automations.map((a) => a.id === id ? { ...a, enabled: !a.enabled } : a);
    return noContent();
  }
  const autoDeleteMatch = p.match(/^\/automations\/([^/]+)$/);
  if (method === "DELETE" && autoDeleteMatch) {
    automations = automations.filter((a) => a.id !== autoDeleteMatch[1]);
    return noContent();
  }

  // ── Cameras ──────────────────────────────────────────────────────────────────
  if (method === "GET"  && p === "/cameras") return json(MOCK_CAMERAS);
  if (method === "POST" && p === "/cameras") {
    return json({ id: `cam-${Date.now()}`, name: body.name, room_id: null, online: false, motion_detection: false, recording: false }, 201);
  }
  // Snapshot — let it fall through; the UI gracefully shows a placeholder on failure.

  // ── Energy ───────────────────────────────────────────────────────────────────
  if (method === "GET" && p.startsWith("/energy/summary")) {
    const qs  = p.includes("?") ? p.slice(p.indexOf("?") + 1) : "";
    const period = new URLSearchParams(qs).get("period") || "day";
    return json(getMockEnergy(period));
  }

  // ── GENESIS ──────────────────────────────────────────────────────────────────
  if (method === "POST" && p === "/genesis/voice") {
    const text = (body?.text || "") as string;
    const RESPONSES: Array<[RegExp, string]> = [
      [/\b(off|turn off|shutdown)\b/i,  "Done — turning everything off."],
      [/movie|cinema|film\b/i,          "Movie Mode activated. Enjoy the show!"],
      [/good.?night|sleep|night mode/i, "Good night! Everything's set for sleep."],
      [/morning|wake|coffee/i,          "Good morning! Lights and coffee are on."],
      [/fan.*(\d+)|(\d+).*fan/i,        `Setting the fan to ${text.match(/\d+/)?.[0] ?? "40"}%. Done.`],
      [/\blights?\b/i,                  "Lights adjusted!"],
      [/temp|ac|cool|heat/i,            "Climate control updated."],
    ];
    const match = RESPONSES.find(([re]) => re.test(text));
    return json({ ok: true, speech: match ? match[1] : "Got it! Command processed." });
  }

  return null; // unknown route — let through (will fail; that's acceptable)
}

// ── Fetch patch ───────────────────────────────────────────────────────────────

export function installFetchInterceptor(): void {
  const original = window.fetch.bind(window);

  window.fetch = async function (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url;

    if (!url.includes("/api/v1/")) return original(input, init);

    const method = (
      init?.method ??
      (input instanceof Request ? input.method : "GET")
    ).toUpperCase();

    let body: any;
    if (init?.body) {
      try { body = JSON.parse(init.body as string); } catch { /* noop */ }
    }

    // Parse pathname + query from the full URL.
    let pathname: string;
    try {
      const u  = new URL(url, "http://localhost");
      pathname = u.pathname + (u.search || "");
    } catch {
      pathname = url;
    }

    // Simulate realistic network latency (20–80 ms).
    await new Promise<void>((r) => setTimeout(r, 20 + Math.random() * 60));

    const response = route(method, pathname, body);
    return response ?? original(input, init);
  };
}
