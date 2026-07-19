// DEV-ONLY: Tryvanta development preview mode — auto-installs on import.
//
// This module is imported as a side-effect from src/router.tsx.
// When VITE_PREVIEW_MODE is NOT set, the entire outer if-block is dead code
// that Vite/Rollup eliminates at build time — zero production impact.
//
// The inner typeof-window guard is essential: src/router.tsx is evaluated on
// both the client AND the server (TanStack Start SSR). window is undefined
// in the server bundle, so all browser APIs (localStorage, window.fetch)
// must be gated here before any access attempt.

if (import.meta.env.VITE_PREVIEW_MODE && typeof window !== "undefined") {
  // ① Seed localStorage synchronously so tokens.access is non-null before
  //    any useEffect auth gate fires on the client.
  if (!localStorage.getItem("tv_access")) {
    localStorage.setItem("tv_access",  "dev_access_token_preview");
    localStorage.setItem("tv_refresh", "dev_refresh_token_preview");
    localStorage.setItem("tv_home",    "home_demo_001");
  }

  // ② Install fetch interceptor via dynamic import (browser-only path).
  //    Dynamic imports inside an always-false block are excluded from the
  //    production bundle by Rollup's static analysis of import.meta.env.*.
  //    The import resolves as a microtask — before React useEffect callbacks.
  import("./interceptor").then((m) => {
    m.installFetchInterceptor();
    console.info(
      "%c[Tryvanta Dev Preview]%c Mock mode active — no backend needed.\n" +
      "All /api/v1/ calls are intercepted in-process. " +
      "Production authentication is completely untouched.",
      "background:#f59e0b;color:#000;font-weight:bold;padding:1px 6px;border-radius:3px",
      "color:inherit",
    );
  });
}
