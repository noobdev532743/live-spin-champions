import { useGame } from "@/game/store";

export function Leaderboard() {
  const stats = useGame((s) => s.state.stats);
  const eventsCount = useGame((s) => s.state.events.length);
  const activeCount = Object.keys(stats).length;
  const top = Object.values(stats).sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <div className="rounded-2xl bg-card/90 backdrop-blur p-3 shadow-clay">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-sm font-bold flex items-center gap-1.5">
          🏆 Top Viewers
          {eventsCount > 0 && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
          )}
        </h3>
        <span className="text-[10px] text-muted-foreground">{activeCount} active</span>
      </div>
      {top.length === 0 ? (
        <p className="text-xs text-muted-foreground">No actions yet — be the first!</p>
      ) : (
        <ol className="space-y-1.5">
          {top.map((v, i) => (
            <li key={v.username} className="flex items-center gap-2 text-xs animate-pop">
              <span className="w-5 h-5 grid place-items-center rounded-full bg-gradient-bubble text-white font-bold text-[10px]">{i + 1}</span>
              <span className="font-semibold flex-1 truncate">@{v.username}</span>
              <span className="text-[10px] text-muted-foreground">
                {v.follows}👥 {v.shares}🔁 {v.gifts}🎁
              </span>
              <span className="font-bold text-primary">{Math.round(v.score)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
