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
  const tiktokUsername = useGame((s) => s.state.tiktokUsername ?? "");
  const setTiktokUsername = useGame((s) => s.setTiktokUsername);
  const armed = useGame((s) => s.state.armed ?? false);
  const setArmed = useGame((s) => s.setArmed);

  const [origin, setOrigin] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [usernameInput, setUsernameInput] = useState("");
  const armedRef = useRef(false);
  const tabIdRef = useRef<string>("");

  useEffect(() => { armedRef.current = armed; }, [armed]);
  useEffect(() => { setUsernameInput(tiktokUsername); }, [tiktokUsername]);

  useEffect(() => {
    setOrigin(window.location.origin);
    tabIdRef.current = "tab_" + Math.random().toString(36).slice(2, 8);
    const bc = "BroadcastChannel" in window ? new BroadcastChannel("spinstars-events") : null;
    if (bc) {
      bc.onmessage = (m) => {
        const ev = m.data;
        if (!armedRef.current) {
          setLogs((l) => [`⏸ ignored ${ev.action} @${ev.username} (not connected)`, ...l].slice(0, 30));
          return;
        }
        enqueue(ev);
        setLogs((l) => [`✓ ${ev.action} @${ev.username}`, ...l].slice(0, 30));
      };
    }
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "spinstars-event") {
        if (!armedRef.current) {
          setLogs((l) => [`⏸ ignored ${e.data.event.action} @${e.data.event.username} (not connected)`, ...l].slice(0, 30));
          return;
        }
        enqueue(e.data.event);
        setLogs((l) => [`✓ ${e.data.event.action} @${e.data.event.username}`, ...l].slice(0, 30));
      }
    };
    window.addEventListener("message", onMsg);

    // SSE stream from server — receives events posted by the TikFinity webhook
    const es = new EventSource("/api/stream");
    es.onopen = () => setLogs((l) => [`📡 SSE connected (/api/stream)`, ...l].slice(0, 30));
    es.onerror = () => setLogs((l) => [`⚠ SSE error — auto-retrying`, ...l].slice(0, 30));
    es.onmessage = (m) => {
      try {
        const ev = JSON.parse(m.data);
        if (ev?.type === "hello") return;
        if (!ev?.action || !ev?.username) return;
        if (!armedRef.current) {
          setLogs((l) => [`⏸ ignored ${ev.action} @${ev.username} (not connected)`, ...l].slice(0, 30));
          return;
        }
        enqueue(ev);
        bc?.postMessage(ev);
        setLogs((l) => [`📨 webhook ${ev.action} @${ev.username}`, ...l].slice(0, 30));
      } catch { /* ignore */ }
    };

    return () => { bc?.close(); window.removeEventListener("message", onMsg); es.close(); };
  }, [enqueue]);

  const cleanUsername = usernameInput.trim().replace(/^@/, "");
  const url = origin && cleanUsername
    ? `${origin}/api/event?u=${encodeURIComponent(cleanUsername)}`
    : origin ? `${origin}/api/event` : "";
  const sample = `curl -X POST ${url || "<URL>"} \\\n  -H "Content-Type: application/json" \\\n  -d '{"username":"viewer1","action":"gift","giftValue":5}'`;

  const connect = () => {
    if (!cleanUsername) return;
    setTiktokUsername(cleanUsername);
    setArmed(true);
    setLogs((l) => [`🟢 connected to @${cleanUsername} — listening for events`, ...l].slice(0, 30));
  };
  const disconnect = () => {
    setArmed(false);
    setLogs((l) => [`🔴 disconnected — events will be ignored`, ...l].slice(0, 30));
  };

  const test = async (action: string) => {
    if (!armed) {
      setLogs((l) => [`⚠ press Connect first (events are ignored until then)`, ...l].slice(0, 30));
      return;
    }
    const res = await fetch("/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "tester", action }),
    });
    const data = await res.json();
    if (data?.event) {
      enqueue(data.event);
      setLogs((l) => [`✓ ${data.event.action} @${data.event.username}`, ...l].slice(0, 30));
      const bc = "BroadcastChannel" in window ? new BroadcastChannel("spinstars-events") : null;
      bc?.postMessage(data.event);
      bc?.close();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-sky">
      <div className="mx-auto max-w-md px-3 py-4 space-y-3">
        <header className="flex items-center justify-between">
          <Link to="/" className="text-xs font-bold rounded-full bg-card px-3 py-1 shadow">← Back</Link>
          <h1 className="font-display text-xl font-bold">📡 Relay Setup</h1>
          <span />
        </header>

        <section className="rounded-2xl bg-card p-4 shadow-clay space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold">1. Your TikTok account</h2>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${armed ? "bg-mint" : "bg-muted text-muted-foreground"}`}>
              {armed ? "🟢 LIVE" : "⏸ IDLE"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter your TikTok username and press <b>Connect</b>. Events from your TikTok Live (follow / like / share / gift) will only start spawning spinners after you connect — so nothing fires before you go live.
          </p>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center rounded-xl bg-muted px-3">
              <span className="text-muted-foreground text-sm font-mono">@</span>
              <input
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="your_tiktok_handle"
                className="flex-1 bg-transparent py-2 text-sm focus:outline-none"
                disabled={armed}
              />
            </div>
            {!armed ? (
              <button
                onClick={connect}
                disabled={!cleanUsername}
                className="rounded-xl bg-primary text-primary-foreground px-4 text-xs font-bold shadow-pop disabled:opacity-40"
              >
                Connect
              </button>
            ) : (
              <button onClick={disconnect} className="rounded-xl bg-destructive text-destructive-foreground px-4 text-xs font-bold shadow-pop">
                Disconnect
              </button>
            )}
          </div>
          {armed && (
            <p className="text-[10px] text-mint-foreground bg-mint/40 rounded-lg p-2">
              ✓ Listening for @{cleanUsername}. Open the game in another tab — events will broadcast across tabs.
            </p>
          )}
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-clay space-y-2">
          <h2 className="font-display font-bold">2. TikFinity webhook</h2>
          <p className="text-xs text-muted-foreground">
            Point your TikFinity / TikTokLive bridge to this URL. Send events as JSON. The <code>?u=</code> param tags events with your TikTok handle.
          </p>
          <code className="block text-[10px] bg-muted rounded-lg p-2 break-all font-mono">{url || "loading…"}</code>
          <pre className="text-[10px] bg-muted rounded-lg p-2 overflow-x-auto font-mono whitespace-pre">{sample}</pre>
          <p className="text-[10px] text-muted-foreground">Supported actions: <code>follow</code>, <code>share</code>, <code>like</code>, <code>gift</code></p>
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-clay space-y-2">
          <h2 className="font-display font-bold">3. Test it</h2>
          <div className="grid grid-cols-4 gap-2">
            {["follow","share","like","gift"].map((a) => (
              <button key={a} onClick={() => test(a)} disabled={!armed}
                className="rounded-xl bg-primary text-primary-foreground py-2 text-xs font-bold shadow-pop disabled:opacity-40">
                {a}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">
            {armed ? "Buttons fire test events into the live game." : "Connect first to enable test events."}
          </p>
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
