import type { Avatar, GameState, ViewerEvent, FloatingText, Obstacle, MiniChallenge, ActionType } from "./types";

export const ARENA = { w: 360, h: 360, cx: 180, cy: 180, r: 170 };

const uid = () => Math.random().toString(36).slice(2, 9);

export function createAvatar(opts: { name: string; sprite: string; owner?: string; team?: "pink" | "blue"; angle?: number }): Avatar {
  const a = opts.angle ?? Math.random() * Math.PI * 2;
  const dist = ARENA.r * 0.55;
  return {
    id: uid(),
    name: opts.name,
    owner: opts.owner ?? opts.name,
    sprite: opts.sprite,
    team: opts.team,
    x: ARENA.cx + Math.cos(a) * dist,
    y: ARENA.cy + Math.sin(a) * dist,
    vx: Math.cos(a + Math.PI / 2) * 30,
    vy: Math.sin(a + Math.PI / 2) * 30,
    spin: 8,
    maxSpin: 14,
    shield: 0,
    hp: 100,
    radius: 28,
    combo: 0,
    lastHitTs: 0,
    invincibleUntil: 0,
    alive: true,
    effects: [],
  };
}

export function initialState(avatars: Avatar[], duration = 120_000): GameState {
  return {
    status: "lobby",
    startedAt: 0,
    endsAt: 0,
    duration,
    avatars,
    obstacles: [],
    floats: [],
    events: [],
    stats: {},
    destroyed: [],
  };
}

function addFloat(state: GameState, x: number, y: number, text: string, color: string) {
  state.floats.push({ id: uid(), x, y, text, color, ts: performance.now() });
  if (state.floats.length > 40) state.floats.shift();
}

function ensureStat(state: GameState, username: string) {
  if (!state.stats[username]) {
    state.stats[username] = { username, follows: 0, shares: 0, gifts: 0, likes: 0, score: 0 };
  }
  return state.stats[username];
}

function pickTarget(state: GameState, preferredId?: string): Avatar | undefined {
  const alive = state.avatars.filter((a) => a.alive);
  if (preferredId) {
    const t = alive.find((a) => a.id === preferredId);
    if (t) return t;
  }
  return alive[Math.floor(Math.random() * alive.length)];
}

