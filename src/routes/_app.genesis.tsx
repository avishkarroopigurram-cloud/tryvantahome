// GENESIS voice/NLU console. Web Speech API when available, typed commands always.
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Mic, Send, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/genesis")({
  component: GenesisPage,
});

interface Turn {
  role: "you" | "genesis";
  text: string;
  ok?: boolean;
}

const SUGGESTIONS = [
  "Turn off all bedroom lights",
  "Movie Mode",
  "Good Night",
  "Set fan to 40%",
];

function GenesisPage() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const recRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns.length]);

  async function submit(cmd?: string) {
    const message = (cmd ?? text).trim();
    if (!message || busy) return;
    setText("");
    setBusy(true);
    setTurns((t) => [...t, { role: "you", text: message }]);
    try {
      const res = await api.post<{ ok: boolean; speech: string }>(
        "/genesis/voice",
        { text: message },
      );
      setTurns((t) => [
        ...t,
        { role: "genesis", text: res.speech, ok: res.ok },
      ]);
      if ("speechSynthesis" in window && res.speech) {
        speechSynthesis.speak(new SpeechSynthesisUtterance(res.speech));
      }
    } catch {
      setTurns((t) => [
        ...t,
        { role: "genesis", text: "Something went wrong.", ok: false },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function listen() {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    recRef.current = rec;
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      setText(t);
      submit(t);
    };
    rec.onend = () => setListening(false);
    rec.start();
    setListening(true);
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-12rem)] max-w-2xl flex-col md:h-[calc(100vh-6rem)]">
      <header className="mb-6 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-md bg-foreground text-background">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-serif text-3xl leading-none">GENESIS</h1>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Ask your home anything
          </p>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="mb-4 flex flex-1 flex-col gap-3 overflow-y-auto pr-1"
      >
        {turns.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => submit(s)}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
              >
                "{s}"
              </button>
            ))}
          </div>
        )}
        {turns.map((t, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
              t.role === "you"
                ? "self-end bg-foreground text-background"
                : cn(
                    "self-start border border-border bg-card",
                    t.ok === false && "border-destructive/40",
                  ),
            )}
          >
            {t.text}
          </div>
        ))}
      </div>

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Button
          type="button"
          onClick={listen}
          disabled={listening}
          size="icon"
          className={cn(
            "h-11 w-11 shrink-0 rounded-full",
            listening && "animate-pulse bg-destructive hover:bg-destructive",
          )}
        >
          <Mic className="h-5 w-5" />
        </Button>
        <Input
          placeholder="Type a command…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="h-11"
        />
        <Button
          type="submit"
          disabled={busy}
          size="icon"
          className="h-11 w-11 shrink-0"
          variant="outline"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
