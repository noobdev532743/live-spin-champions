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
      const dt = Math.min(0.05, (now - lastRef.current) / 1000) * 60; // normalize ~60fps
      lastRef.current = now;
      tick(dt);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [tick]);

  return (
    <div className="relative mx-auto" style={{ width: ARENA.w, height: ARENA.h }}>
      {/* Arena bowl */}
      <div
        className="absolute inset-0 rounded-full bg-gradient-arena shadow-clay"
        style={{ border: "8px solid var(--arena-rim)" }}
      />
      <div className="absolute inset-6 rounded-full opacity-30"
        style={{ background: "radial-gradient(circle at 35% 30%, white, transparent 50%)" }} />

      {/* Obstacles */}
      {state.obstacles.map((o) => (
        <div key={o.id}
          className="absolute rounded-full animate-pop"
          style={{
            left: o.x - o.radius,
            top: o.y - o.radius,
            width: o.radius * 2,
            height: o.radius * 2,
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
        return (
          <div key={a.id}
            className="absolute"
            style={{
              left: a.x - a.radius,
              top: a.y - a.radius,
              width: a.radius * 2,
              height: a.radius * 2,
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
              width={56}
              height={56}
              className={hit ? "animate-shake" : ""}
              style={{
                width: "100%", height: "100%", objectFit: "contain",
                animation: a.alive ? `spin-fast ${Math.max(0.15, 1.4 / a.spin)}s linear infinite` : undefined,
                filter: "drop-shadow(0 4px 6px rgba(0,0,0,.3))",
              }}
            />
            {/* HP bar */}
            <div className="absolute -bottom-3 left-0 right-0 h-1.5 rounded-full bg-black/30 overflow-hidden">
              <div className="h-full transition-all"
                style={{ width: `${a.hp}%`, background: a.hp > 50 ? "var(--mint)" : a.hp > 25 ? "var(--accent)" : "var(--destructive)" }} />
            </div>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold font-display whitespace-nowrap px-1.5 py-0.5 rounded-full bg-card/90 shadow">
              {a.name}
            </div>
          </div>
        );
      })}

      {/* Floating texts */}
      {state.floats.map((f) => (
        <div key={f.id}
          className="absolute text-xs font-bold font-display pointer-events-none animate-float-up"
          style={{ left: f.x - 30, top: f.y, color: f.color, textShadow: "0 1px 2px rgba(0,0,0,.4)" }}
        >
          {f.text}
        </div>
      ))}
    </div>
  );
}