export function applyEvent(state: GameState, ev: ViewerEvent) {
  const stat = ensureStat(state, ev.username);
  const now = performance.now();

  if (ev.action === "follow") {
    stat.follows++; stat.score += 1;
    const target = pickTarget(state, ev.targetId);
    if (!target) return;
    target.spin = Math.min(target.maxSpin + 4, target.spin + 1.5);
    target.shield = Math.min(100, target.shield + 8);
    target.combo++;
    target.effects.push({ id: uid(), kind: "boost", until: now + 1500 });
    addFloat(state, target.x, target.y - 30, `+SPIN @${ev.username}`, "var(--mint)");
  } else if (ev.action === "share") {
    stat.shares++; stat.score += 2;
    const target = pickTarget(state, ev.targetId);
    if (!target) return;
    // push attack
    const ang = Math.random() * Math.PI * 2;
    target.vx += Math.cos(ang) * 80;
    target.vy += Math.sin(ang) * 80;
    if (now > target.invincibleUntil) {
      const dmg = target.shield > 0 ? 4 : 8;
      target.shield = Math.max(0, target.shield - 10);
      target.hp = Math.max(0, target.hp - dmg);
      target.lastHitTs = now;
      target.combo++;
    }
    target.effects.push({ id: uid(), kind: "attack", until: now + 600 });
    addFloat(state, target.x, target.y - 30, `💥 ${ev.username}`, "var(--coral)");
  } else if (ev.action === "gift") {
    stat.gifts++; stat.score += 5 * (ev.giftValue ?? 1);
    const target = pickTarget(state, ev.targetId);
    if (!target) return;
    // mega: damage all others or invincibility for target
    if (Math.random() > 0.5) {
      target.invincibleUntil = now + 4000;
      target.shield = 100;
      target.effects.push({ id: uid(), kind: "shield", until: now + 4000 });
      addFloat(state, target.x, target.y - 30, `🛡 INVINCIBLE`, "var(--accent)");
    } else {
      state.avatars.forEach((a) => {
        if (a.id !== target.id && a.alive && now > a.invincibleUntil) {
          a.hp = Math.max(0, a.hp - 15);
          a.vx += (a.x - target.x) * 0.8;
          a.vy += (a.y - target.y) * 0.8;
          a.effects.push({ id: uid(), kind: "mega", until: now + 800 });
        }
      });
      addFloat(state, target.x, target.y - 30, `🎁 MEGA ${ev.username}`, "var(--bubble)");
    }
  } else if (ev.action === "like") {
    stat.likes++; stat.score += 0.2;
    const target = pickTarget(state, ev.targetId);
    if (!target) return;
    target.spin = Math.min(target.maxSpin, target.spin + 0.3);
  }

  // Combo detection: 5+ events on same target within 2s -> super spin
  const target = pickTarget(state, ev.targetId);
  if (target && target.combo >= 6) {
    target.combo = 0;
    target.spin = target.maxSpin + 6;
    target.shield = 100;
    target.effects.push({ id: uid(), kind: "combo", until: now + 2000 });
    addFloat(state, target.x, target.y - 50, `⚡ SUPER SPIN!`, "var(--bubble)");
  }

  state.events.push(ev);
  if (state.events.length > 100) state.events.shift();

  // mini challenge progress
  if (state.challenge && state.challenge.type === ev.action) {
    state.challenge.progress++;
    if (state.challenge.progress >= state.challenge.goal) {
      addFloat(state, ARENA.cx, 40, `🏆 ${state.challenge.reward}`, "var(--accent)");
      state.avatars.forEach((a) => { if (a.alive) a.shield = Math.min(100, a.shield + 30); });
      state.challenge = undefined;
    }
  }
}

