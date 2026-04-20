import { useEffect } from "react";
import { useGame } from "@/game/store";

/**
 * Subscribes to the server SSE stream and to BroadcastChannel from other tabs.
 * Pushes incoming TikTok webhook events into the game queue when armed.
 */
export function EventBridge() {
  const enqueue = useGame((s) => s.enqueue);
  const armed = useGame((s) => s.state.armed ?? false);

  useEffect(() => {
    if (!armed) return;
    const bc = "BroadcastChannel" in window ? new BroadcastChannel("spinstars-events") : null;
    if (bc) bc.onmessage = (m) => { if (m.data?.action && m.data?.username) enqueue(m.data); };

    const es = new EventSource("/api/stream");
    es.onmessage = (m) => {
      try {
        const ev = JSON.parse(m.data);
        if (ev?.type === "hello") return;
        if (!ev?.action || !ev?.username) return;
        enqueue(ev);
      } catch { /* ignore */ }
    };
    return () => { bc?.close(); es.close(); };
  }, [armed, enqueue]);

  return null;
}
