// HTTP client for the Tryvanta FastAPI backend.
// Base URL is set at build time via VITE_API_BASE (empty string uses same-origin,
// which is what the nginx-in-front prod deploy expects).
import type { TokenPair } from "./types";

export const API_BASE: string =
  (import.meta as any).env?.VITE_API_BASE ?? "";
const API = `${API_BASE}/api/v1`;

const ACCESS = "tv_access";
const REFRESH = "tv_refresh";
const HOME = "tv_home";

const isBrowser = typeof window !== "undefined";

export const tokens = {
  get access() {
    return isBrowser ? localStorage.getItem(ACCESS) : null;
  },
  get refresh() {
    return isBrowser ? localStorage.getItem(REFRESH) : null;
  },
  get home() {
    return isBrowser ? localStorage.getItem(HOME) : null;
  },
  set(pair: TokenPair) {
    if (!isBrowser) return;
    localStorage.setItem(ACCESS, pair.access_token);
    localStorage.setItem(REFRESH, pair.refresh_token);
  },
  setHome(id: string) {
    if (!isBrowser) return;
    localStorage.setItem(HOME, id);
  },
  clear() {
    if (!isBrowser) return;
    [ACCESS, REFRESH, HOME].forEach((k) => localStorage.removeItem(k));
  },
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errorType?: string,
  ) {
    super(message);
  }
}

export class NetworkError extends Error {
  constructor(message = "Network error — is the backend reachable?") {
    super(message);
    this.name = "NetworkError";
  }
}

async function refreshAccess(): Promise<boolean> {
  const rt = tokens.refresh;
  if (!rt) return false;
  try {
    const res = await fetch(`${API}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: rt }),
    });
    if (!res.ok) return false;
    tokens.set(await res.json());
    return true;
  } catch {
    return false;
  }
}

/** Callback invoked when the session expires. Wired to router redirect at app boot. */
let onSessionExpired: (() => void) | null = null;
export function setSessionExpiredHandler(fn: () => void) {
  onSessionExpired = fn;
}

async function request<T>(
  method: string,
  path: string,
  body?: any,
  retry = true,
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (tokens.access) headers["Authorization"] = `Bearer ${tokens.access}`;
  if (tokens.home) headers["X-Home-Id"] = tokens.home;

  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new NetworkError();
  }

  if (res.status === 401 && retry && tokens.refresh) {
    if (await refreshAccess()) return request<T>(method, path, body, false);
    tokens.clear();
    onSessionExpired?.();
    throw new ApiError(401, "session expired");
  }

  if (!res.ok) {
    let detail: any = {};
    try {
      detail = await res.json();
    } catch {
      /* noop */
    }
    const msg =
      detail?.detail?.error ||
      detail?.detail ||
      detail?.error ||
      res.statusText;
    throw new ApiError(
      res.status,
      typeof msg === "string" ? msg : "request failed",
      detail?.detail?.error_type,
    );
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(p: string) => request<T>("GET", p),
  post: <T>(p: string, body?: any) => request<T>("POST", p, body),
  patch: <T>(p: string, body?: any) => request<T>("PATCH", p, body),
  del: <T>(p: string) => request<T>("DELETE", p),
};
