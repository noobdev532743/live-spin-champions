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
    <div ref={ref} className="rounded-2xl bg-card/90 backdrop-blur p-2 shadow-clay h-24 overflow-y-auto text-xs space-y-1">
      {recent.length === 0 && (
        <div className="text-muted-foreground text-center py-4 flex flex-col items-center gap-1">
          {armed ? (
            <>
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                Listening for viewers…
              </span>
              <span className="text-[10px] opacity-60">Bridge connected, waiting for TikTok events</span>
            </>
          ) : (
            <>
              <span>Waiting for viewers…</span>
              <span className="text-[10px] opacity-60">Enable "Armed" in settings to start receiving events</span>
            </>
          )}
        </div>
      )}
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
