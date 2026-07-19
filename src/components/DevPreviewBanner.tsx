// DEV-ONLY: Visual indicator that preview mode is active.
// This component renders nothing in production builds — the
// import.meta.env.VITE_PREVIEW_MODE check is dead-code-eliminated by Vite.

import { useState } from "react";
import { FlaskConical, X } from "lucide-react";

export function DevPreviewBanner() {
  const [dismissed, setDismissed] = useState(false);

  // Vite replaces import.meta.env.VITE_PREVIEW_MODE with `undefined` in
  // production, making this entire component return null immediately.
  if (!import.meta.env.VITE_PREVIEW_MODE || dismissed) return null;

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-amber-400/50 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-800 dark:text-amber-300">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-4 w-4 shrink-0 text-amber-500" />
        <span>
          <span className="font-semibold">Dev Preview Mode</span>
          {" — "}displaying mock data. No backend required.{" "}
          <span className="text-amber-600/80 dark:text-amber-400/70">
            Production auth is untouched.
          </span>
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-0.5 text-amber-600 hover:bg-amber-400/20 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-100"
        aria-label="Dismiss preview banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
