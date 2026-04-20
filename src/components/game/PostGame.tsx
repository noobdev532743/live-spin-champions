import { useGame } from "@/game/store";

export function PostGame() {
  const { state, reset } = useGame();
  if (state.status !== "ended") return null;

  const stats = Object.values(state.stats).sort((a, b) => b.score - a.score);
  const mostActive = stats[0];
  const mostDestroyed = state.destroyed[0];
  const winner = state.winner;

  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur p-4 animate-pop">
      <div className="w-full max-w-sm rounded-3xl bg-card shadow-clay p-5 space-y-4">
        <div className="text-center">
          <div className="text-xs text-muted-foreground font-bold tracking-widest">WINNER</div>
          <h2 className="font-display text-3xl font-bold text-primary">🏆 {winner?.name ?? "—"}</h2>
          {winner && <img src={winner.sprite} alt={winner.name} width={120} height={120} className="mx-auto animate-wobble" style={{filter:"drop-shadow(0 8px 12px rgba(0,0,0,.3))"}} />}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-secondary p-2">
            <div className="text-[10px] text-muted-foreground">Most Active</div>
            <div className="font-display font-bold truncate">@{mostActive?.username ?? "—"}</div>
          </div>
          <div className="rounded-xl bg-secondary p-2">
            <div className="text-[10px] text-muted-foreground">First Down</div>
            <div className="font-display font-bold truncate">{mostDestroyed?.name ?? "—"}</div>
          </div>
          <div className="rounded-xl bg-secondary p-2 col-span-2">
            <div className="text-[10px] text-muted-foreground">Total Events</div>
            <div className="font-display font-bold">{state.events.length} viewer actions</div>
          </div>
        </div>

        <button onClick={() => reset(4)} className="w-full rounded-2xl bg-primary text-primary-foreground py-3 font-display font-bold shadow-pop">
          Play Again ✨
        </button>
      </div>
    </div>
  );
}
