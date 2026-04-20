import { useGame } from "@/game/store";

export function SettingsPanel() {
  const state = useGame((s) => s.state);
  const setDurationMinutes = useGame((s) => s.setDurationMinutes);
  const setSpinMul = useGame((s) => s.setSpinMul);
  const setBounceMul = useGame((s) => s.setBounceMul);

  const minutes = Math.round(state.duration / 60_000);
  const locked = state.status === "running";

  return (
    <div className="rounded-2xl bg-card/90 backdrop-blur p-3 shadow-clay space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold">⚙️ Game Settings</h3>
        {locked && <span className="text-[10px] text-muted-foreground">locked while live</span>}
      </div>

      <label className="block text-xs">
        <div className="flex justify-between mb-1">
          <span className="font-semibold">⏱ Duration</span>
          <span className="font-mono">{minutes} min</span>
        </div>
        <input
          type="range" min={1} max={15} step={1}
          value={minutes}
          disabled={locked}
          onChange={(e) => setDurationMinutes(+e.target.value)}
          className="w-full accent-primary disabled:opacity-50"
        />
      </label>

      <label className="block text-xs">
        <div className="flex justify-between mb-1">
          <span className="font-semibold">🌀 Spin / move speed</span>
          <span className="font-mono">{state.settings.spinMul.toFixed(2)}×</span>
        </div>
        <input
          type="range" min={0.3} max={2} step={0.05}
          value={state.settings.spinMul}
          onChange={(e) => setSpinMul(+e.target.value)}
          className="w-full accent-primary"
        />
      </label>

      <label className="block text-xs">
        <div className="flex justify-between mb-1">
          <span className="font-semibold">💥 Collision bounce</span>
          <span className="font-mono">{state.settings.bounceMul.toFixed(2)}×</span>
        </div>
        <input
          type="range" min={0.2} max={2} step={0.05}
          value={state.settings.bounceMul}
          onChange={(e) => setBounceMul(+e.target.value)}
          className="w-full accent-primary"
        />
        <p className="text-[10px] text-muted-foreground mt-1">
          Lower = softer, slower bumps. Higher = stronger knockback.
        </p>
      </label>
    </div>
  );
}
