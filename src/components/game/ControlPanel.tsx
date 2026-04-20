import { useGame } from "@/game/store";
import { useEffect, useRef, useState } from "react";

const RANDOM_USERS = [
  "zoe_99", "kai.dev", "lila_x", "marco88", "nova_kim", "tomi", "hana.q", "benji",
  "ria_v", "milo", "ayu", "rio", "nara", "tata", "evan", "kira", "luna",
  "dewi", "bagus", "intan", "joko", "rani", "sari", "bayu", "putra", "wulan",
];

export function ControlPanel() {
  const { state, enqueue, start, reset } = useGame();
  const [auto, setAuto] = useState(false);
  const [rate, setRate] = useState(2);
  const intRef = useRef<number | null>(null);

  useEffect(() => {
    if (!auto) {
      if (intRef.current) window.clearInterval(intRef.current);
      return;
    }
    intRef.current = window.setInterval(() => {
      // weighted: lots of follows + likes, fewer shares, rare gifts
      const actions = ["follow", "follow", "follow", "share", "share", "like", "like", "like", "gift"] as const;
      const action = actions[Math.floor(Math.random() * actions.length)];
      const username = RANDOM_USERS[Math.floor(Math.random() * RANDOM_USERS.length)];
      enqueue({
        id: Math.random().toString(36).slice(2),
        username,
        action,
        ts: Date.now(),
      });
    }, 1000 / rate);
    return () => {
      if (intRef.current) window.clearInterval(intRef.current);
    };
  }, [auto, rate, enqueue]);

  const fire = (action: "follow" | "share" | "gift" | "like") => {
    // each click = a different "viewer" so a new spinner spawns
    const username = RANDOM_USERS[Math.floor(Math.random() * RANDOM_USERS.length)] + "_" + Math.random().toString(36).slice(2, 4);
    enqueue({ id: Math.random().toString(36).slice(2), username, action, ts: Date.now() });
  };

  return (
    <div className="rounded-2xl bg-card/90 backdrop-blur p-3 shadow-clay space-y-3">
      <h3 className="font-display text-sm font-bold">🎮 Demo Controls</h3>
      <p className="text-[10px] text-muted-foreground -mt-2">Each click = new viewer spawns a spinner with their profile pic</p>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => fire("follow")} className="rounded-xl bg-mint text-foreground py-2 text-xs font-bold shadow-pop active:translate-y-0.5">
          👥 Follow → spawn
        </button>
        <button onClick={() => fire("share")} className="rounded-xl bg-coral text-white py-2 text-xs font-bold shadow-pop active:translate-y-0.5">
          🔁 Share → spawn
        </button>
        <button onClick={() => fire("like")} className="rounded-xl bg-sky text-foreground py-2 text-xs font-bold shadow-pop active:translate-y-0.5">
          ❤️ Like → buff
        </button>
        <button onClick={() => fire("gift")} className="rounded-xl bg-gradient-bubble text-white py-2 text-xs font-bold shadow-pop active:translate-y-0.5">
          🎁 Gift → MEGA
        </button>
      </div>

      <label className="flex items-center justify-between text-xs">
        <span className="font-semibold">🤖 Auto viewers</span>
        <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="w-4 h-4 accent-primary" />
      </label>
      {auto && (
        <label className="block text-xs">
          <div className="flex justify-between mb-1">
            <span>Rate</span>
            <span className="font-mono">{rate}/s</span>
          </div>
          <input type="range" min={1} max={6} value={rate} onChange={(e) => setRate(+e.target.value)} className="w-full accent-primary" />
        </label>
      )}

      <div className="flex gap-2 pt-1 border-t border-border">
        {state.status === "lobby" && (
          <button onClick={start} className="flex-1 rounded-xl bg-primary text-primary-foreground py-2 text-xs font-bold shadow-pop">
            ▶ Start Battle (5 min)
          </button>
        )}
        {state.status !== "lobby" && (
          <button onClick={() => reset()} className="flex-1 rounded-xl bg-secondary py-2 text-xs font-bold">
            ↺ New Battle
          </button>
        )}
      </div>
    </div>
  );
}
