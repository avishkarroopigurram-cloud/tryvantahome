# Tryvanta Home Platform

A smart-home dashboard frontend for controlling ESP32 relay hardware over a local network.

## Stack

- **React 19** with **TanStack Router / TanStack Start** (file-based routing, SSR-capable)
- **Tailwind CSS v4** + **shadcn/ui** (Radix primitives)
- **Bun** as package manager / runtime
- **Vite 8** (`@lovable.dev/vite-tanstack-config`)

## Running the app

```
bun run dev   # starts on http://localhost:5000
```

The workflow **Start application** (`bun run dev`) is pre-configured.

## Authentication

Login is controlled by a client-side email allow-list — no backend required.

**Authorised emails:**
- `rajanikanthmattepally@gmail.com`
- `aavishkarroopi@gmail.com`

Any other email receives "Access denied." Auth state is persisted in `localStorage` and survives page reloads.

To add or remove users, edit the `ALLOWED_EMAILS` set in `src/context/AuthContext.tsx`.

## ESP32 Relay Control

The dashboard talks directly to an ESP32 relay board at `http://192.168.29.220`.

| Relay | On endpoint          | Off endpoint          |
|-------|----------------------|-----------------------|
| 1     | `/relay1/on`         | `/relay1/off`         |
| 2     | `/relay2/on`         | `/relay2/off`         |
| 3     | `/relay3/on`         | `/relay3/off`         |
| 4     | `/relay4/on`         | `/relay4/off`         |

**CORS requirement:** The ESP32 firmware must return `Access-Control-Allow-Origin: *` on every HTTP response, otherwise the browser will block the requests.

**Mixed-content requirement:** Access the dashboard over HTTP (not HTTPS) from your local network, e.g. `http://<host-ip>:5000/`. Browsers block HTTP fetch calls from HTTPS pages. The Replit preview proxy uses HTTPS, so relay commands will be blocked there — use the local URL when operating relays.

ESP32 base URL and relay functions live in `src/lib/esp32.ts`.

## Project structure

```
src/
  components/
    RelayCard.tsx       Relay toggle card — calls ESP32 directly
    AppShell.tsx        Nav shell (sidebar + mobile bottom nav)
    DeviceCard.tsx      Generic device card (for future devices)
    DeviceIcon.tsx      Icon resolver
    ui/                 shadcn/ui primitives
  context/
    AuthContext.tsx     Allow-list auth — no backend required
  lib/
    esp32.ts            Direct HTTP client for the ESP32 relay board
    api.ts              FastAPI HTTP client (for future backend)
    types.ts            TypeScript interfaces
    realtime.ts         WebSocket hook (for future backend)
    dev-preview/        Legacy mock layer (inactive — no longer imported)
  routes/
    index.tsx           Landing / redirect gate
    login.tsx           Sign-in form with allow-list check
    _app.tsx            Auth-gated layout
    _app.dashboard.tsx  Relay dashboard — 4 relays, direct ESP32 calls
    _app.rooms.tsx      (future)
    _app.energy.tsx     (future)
    _app.automations.tsx (future)
    _app.scenes.tsx     (future)
    _app.cameras.tsx    (future)
    _app.genesis.tsx    (future)
    _app.settings.tsx   (future)
  router.tsx            Router factory
  server.ts             SSR error wrapper
```

## Roadmap (not yet implemented)

1. **FastAPI backend** — real device persistence, user accounts, cloud sync
2. **More ESP32 devices** — dimmers, sensors, curtains, locks
3. **Automations** — time-based and sensor-triggered relay rules
4. **Energy monitoring** — current sensing per relay
5. **GENESIS voice** — natural-language relay control

## User preferences

- Keep production auth paths untouched when adding dev-only features.
- Use Bun (`bun install`, `bun run dev`) — do not use npm or yarn.
- The ESP32 base URL lives in `src/lib/esp32.ts` as `ESP32_BASE`.
