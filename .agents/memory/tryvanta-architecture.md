---
name: Tryvanta architecture
description: Final stack and key wiring decisions for the Tryvanta Home PWA + FastAPI project.
---

## Architecture

React 19 + TanStack Router PWA (Vite, port 5000) → FastAPI backend (Python 3.11, port 8000) → ESP32 at 192.168.29.220.

## Key wiring decisions

**Vite proxy:** `server.proxy: { "/api": { target: "http://localhost:8000", changeOrigin: true } }` — needed in dev because the Replit preview is HTTPS and the backend is HTTP localhost. In production, FastAPI serves the built Vite bundle and the proxy is not needed.

**`allowedHosts: true` (boolean, not string `"all"`):** Vite 8 only accepts the boolean; the string silently fails and causes "Blocked request" errors in the Replit proxy iframe.

**`VITE_API_BASE` stays empty string:** `api.ts` uses `${VITE_API_BASE}/api/v1`; empty = same-origin, which the Vite proxy resolves in dev and FastAPI resolves in prod.

**Auth:** Server-side allow-list in `backend/main.py` (`ALLOWED_EMAILS`). JWT signed with `SESSION_SECRET` Replit secret. Tokens: `tv_access`, `tv_refresh`, `tv_home` in localStorage.

**ESP32 reachability:** The ESP32 (192.168.29.220) is only reachable on the local home network. The Replit cloud preview cannot reach it. Auth and dashboard UI work in preview; actual relay switching only works on-LAN.

**Why:**
- Server-side allow-list prevents client-side bypass.
- Proxy + same-origin URLs mean zero config change between dev and prod.
- FastAPI as intermediary removes browser CORS issues with ESP32.
