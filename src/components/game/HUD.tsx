import { useGame } from "@/game/store";
import { useEffect, useState } from "react";

export function HUD() {
  const { state } = useGame();
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setMounted(true);
    setNow(performance.now());
    const id = setInterval(() => setNow(performance.now()), 200);
    return () => clearInterval(id);
  }, []);

  const remaining = !mounted
    ? state.duration
    : state.status === "running" ? Math.max(0, state.endsAt - now) : state.duration;
  const sec = Math.ceil(remaining / 1000);
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  const aliveCount = state.avatars.filter((a) => a.alive).length;
  const urgent = mounted && sec <= 10 && state.status === "running";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="rounded-2xl bg-card/90 px-4 py-3 shadow-clay">
          <div className="text-xs text-muted-foreground font-semibold">ALIVE</div>
          <div className="font-display font-bold text-2xl leading-none">{aliveCount}/{state.avatars.length}</div>
        </div>
        <div className={`rounded-2xl px-5 py-3 shadow-clay font-display font-bold text-4xl tabular-nums ${urgent ? "bg-destructive text-destructive-foreground animate-wobble" : "bg-card/90"}`}>
          {mm}:{ss}
        </div>
        <div className="rounded-2xl bg-card/90 px-4 py-3 shadow-clay">
          <div className="text-xs text-muted-foreground font-semibold">EVENTS</div>
          <div className="font-display font-bold text-2xl leading-none">{state.events.length}</div>
        </div>
      </div>

      {state.challenge && (
        <div className="rounded-2xl bg-gradient-victory px-4 py-3 shadow-clay animate-pop">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold font-display">⏱ {state.challenge.label}</div>
            <div className="text-sm font-mono font-bold">{state.challenge.progress}/{state.challenge.goal}</div>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-black/20 overflow-hidden">
            <div className="h-full bg-white" style={{ width: `${(state.challenge.progress / state.challenge.goal) * 100}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
