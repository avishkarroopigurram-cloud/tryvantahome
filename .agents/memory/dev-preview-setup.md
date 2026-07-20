---
name: Tryvanta dev preview setup
description: Mock mode pattern and Vite/Replit host config quirks for this project.
---

## Dev preview pattern
- `VITE_PREVIEW_MODE=true` (shared env var) activates the mock layer.
- `src/lib/dev-preview/index.ts` is side-effect-imported from `src/router.tsx`.
- Entry is double-gated: `import.meta.env.VITE_PREVIEW_MODE && typeof window !== 'undefined'` — the `typeof window` guard is required because `src/router.tsx` is evaluated on the SSR path in TanStack Start; `window` is undefined there.
- Tokens are seeded synchronously into localStorage; then the fetch interceptor is installed via a dynamic import (microtask).

## Vite allowedHosts — must be boolean true, not the string "all"
`allowedHosts: "all"` is silently ignored by Vite 8; the server still blocks Replit proxy hostnames.
Use `allowedHosts: true` (boolean).

**Why:** Vite 8's host check only special-cases the boolean `true`. The string `"all"` is treated as an array entry (a literal hostname to allow), not a wildcard.

**How to apply:** Any Vite project on Replit must set `server: { host: "0.0.0.0", port: 5000, allowedHosts: true }`.

## @lovable.dev/vite-tanstack-config merge order
The `defineConfig` wrapper from `@lovable.dev/vite-tanstack-config` applies user `vite:` options FIRST, then merges its own sandbox defaults ON TOP when `LOVABLE_SANDBOX=1` or `DEV_SERVER__PROJECT_PATH` is set (Lovable sandbox env vars). In the Replit environment neither is set, so the non-sandbox path runs: `mergeConfig(defaults, userConfig)` — user settings win for all scalar values including `allowedHosts`, `host`, and `port`.
