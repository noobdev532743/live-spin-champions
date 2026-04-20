import { useEffect, useRef } from "react";
import { useGame } from "@/game/store";
import { ARENA } from "@/game/engine";

export function Arena() {
  const { state, tick } = useGame();
  const lastRef = useRef(performance.now());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const loop = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastRef.current) / 1000) * 60;
      lastRef.current = now;
      tick(dt);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [tick]);

  return (
    <div className="relative w-full" style={{ maxWidth: ARENA.w, aspectRatio: "1/1" }}>
      <svg viewBox={`0 0 ${ARENA.w} ${ARENA.h}`} className="w-full h-full" style={{ display: "block" }}>
        {/* Arena bowl */}
        <circle cx={ARENA.cx} cy={ARENA.cy} r={ARENA.r} fill="url(#arenaGrad)" stroke="var(--arena-rim)" strokeWidth={8} />
        <defs>
          <radialGradient id="arenaGrad" cx="30%" cy="25%">
            <stop offset="0%" stopColor="oklch(0.95 0.04 200)" />
            <stop offset="60%" stopColor="oklch(0.82 0.1 220)" />
            <stop offset="100%" stopColor="oklch(0.65 0.14 270)" />
          </radialGradient>
        </defs>
        {/* Highlight */}
        <circle cx={ARENA.cx * 0.7} cy={ARENA.cy * 0.6} r={ARENA.r * 0.4} fill="white" opacity={0.15} />
      </svg>

      {/* Obstacles */}
      {state.obstacles.map((o) => (
        <div key={o.id}
          className="absolute rounded-full animate-pop"
          style={{
            left: `${(o.x - o.radius) / ARENA.w * 100}%`,
            top: `${(o.y - o.radius) / ARENA.h * 100}%`,
            width: `${o.radius * 2 / ARENA.w * 100}%`,
            height: `${o.radius * 2 / ARENA.h * 100}%`,
            background: o.kind === "spike" ? "var(--destructive)" : "var(--accent)",
            border: "3px solid white",
            boxShadow: "0 4px 12px rgba(0,0,0,.25)",
          }}
        >
          <div className="flex h-full w-full items-center justify-center text-lg">
            {o.kind === "spike" ? "⚠️" : "🌟"}
          </div>
        </div>
      ))}

      {/* Avatars */}
      {state.avatars.map((a) => {
        const hasShield = a.shield > 0 || a.invincibleUntil > performance.now();
        const hit = a.effects.some((e) => e.kind === "attack" || e.kind === "mega");
        const pctX = (a.x - a.radius) / ARENA.w * 100;
        const pctY = (a.y - a.radius) / ARENA.h * 100;
        const pctW = (a.radius * 2) / ARENA.w * 100;
        const pctH = (a.radius * 2) / ARENA.h * 100;
        return (
          <div key={a.id}
            className="absolute"
            style={{
              left: `${pctX}%`,
              top: `${pctY}%`,
              width: `${pctW}%`,
              height: `${pctH}%`,
              transition: "opacity .4s",
              opacity: a.alive ? 1 : 0.15,
              filter: a.alive ? undefined : "grayscale(1)",
            }}
          >
            {hasShield && (
              <div className="absolute inset-[-8px] rounded-full pointer-events-none"
                style={{ border: "3px solid var(--accent)", boxShadow: "0 0 18px var(--accent)" }} />
            )}
            <img
              src={a.sprite}
              alt={a.name}
              className={hit ? "animate-shake" : ""}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "9999px",
                border: "3px solid white",
                background: "white",
                animation: a.alive ? `spin-fast ${Math.max(0.25, 2 / a.spin)}s linear infinite` : undefined,
                boxShadow: "0 4px 10px rgba(0,0,0,.35), inset 0 -3px 0 rgba(0,0,0,.15)",
              }}
            />
            {/* HP bar */}
            <div className="absolute -bottom-2 left-0 right-0 h-1.5 rounded-full bg-black/30 overflow-hidden">
              <div className="h-full transition-all"
                style={{ width: `${a.hp}%`, background: a.hp > 50 ? "var(--mint)" : a.hp > 25 ? "var(--accent)" : "var(--destructive)" }} />
            </div>
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-bold font-display whitespace-nowrap px-2 py-0.5 rounded-full bg-card/90 shadow">
              {a.name}
            </div>
          </div>
        );
      })}

      {/* Sparks */}
      {state.sparks.map((s) => {
        const size = 18 + s.intensity * 28;
        const isSpike = s.kind === "spike";
        return (
          <div
            key={s.id}
            className="absolute pointer-events-none animate-spark"
            style={{
              left: `${(s.x - size / 2) / ARENA.w * 100}%`,
              top: `${(s.y - size / 2) / ARENA.h * 100}%`,
              width: `${size / ARENA.w * 100}%`,
              height: `${size / ARENA.h * 100}%`,
              borderRadius: "9999px",
              background: isSpike
                ? "radial-gradient(circle, var(--accent) 0%, var(--coral) 40%, transparent 70%)"
                : "radial-gradient(circle, white 0%, var(--bubble) 35%, transparent 70%)",
              mixBlendMode: "screen",
            }}
          />
        );
      })}

      {/* Floating texts */}
      {state.floats.map((f) => (
        <div key={f.id}
          className="absolute text-sm font-bold font-display pointer-events-none animate-float-up"
          style={{ left: `${(f.x - 30) / ARENA.w * 100}%`, top: `${f.y / ARENA.h * 100}%`, color: f.color, textShadow: "0 1px 2px rgba(0,0,0,.4)" }}
        >
          {f.text}
        </div>
      ))}
    </div>
  );
}
