import { useGame } from "@/game/store";
import { useEffect, useRef } from "react";

export function EventTicker() {
  const events = useGame((s) => s.state.events);
  const armed = useGame((s) => s.state.armed ?? false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [events.length]);

  const recent = events.slice(-8);
  const icon = (a: string) => a === "follow" ? "👥" : a === "share" ? "🔁" : a === "gift" ? "🎁" : "❤️";

  return (
    <div ref={ref} className="rounded-2xl bg-card/90 backdrop-blur p-3 shadow-clay h-32 overflow-y-auto text-sm space-y-1.5">
      {recent.length === 0 && (
        <div className="text-muted-foreground text-center py-6 flex flex-col items-center gap-1.5">
          {armed ? (
            <>
              <span className="flex items-center gap-2 text-base">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
                Listening for viewers…
              </span>
              <span className="text-xs opacity-60">Bridge connected, waiting for TikTok events</span>
            </>
          ) : (
            <>
              <span className="text-base">Waiting for viewers…</span>
              <span className="text-xs opacity-60">Enable "Armed" in settings to start receiving events</span>
            </>
          )}
        </div>
      )}
      {recent.map((e) => (
        <div key={e.id} className="flex items-center gap-2 animate-pop">
          <span className="text-base">{icon(e.action)}</span>
          <span className="font-bold text-sm">@{e.username}</span>
          <span className="text-muted-foreground text-sm">{e.action}</span>
        </div>
      ))}
    </div>
  );
}
