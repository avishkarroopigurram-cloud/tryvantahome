# Tryvanta Home Platform

A smart-home PWA for controlling an ESP32 relay board over a local network.
Architecture: **React PWA → FastAPI backend → ESP32**.

## Stack

- **React 19** with **TanStack Router / TanStack Start** (file-based routing)
- **Tailwind CSS v4** + **shadcn/ui** (Radix primitives)
- **Bun** as package manager / runtime
- **Vite 8** (`@lovable.dev/vite-tanstack-config`)
- **FastAPI** (Python 3.11) — JWT auth, device proxy, allow-list enforcement
- **PWA** — Web App Manifest + Service Worker (stale-while-revalidate)

## Running the app

```
bun run dev   # frontend on http://localhost:5000
cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Two workflows are pre-configured:
- **Start application** — Vite dev server on port 5000
- **Backend API** — FastAPI/uvicorn on port 8000

In dev, Vite proxies `/api/*` → `localhost:8000`.
In production, FastAPI serves both API and static files on one port (same origin).

## Authentication

Server-side allow-list in `backend/main.py` (`ALLOWED_EMAILS` set).
FastAPI issues JWT access + refresh tokens (signed with `SESSION_SECRET`).
Tokens stored in `localStorage` as `tv_access`, `tv_refresh`, `tv_home`.

**Authorised emails:**
- `rajanikanthmattepally@gmail.com`
- `aavishkarroopi@gmail.com`

Any other email receives HTTP 401 "Access denied."

To add or remove users, edit `ALLOWED_EMAILS` in `backend/main.py`.

## ESP32 Relay Control

The FastAPI backend proxies relay commands to the ESP32 at `http://192.168.29.220`.

| Relay | FastAPI endpoint                   | ESP32 endpoint      |
|-------|------------------------------------|---------------------|
| 1     | `POST /api/v1/devices/relay-1/command` | `/relay1/on|off` |
| 2     | `POST /api/v1/devices/relay-2/command` | `/relay2/on|off` |
| 3     | `POST /api/v1/devices/relay-3/command` | `/relay3/on|off` |
| 4     | `POST /api/v1/devices/relay-4/command` | `/relay4/on|off` |

**Note:** The Replit preview cannot reach the ESP32 (`192.168.29.220`) — it is only reachable on the local home network. Auth/dashboard UI works in the preview; actual relay switching works only when running on the local network where the ESP32 is present.

**ESP32 requirement:** Firmware must return `Access-Control-Allow-Origin: *` (handled server-side now, so this is no longer a browser CORS issue).

## PWA Install

On Chrome/Edge (mobile or desktop), "Add to Home Screen" / "Install" prompt appears automatically via `PwaInstallPrompt.tsx`. The service worker (`public/sw.js`) caches static assets with stale-while-revalidate and bypasses the network cache for `/api/*`.

Icons: `public/icons/icon-192.png`, `public/icons/icon-512.png` (dark navy `#0f172a` with white "T" lettermark).

## Project structure

```
src/
  components/
    AppShell.tsx        Nav shell (sidebar + mobile bottom nav) + PwaInstallPrompt
    DeviceCard.tsx      Generic device card — power toggle calls FastAPI
    PwaInstallPrompt.tsx  "Add to Home Screen" install banner
    DeviceIcon.tsx      Icon resolver
    ui/                 shadcn/ui primitives
  context/
    AuthContext.tsx     JWT auth — calls FastAPI /auth/login, /users/me
  lib/
    api.ts              FastAPI HTTP client (VITE_API_BASE prefix + /api/v1)
    types.ts            TypeScript interfaces
    realtime.ts         WebSocket hook (future backend)
    dev-preview/        Legacy mock layer (inactive — no longer imported)
  routes/
    index.tsx           Landing / redirect gate
    login.tsx           Sign-in form
    _app.tsx            Auth-gated layout
    _app.dashboard.tsx  Dashboard — loads devices/rooms/scenes from FastAPI
    _app.rooms.tsx      (future)
    _app.energy.tsx     (future)
    _app.automations.tsx (future)
    _app.scenes.tsx     (future)
    _app.cameras.tsx    (future)
    _app.genesis.tsx    (future)
    _app.settings.tsx   (future)
  router.tsx            Router factory (SW registration in __root.tsx)
  server.ts             SSR error wrapper

backend/
  main.py               FastAPI app — auth, devices, rooms, scenes, ESP32 proxy
  requirements.txt      fastapi, uvicorn[standard], httpx, PyJWT, python-multipart

public/
  manifest.webmanifest  PWA manifest
  sw.js                 Service worker
  icons/
    icon-192.png        App icon (192×192)
    icon-512.png        App icon (512×512)
```

## Roadmap (not yet implemented)

1. **Persistent device state** — store relay on/off state in FastAPI (SQLite/Postgres)
2. **More ESP32 devices** — dimmers, sensors, curtains, locks
3. **Automations** — time-based and sensor-triggered relay rules
4. **Energy monitoring** — current sensing per relay
5. **GENESIS voice** — natural-language relay control
6. **Production deployment** — FastAPI serves built Vite bundle; single-port deploy

## User preferences

- Keep production auth paths untouched when adding dev-only features.
- Use Bun (`bun install`, `bun run dev`) — do not use npm or yarn.
- Allow-list and ESP32 base URL live in `backend/main.py`.
- `VITE_API_BASE` stays empty — same-origin relative URLs work in both dev (Vite proxy) and prod (FastAPI static serve).
