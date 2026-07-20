// Shows a dismissible "Install app" banner when Chrome fires
// 'beforeinstallprompt' — i.e. when the PWA install criteria are met.
// Renders nothing on the server, when already installed, or on unsupported browsers.
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault(); // suppress the default mini-infobar
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt || dismissed) return null;

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setPrompt(null);
  }

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight">Install Tryvanta Home</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Add to your home screen for quick access
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button size="sm" onClick={install}>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Install
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
