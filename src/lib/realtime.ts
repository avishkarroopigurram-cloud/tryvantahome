// Subscribes to /api/v1/ws for this home. Auto-reconnects with exponential backoff.
import { useEffect, useRef } from "react";
import { API_BASE, tokens } from "./api";

export interface RealtimeEvent {
  type: string;
  [k: string]: any;
}

export function useRealtime(onEvent: (e: RealtimeEvent) => void) {
  const cbRef = useRef(onEvent);
  cbRef.current = onEvent;

  useEffect(() => {
    if (typeof window === "undefined") return;
    let ws: WebSocket | null = null;
    let closed = false;
    let backoff = 1000;
    let timer: ReturnType<typeof setTimeout> | undefined;

    function connect() {
      const access = tokens.access;
      if (!access) return;
      const base = API_BASE;
      const proto =
        base.startsWith("https") || window.location.protocol === "https:"
          ? "wss"
          : "ws";
      const host = base ? base.replace(/^https?:\/\//, "") : window.location.host;
      try {
        ws = new WebSocket(`${proto}://${host}/api/v1/ws?token=${access}`);
      } catch {
        return;
      }
      ws.onopen = () => {
        backoff = 1000;
      };
      ws.onmessage = (msg) => {
        try {
          cbRef.current(JSON.parse(msg.data));
        } catch {
          /* ignore */
        }
      };
      ws.onclose = () => {
        if (closed) return;
        timer = setTimeout(connect, backoff);
        backoff = Math.min(backoff * 2, 15000);
      };
      ws.onerror = () => ws?.close();
    }

    connect();
    return () => {
      closed = true;
      if (timer) clearTimeout(timer);
      ws?.close();
    };
  }, []);
}
