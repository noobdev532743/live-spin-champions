import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useGame } from "@/game/store";

export const Route = createFileRoute("/relay")({
  head: () => ({
    meta: [
      { title: "Relay Setup — Spin Stars" },
      { name: "description", content: "Connect TikFinity or TikTokLive relay to drive Spin Stars in real time." },
    ],
  }),
  component: Relay,
});

function Relay() {
  const enqueue = useGame((s) => s.enqueue);
  const [origin, setOrigin] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const tabIdRef = useRef<string>("");

  useEffect(() => {
    setOrigin(window.location.origin);
    tabIdRef.current = "tab_" + Math.random().toString(36).slice(2, 8);
    const bc = "BroadcastChannel" in window ? new BroadcastChannel("spinstars-events") : null;
    if (bc) {
      bc.onmessage = (m) => {
        const ev = m.data;
        enqueue(ev);
        setLogs((l) => [`✓ ${ev.action} @${ev.username}`, ...l].slice(0, 30));
      };
    }
    // also accept window.postMessage from extensions
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "spinstars-event") {
        enqueue(e.data.event);
        setLogs((l) => [`✓ ${e.data.event.action} @${e.data.event.username}`, ...l].slice(0, 30));
      }
    };
    window.addEventListener("message", onMsg);
    return () => { bc?.close(); window.removeEventListener("message", onMsg); };
  }, [enqueue]);

  const url = origin ? `${origin}/api/event` : "";
  const sample = `curl -X POST ${url} \\\n  -H "Content-Type: application/json" \\\n  -d '{"username":"viewer1","action":"gift","giftValue":5}'`;

  const test = async (action: string) => {
    await fetch("/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "tester", action }),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-sky">
      <div className="mx-auto max-w-md px-3 py-4 space-y-3">
        <header className="flex items-center justify-between">
          <Link to="/" className="text-xs font-bold rounded-full bg-card px-3 py-1 shadow">← Back</Link>
          <h1 className="font-display text-xl font-bold">📡 Relay Setup</h1>
          <span />
        </header>

        <section className="rounded-2xl bg-card p-4 shadow-clay space-y-2">
          <h2 className="font-display font-bold">1. TikFinity webhook</h2>
          <p className="text-xs text-muted-foreground">Point your TikFinity / TikTokLive bridge to this URL. Send events as JSON.</p>
          <code className="block text-[10px] bg-muted rounded-lg p-2 break-all font-mono">{url || "loading…"}</code>
          <pre className="text-[10px] bg-muted rounded-lg p-2 overflow-x-auto font-mono whitespace-pre">{sample}</pre>
          <p className="text-[10px] text-muted-foreground">Supported actions: <code>follow</code>, <code>share</code>, <code>like</code>, <code>gift</code></p>
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-clay space-y-2">
          <h2 className="font-display font-bold">2. Test it</h2>
          <div className="grid grid-cols-4 gap-2">
            {["follow","share","like","gift"].map((a) => (
              <button key={a} onClick={() => test(a)} className="rounded-xl bg-primary text-primary-foreground py-2 text-xs font-bold shadow-pop">
                {a}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">Open the game in another tab — events broadcast across tabs via BroadcastChannel.</p>
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-clay">
          <h2 className="font-display font-bold mb-2">Live log</h2>
          <div className="text-[11px] font-mono space-y-0.5 max-h-48 overflow-y-auto">
            {logs.length === 0 && <p className="text-muted-foreground">Waiting for events…</p>}
            {logs.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </section>
      </div>
    </div>
  );
}