export function step(state: GameState, dt: number) {
  if (state.status !== "running") return;
  const now = performance.now();

  // mini-challenge spawn
  if (!state.challenge && Math.random() < 0.003) {
    const types: ActionType[] = ["follow", "share", "gift"];
    const t = types[Math.floor(Math.random() * types.length)];
    state.challenge = {
      id: uid(),
      label: t === "follow" ? "Follow x10 in 15s!" : t === "share" ? "Share x8 in 15s!" : "Send 3 gifts in 15s!",
      goal: t === "follow" ? 10 : t === "share" ? 8 : 3,
      progress: 0,
      type: t,
      reward: "Team Shield Boost",
      endsAt: now + 15000,
    };
  }
  if (state.challenge && now > state.challenge.endsAt) state.challenge = undefined;

  // obstacle spawn
  if (state.obstacles.length < 2 && Math.random() < 0.004) {
    const ang = Math.random() * Math.PI * 2;
    const d = ARENA.r * (0.3 + Math.random() * 0.4);
    state.obstacles.push({
      id: uid(),
      x: ARENA.cx + Math.cos(ang) * d,
      y: ARENA.cy + Math.sin(ang) * d,
      radius: 16,
      kind: Math.random() > 0.5 ? "spike" : "bumper",
      bornAt: now,
      ttl: 8000,
    });
  }
  state.obstacles = state.obstacles.filter((o) => now - o.bornAt < o.ttl);

  // movement
  for (const a of state.avatars) {
    if (!a.alive) continue;
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    // friction
    a.vx *= 0.985;
    a.vy *= 0.985;
    // tiny chaotic drift from spin
    const wobbleAng = now * 0.001 + parseInt(a.id, 36) % 7;
    a.vx += Math.cos(wobbleAng) * a.spin * 0.4 * dt;
    a.vy += Math.sin(wobbleAng) * a.spin * 0.4 * dt;

    // arena bounds (circular)
    const dx = a.x - ARENA.cx, dy = a.y - ARENA.cy;
    const d = Math.hypot(dx, dy);
    if (d + a.radius > ARENA.r) {
      const nx = dx / d, ny = dy / d;
      a.x = ARENA.cx + nx * (ARENA.r - a.radius);
      a.y = ARENA.cy + ny * (ARENA.r - a.radius);
      const dot = a.vx * nx + a.vy * ny;
      a.vx -= 2 * dot * nx * 0.7;
      a.vy -= 2 * dot * ny * 0.7;
      // wall scrape damages a tiny bit
      if (now > a.invincibleUntil && a.shield <= 0) a.hp = Math.max(0, a.hp - 0.05);
    }

    // spin decays
    a.spin = Math.max(2, a.spin - 0.05 * dt);
    a.shield = Math.max(0, a.shield - 1 * dt);

    // combo decay
    if (now - a.lastHitTs > 2000) a.combo = Math.max(0, a.combo - dt * 2);

    a.effects = a.effects.filter((e) => e.until > now);

    // death
    if (a.hp <= 0 && a.alive) {
      a.alive = false;
      a.destroyedAt = now;
      state.destroyed.push({ id: a.id, name: a.name, killedAt: now });
      addFloat(state, a.x, a.y, `💔 ${a.name}`, "var(--destructive)");
    }
  }

  // collisions
  for (let i = 0; i < state.avatars.length; i++) {
    const a = state.avatars[i];
    if (!a.alive) continue;
    for (let j = i + 1; j < state.avatars.length; j++) {
      const b = state.avatars[j];
      if (!b.alive) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 0.01;
      const overlap = a.radius + b.radius - d;
      if (overlap > 0) {
        const nx = dx / d, ny = dy / d;
        a.x -= nx * overlap / 2; a.y -= ny * overlap / 2;
        b.x += nx * overlap / 2; b.y += ny * overlap / 2;
        const relVx = b.vx - a.vx, relVy = b.vy - a.vy;
        const sep = relVx * nx + relVy * ny;
        if (sep < 0) {
          const k = -sep * 1.6;
          a.vx -= nx * k; a.vy -= ny * k;
          b.vx += nx * k; b.vy += ny * k;
          // damage based on relative spin
          const power = (a.spin + b.spin) * 0.4;
          if (now > a.invincibleUntil) {
            const reduce = a.shield > 0 ? 0.3 : 1;
            a.hp = Math.max(0, a.hp - power * reduce);
            a.shield = Math.max(0, a.shield - 6);
          }
          if (now > b.invincibleUntil) {
            const reduce = b.shield > 0 ? 0.3 : 1;
            b.hp = Math.max(0, b.hp - power * reduce);
            b.shield = Math.max(0, b.shield - 6);
          }
          a.lastHitTs = now; b.lastHitTs = now;
        }
      }
    }

    // obstacles
    for (const o of state.obstacles) {
      const dx = a.x - o.x, dy = a.y - o.y;
      const d = Math.hypot(dx, dy) || 0.01;
      const overlap = a.radius + o.radius - d;
      if (overlap > 0) {
        const nx = dx / d, ny = dy / d;
        a.x += nx * overlap; a.y += ny * overlap;
        if (o.kind === "bumper") {
          a.vx += nx * 200; a.vy += ny * 200;
        } else {
          a.vx += nx * 80; a.vy += ny * 80;
          if (now > a.invincibleUntil) a.hp = Math.max(0, a.hp - 6);
        }
      }
    }
  }

  // cleanup floats
  state.floats = state.floats.filter((f) => now - f.ts < 1300);

  // end conditions
  const aliveList = state.avatars.filter((a) => a.alive);
  if (now >= state.endsAt || aliveList.length <= 1) {
    state.status = "ended";
    state.winner = aliveList[0] ?? state.avatars.slice().sort((a, b) => (b.destroyedAt ?? 0) - (a.destroyedAt ?? 0))[0];
  }
}

export function startGame(state: GameState) {
  state.status = "running";
  state.startedAt = performance.now();
  state.endsAt = state.startedAt + state.duration;
  state.destroyed = [];
  state.winner = undefined;
}
