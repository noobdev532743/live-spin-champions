import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGame } from "@/game/store";
import { useTikTokLive } from "@/hooks/useTikTokLive";
import type { ViewerEvent } from "@/game/types";

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
  const getUrl = origin ? `${origin}/api/event?action=gift&u=${encodeURIComponent(cleanUsername || "viewer1")}` : "";
  const sample = `# Easiest — GET (works in browser, TikFinity custom webhook):\n${getUrl}\n\n# Or POST JSON (TikFinity / TikTokLive bridge):\ncurl -X POST ${url || "<URL>"} \\\n  -H "Content-Type: application/json" \\\n  -d '{"username":"viewer1","action":"gift","giftValue":5}'`;

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

  // Auto-connect to TikTok Live via public bridge (no install needed).
  const handleLiveEvent = useCallback((ev: ViewerEvent) => {
    if (!armedRef.current) return;
    enqueue(ev);
    const bc = "BroadcastChannel" in window ? new BroadcastChannel("spinstars-events") : null;
    bc?.postMessage(ev);
    bc?.close();
  }, [enqueue]);
  const live = useTikTokLive({
    username: cleanUsername,
    enabled: armed && !!cleanUsername,
    onEvent: handleLiveEvent,
    onLog: (msg) => setLogs((l) => [msg, ...l].slice(0, 30)),
  });

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

        {/* TikFinity — primary, reliable path */}
        <section className="rounded-2xl bg-card p-4 shadow-clay space-y-3 border-2 border-primary/40">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold">⭐ Cara utama: TikFinity (gratis, paling stabil)</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            TikFinity di-install di PC kamu, baca event TikTok Live langsung dari akunmu, lalu kirim ke game ini lewat webhook. <b>Tidak akan ditolak reCAPTCHA</b>, dan jalan otomatis selama TikFinity terbuka.
          </p>
          <ol className="text-xs space-y-1.5 list-decimal pl-4">
            <li>Download TikFinity dari <a href="https://tikfinity.zerody.one/" target="_blank" rel="noreferrer" className="underline font-bold text-primary">tikfinity.zerody.one</a> dan install di PC.</li>
            <li>Buka TikFinity → login dengan TikTok kamu (<b>@{cleanUsername || "username_kamu"}</b>) → connect ke live-mu.</li>
            <li>Di TikFinity buka <b>Custom Webhooks</b> (atau Integrations → Webhook) → <b>Add webhook</b>.</li>
            <li>Tempel URL ini sebagai webhook target:</li>
          </ol>
          <code className="block text-[11px] bg-muted rounded-lg p-2 break-all font-mono select-all">{url || "loading…"}</code>
          <ol className="text-xs space-y-1.5 list-decimal pl-4" start={5}>
            <li>Aktifkan event: <b>Follow</b>, <b>Share</b>, <b>Like</b>, <b>Gift</b>.</li>
            <li>Method: <b>POST</b>, Content-Type: <b>application/json</b>. Body bisa default — server kita auto-deteksi format TikFinity.</li>
            <li>Tekan <b>Connect</b> di bawah — semua event TikTok Live kamu langsung spawn spinner di arena 🎉</li>
          </ol>
          <p className="text-[10px] text-muted-foreground">
            Bisa juga pakai bridge lain (TikTokLive Node, EulerStream, dll) — selama mereka POST JSON ke URL di atas.
          </p>
        </section>

        {/* Connect button + status */}
        <section className="rounded-2xl bg-card p-4 shadow-clay space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold">Connect</h2>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              armed ? "bg-mint" : "bg-muted text-muted-foreground"
            }`}>
              {armed ? "🟢 LISTENING" : "⏸ IDLE"}
            </span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center rounded-xl bg-muted px-3">
              <span className="text-muted-foreground text-sm font-mono">@</span>
              <input
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="username_tiktok_kamu"
                className="flex-1 bg-transparent py-2 text-sm focus:outline-none"
                disabled={armed}
              />
            </div>
            {!armed ? (
              <button onClick={connect} disabled={!cleanUsername}
                className="rounded-xl bg-primary text-primary-foreground px-4 text-xs font-bold shadow-pop disabled:opacity-40">
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
              ✅ Listening untuk @{cleanUsername}. Event dari TikFinity webhook (atau auto-bridge) langsung spawn spinner.
            </p>
          )}
        </section>

        {/* Auto-bridge — experimental */}
        <section className="rounded-2xl bg-card p-4 shadow-clay space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-sm">🧪 Auto-bridge (eksperimental)</h2>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              live.status === "live" ? "bg-mint" :
              live.status === "connecting" ? "bg-sky animate-pulse" :
              live.status === "error" ? "bg-destructive text-destructive-foreground" :
              armed ? "bg-coral/40" : "bg-muted text-muted-foreground"
            }`}>
              {live.status === "live" ? `🟢 LIVE${live.viewerCount != null ? ` · ${live.viewerCount}👁` : ""}` :
               live.status === "connecting" ? "🔌 CONNECTING…" :
               live.status === "error" ? "⚠ DITOLAK" :
               armed ? "⏳ TRYING" : "⏸ OFF"}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Browser mencoba konek langsung ke TikTok Live via bridge publik. <b>Sering ditolak reCAPTCHA</b> — kalau gagal, pakai TikFinity di atas.
          </p>
          {live.error && (
            <p className="text-[10px] bg-destructive/10 text-destructive rounded-lg p-2">
              ⚠ {live.error}
            </p>
          )}
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
