import { useGame } from "@/game/store";
import { useMemo } from "react";

export function Leaderboard() {
  const stats = useGame((s) => s.state.stats);
  const top = useMemo(() => Object.values(stats).sort((a, b) => b.score - a.score).slice(0, 5), [stats]);

  return (
    <div className="rounded-2xl bg-card/90 backdrop-blur p-3 shadow-clay">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-sm font-bold">🏆 Top Viewers</h3>
        <span className="text-[10px] text-muted-foreground">{Object.keys(stats).length} active</span>
      </div>
      {top.length === 0 ? (
        <p className="text-xs text-muted-foreground">No actions yet — be the first!</p>
      ) : (
        <ol className="space-y-1.5">
          {top.map((v, i) => (
            <li key={v.username} className="flex items-center gap-2 text-xs">
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
