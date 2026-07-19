# Tryvanta Home Platform

A multi-tenant smart-home dashboard frontend — lights, fans, cameras, energy, automations, and GENESIS voice assistant.

## Stack

- **React 19** with **TanStack Router / TanStack Start** (file-based routing, SSR-capable)
- **Tailwind CSS v4** + **shadcn/ui** (Radix primitives)
- **Recharts** for energy graphs
- **Bun** as package manager / runtime
- **Vite 8** (`@lovable.dev/vite-tanstack-config`) as dev server & bundler

## Running the app

```
bun run dev   # starts on http://localhost:5000
```

The workflow **Start application** (`bun run dev`) is pre-configured. The preview pane opens automatically.

## Dev Preview Mode

The app runs fully without a FastAPI backend. `VITE_PREVIEW_MODE=true` is set as a shared env var, which activates an in-process mock layer:

- Fake auth tokens are seeded into `localStorage` so the auth gate passes.
- `window.fetch` is patched to intercept every `/api/v1/` call and return realistic mock data (devices, rooms, scenes, automations, energy, GENESIS responses).
- An amber **Dev Preview Mode** banner is shown inside the app shell.
- **Production auth is completely untouched** — the mock only runs when `VITE_PREVIEW_MODE` is truthy.

Mock data files live in `src/lib/dev-preview/`:
| File | Purpose |
|------|---------|
| `mock-data.ts` | All fixture data (user, home, rooms, devices, scenes, automations, cameras, energy) |
| `interceptor.ts` | Fetch interceptor router — handles every `/api/v1/*` endpoint |
| `index.ts` | Module-level side-effect entry; imported from `src/router.tsx` |

`src/components/DevPreviewBanner.tsx` renders the dismissible amber banner (guarded by `import.meta.env.VITE_PREVIEW_MODE`).

To disable preview mode and point at a real backend, remove `VITE_PREVIEW_MODE` from the shared env vars and set `VITE_API_BASE` to your FastAPI server URL.

## Backend

The FastAPI backend is **not included** in this repo. The frontend expects it at `VITE_API_BASE` (defaults to same-origin). Authentication uses JWT access + refresh tokens stored in `localStorage` under keys `tv_access`, `tv_refresh`, and `tv_home`.

## Project structure

```
src/
  components/       UI components (AppShell, DeviceCard, DeviceIcon, shadcn/ui)
  context/          AuthContext — JWT auth, home switching, session state
  hooks/            use-mobile
  lib/
    api.ts          Fetch wrapper with token refresh + error mapping
    types.ts        TypeScript interfaces matching FastAPI schemas
    realtime.ts     WebSocket hook (auto-reconnect)
    dev-preview/    DEV-ONLY mock layer (see above)
  routes/           File-based routes (TanStack Router)
    index.tsx       Landing / redirect gate
    login.tsx       Sign-in form
    _app.tsx        Auth-gated layout
    _app.dashboard.tsx
    _app.rooms.tsx / _app.rooms.$roomId.tsx
    _app.devices.$deviceId.tsx
    _app.energy.tsx
    _app.scenes.tsx
    _app.automations.tsx
    _app.cameras.tsx
    _app.genesis.tsx
    _app.settings.tsx
  router.tsx        Router factory (also installs dev preview)
  start.ts          TanStack Start server entry
  server.ts         SSR error wrapper
```

## User preferences

- Keep production auth paths untouched when adding dev-only features.
- Gate all dev-only code on `import.meta.env.VITE_PREVIEW_MODE` (not `import.meta.env.DEV`) so it can be toggled without rebuilding.
- Use Bun (`bun install`, `bun run dev`) — do not use npm or yarn.
