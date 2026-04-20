import { useGame } from "@/game/store";
import { useEffect, useRef } from "react";

export function EventTicker() {
  const events = useGame((s) => s.state.events);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [events.length]);
  const recent = events.slice(-8);
  const icon = (a: string) => a === "follow" ? "👥" : a === "share" ? "🔁" : a === "gift" ? "🎁" : "❤️";

  return (
    <div ref={ref} className="rounded-2xl bg-card/90 backdrop-blur p-2 shadow-clay h-24 overflow-y-auto text-xs space-y-1">
      {recent.length === 0 && <div className="text-muted-foreground text-center py-4">Waiting for viewers…</div>}
      {recent.map((e) => (
        <div key={e.id} className="flex items-center gap-1.5 animate-pop">
          <span>{icon(e.action)}</span>
          <span className="font-bold">@{e.username}</span>
          <span className="text-muted-foreground">{e.action}</span>
        </div>
      ))}
    </div>
  );
}
