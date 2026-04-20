import { useGame } from "@/game/store";

export function Leaderboard() {
  const stats = useGame((s) => s.state.stats);
  const eventsCount = useGame((s) => s.state.events.length);
  const activeCount = Object.keys(stats).length;
  const top = Object.values(stats).sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <div className="rounded-2xl bg-card/90 backdrop-blur p-4 shadow-clay">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-base font-bold flex items-center gap-2">
          🏆 Top Viewers
          {eventsCount > 0 && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
            </span>
          )}
        </h3>
        <span className="text-xs text-muted-foreground">{activeCount} active</span>
      </div>
      {top.length === 0 ? (
        <p className="text-sm text-muted-foreground">No actions yet — be the first!</p>
      ) : (
        <ol className="space-y-2">
          {top.map((v, i) => (
            <li key={v.username} className="flex items-center gap-2.5 text-sm animate-pop">
              <span className="w-6 h-6 grid place-items-center rounded-full bg-gradient-bubble text-white font-bold text-xs">{i + 1}</span>
              <span className="font-semibold flex-1 truncate">@{v.username}</span>
              <span className="text-xs text-muted-foreground">
                {v.follows}👥 {v.shares}🔁 {v.gifts}🎁
              </span>
              <span className="font-bold text-primary text-base">{Math.round(v.score)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
