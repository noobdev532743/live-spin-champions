import type { Avatar, GameState, ViewerEvent, Obstacle, ActionType } from "./types";

export const ARENA = { w: 360, h: 360, cx: 180, cy: 180, r: 170 };

const uid = () => Math.random().toString(36).slice(2, 9);

// Generate a profile pic from a username (deterministic)
export function profilePicFor(username: string, customUrl?: string) {
  if (customUrl) return customUrl;
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(username)}&backgroundType=gradientLinear`;
}

export function createAvatar(opts: {
  name: string;
  sprite: string;
  owner?: string;
  team?: "pink" | "blue";
  angle?: number;
}): Avatar {
  const a = opts.angle ?? Math.random() * Math.PI * 2;
  const dist = ARENA.r * (0.3 + Math.random() * 0.4);
  return {
    id: uid(),
    name: opts.name,
    owner: opts.owner ?? opts.name,
    sprite: opts.sprite,
    team: opts.team,
    x: ARENA.cx + Math.cos(a) * dist,
    y: ARENA.cy + Math.sin(a) * dist,
    vx: Math.cos(a + Math.PI / 2) * 18,
    vy: Math.sin(a + Math.PI / 2) * 18,
    spin: 6,
    maxSpin: 12,
    shield: 20,
    hp: 100,
    radius: 24,
    combo: 0,
    lastHitTs: 0,
    invincibleUntil: 0,
    alive: true,
    effects: [],
  };
}

export function initialState(avatars: Avatar[], duration = 300_000): GameState {
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

const MAX_AVATARS = 24;

// Find this viewer's existing spinner (by owner = username)
function findOwned(state: GameState, username: string): Avatar | undefined {
  return state.avatars.find((a) => a.owner === username && a.alive);
}

function spawnFor(state: GameState, ev: ViewerEvent, sizeMultiplier = 1): Avatar {
  const sprite = profilePicFor(ev.username, ev.avatarUrl);
  const ang = Math.random() * Math.PI * 2;
  const av = createAvatar({ name: ev.username, owner: ev.username, sprite, angle: ang });
  av.radius = 22 * sizeMultiplier;
  state.avatars.push(av);
  // cap arena population — kick the weakest already-dead, else weakest alive
  if (state.avatars.length > MAX_AVATARS) {
    const dead = state.avatars.filter((a) => !a.alive);
    if (dead.length) {
      const idx = state.avatars.indexOf(dead[0]);
      state.avatars.splice(idx, 1);
    }
  }
  addFloat(state, av.x, av.y - 30, `✨ @${ev.username} JOINED`, "var(--bubble)");
  return av;
}

export function applyEvent(state: GameState, ev: ViewerEvent) {
  const stat = ensureStat(state, ev.username);
  const now = performance.now();

  // EVERY viewer action either spawns their spinner or buffs the existing one
  let mine = findOwned(state, ev.username);

  if (ev.action === "follow") {
    stat.follows++;
    stat.score += 1;
    if (!mine) {
      mine = spawnFor(state, ev, 1);
    } else {
      // boost existing
      mine.spin = Math.min(mine.maxSpin + 2, mine.spin + 1);
      mine.shield = Math.min(100, mine.shield + 12);
      mine.hp = Math.min(100, mine.hp + 4);
      mine.effects.push({ id: uid(), kind: "boost", until: now + 1500 });
      addFloat(state, mine.x, mine.y - 30, `+SHIELD`, "var(--mint)");
    }
  } else if (ev.action === "share") {
    stat.shares++;
    stat.score += 2;
    if (!mine) {
      mine = spawnFor(state, ev, 1);
      mine.spin = mine.maxSpin; // share spawns with attack-momentum
    }
    // share = attack burst from this spinner outward
    mine.spin = Math.min(mine.maxSpin + 4, mine.spin + 2);
    mine.shield = Math.min(100, mine.shield + 5);
    const ang = Math.random() * Math.PI * 2;
    mine.vx += Math.cos(ang) * 40;
    mine.vy += Math.sin(ang) * 40;
    mine.effects.push({ id: uid(), kind: "attack", until: now + 600 });
    addFloat(state, mine.x, mine.y - 30, `🔁 SHARE`, "var(--coral)");
  } else if (ev.action === "gift") {
    stat.gifts++;
    stat.score += 5 * (ev.giftValue ?? 1);
    if (!mine) {
      mine = spawnFor(state, ev, 1.4); // bigger spawn for gifters
    }
    // gift = mega upgrade: bigger, heal, brief invincibility
    mine.radius = Math.min(36, mine.radius + 2);
    mine.hp = Math.min(100, mine.hp + 25);
    mine.shield = 100;
    mine.spin = mine.maxSpin + 4;
    mine.invincibleUntil = now + 3000;
    mine.effects.push({ id: uid(), kind: "shield", until: now + 3000 });
    addFloat(state, mine.x, mine.y - 30, `🎁 MEGA @${ev.username}`, "var(--bubble)");
  } else if (ev.action === "like") {
    stat.likes++;
    stat.score += 0.2;
    if (mine) {
      mine.spin = Math.min(mine.maxSpin, mine.spin + 0.2);
    }
  }

  state.events.push(ev);
  if (state.events.length > 100) state.events.shift();

  // mini challenge progress
  if (state.challenge && state.challenge.type === ev.action) {
    state.challenge.progress++;
    if (state.challenge.progress >= state.challenge.goal) {
      addFloat(state, ARENA.cx, 40, `🏆 ${state.challenge.reward}`, "var(--accent)");
      state.avatars.forEach((a) => {
        if (a.alive) a.shield = Math.min(100, a.shield + 30);
      });
      state.challenge = undefined;
    }
  }
}

export function step(state: GameState, dt: number) {
  if (state.status !== "running") return;
  const now = performance.now();

  // mini-challenge spawn (rarer)
  if (!state.challenge && Math.random() < 0.0015) {
    const types: ActionType[] = ["follow", "share", "gift"];
    const t = types[Math.floor(Math.random() * types.length)];
    state.challenge = {
      id: uid(),
      label:
        t === "follow"
          ? "Follow x10 in 20s!"
          : t === "share"
            ? "Share x8 in 20s!"
            : "Send 3 gifts in 20s!",
      goal: t === "follow" ? 10 : t === "share" ? 8 : 3,
      progress: 0,
      type: t,
      reward: "Arena Shield Boost",
      endsAt: now + 20000,
    };
  }
  if (state.challenge && now > state.challenge.endsAt) state.challenge = undefined;

  // obstacle spawn (rarer + softer)
  if (state.obstacles.length < 2 && Math.random() < 0.002) {
    const ang = Math.random() * Math.PI * 2;
    const d = ARENA.r * (0.3 + Math.random() * 0.4);
    state.obstacles.push({
      id: uid(),
      x: ARENA.cx + Math.cos(ang) * d,
      y: ARENA.cy + Math.sin(ang) * d,
      radius: 14,
      kind: Math.random() > 0.6 ? "spike" : "bumper",
      bornAt: now,
      ttl: 10000,
    });
  }
  state.obstacles = state.obstacles.filter((o) => now - o.bornAt < o.ttl);

  // movement
  for (const a of state.avatars) {
    if (!a.alive) continue;
    a.x += a.vx * dt * 0.6; // slower world
    a.y += a.vy * dt * 0.6;
    a.vx *= 0.99;
    a.vy *= 0.99;
    const wobbleAng = now * 0.0008 + (parseInt(a.id, 36) % 7);
    a.vx += Math.cos(wobbleAng) * a.spin * 0.18 * dt;
    a.vy += Math.sin(wobbleAng) * a.spin * 0.18 * dt;

    const dx = a.x - ARENA.cx,
      dy = a.y - ARENA.cy;
    const d = Math.hypot(dx, dy);
    if (d + a.radius > ARENA.r) {
      const nx = dx / d,
        ny = dy / d;
      a.x = ARENA.cx + nx * (ARENA.r - a.radius);
      a.y = ARENA.cy + ny * (ARENA.r - a.radius);
      const dot = a.vx * nx + a.vy * ny;
      a.vx -= 2 * dot * nx * 0.7;
      a.vy -= 2 * dot * ny * 0.7;
      // wall scrape — much gentler
      if (now > a.invincibleUntil && a.shield <= 0) a.hp = Math.max(0, a.hp - 0.01);
    }

    // spin & shield decay (very slow)
    a.spin = Math.max(2, a.spin - 0.015 * dt);
    a.shield = Math.max(0, a.shield - 0.3 * dt);

    if (now - a.lastHitTs > 2500) a.combo = Math.max(0, a.combo - dt * 1);
    a.effects = a.effects.filter((e) => e.until > now);

    if (a.hp <= 0 && a.alive) {
      a.alive = false;
      a.destroyedAt = now;
      state.destroyed.push({ id: a.id, name: a.name, killedAt: now });
      addFloat(state, a.x, a.y, `💔 @${a.name}`, "var(--destructive)");
    }
  }

  // collisions
  for (let i = 0; i < state.avatars.length; i++) {
    const a = state.avatars[i];
    if (!a.alive) continue;
    for (let j = i + 1; j < state.avatars.length; j++) {
      const b = state.avatars[j];
      if (!b.alive) continue;
      const dx = b.x - a.x,
        dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 0.01;
      const overlap = a.radius + b.radius - d;
      if (overlap > 0) {
        const nx = dx / d,
          ny = dy / d;
        a.x -= (nx * overlap) / 2;
        a.y -= (ny * overlap) / 2;
        b.x += (nx * overlap) / 2;
        b.y += (ny * overlap) / 2;
        const relVx = b.vx - a.vx,
          relVy = b.vy - a.vy;
        const sep = relVx * nx + relVy * ny;
        if (sep < 0) {
          // softer bounce
          const k = -sep * 0.5;
          a.vx -= nx * k;
          a.vy -= ny * k;
          b.vx += nx * k;
          b.vy += ny * k;
          // clamp velocity so collisions never fling spinners
          const MAX_V = 90;
          const va = Math.hypot(a.vx, a.vy);
          if (va > MAX_V) {
            a.vx = (a.vx / va) * MAX_V;
            a.vy = (a.vy / va) * MAX_V;
          }
          const vb = Math.hypot(b.vx, b.vy);
          if (vb > MAX_V) {
            b.vx = (b.vx / vb) * MAX_V;
            b.vy = (b.vy / vb) * MAX_V;
          }
          const power = Math.abs(a.spin - b.spin) * 0.25 + 0.4;
          if (now > a.invincibleUntil) {
            const reduce = a.shield > 0 ? 0.2 : 1;
            a.hp = Math.max(0, a.hp - power * reduce);
            a.shield = Math.max(0, a.shield - 3);
          }
          if (now > b.invincibleUntil) {
            const reduce = b.shield > 0 ? 0.2 : 1;
            b.hp = Math.max(0, b.hp - power * reduce);
            b.shield = Math.max(0, b.shield - 3);
          }
          a.lastHitTs = now;
          b.lastHitTs = now;
        }
      }
    }

    for (const o of state.obstacles) {
      const dx = a.x - o.x,
        dy = a.y - o.y;
      const d = Math.hypot(dx, dy) || 0.01;
      const overlap = a.radius + o.radius - d;
      if (overlap > 0) {
        const nx = dx / d,
          ny = dy / d;
        a.x += nx * overlap;
        a.y += ny * overlap;
        if (o.kind === "bumper") {
          a.vx += nx * 120;
          a.vy += ny * 120;
        } else {
          a.vx += nx * 50;
          a.vy += ny * 50;
          if (now > a.invincibleUntil) a.hp = Math.max(0, a.hp - 2);
        }
      }
    }
  }

  state.floats = state.floats.filter((f) => now - f.ts < 1500);

  // end ONLY on timer (so the arena keeps filling). If everyone happens to die
  // and no spinners remain, end early.
  const aliveList = state.avatars.filter((a) => a.alive);
  if (now >= state.endsAt) {
    state.status = "ended";
    state.winner =
      aliveList.sort((a, b) => b.hp - a.hp)[0] ??
      state.avatars.slice().sort((a, b) => (b.destroyedAt ?? 0) - (a.destroyedAt ?? 0))[0];
  } else if (state.avatars.length >= 2 && aliveList.length === 0) {
    state.status = "ended";
    state.winner = state.avatars.slice().sort((a, b) => (b.destroyedAt ?? 0) - (a.destroyedAt ?? 0))[0];
  }
}

export function startGame(state: GameState) {
  state.status = "running";
  state.startedAt = performance.now();
  state.endsAt = state.startedAt + state.duration;
  state.destroyed = [];
  state.winner = undefined;
}
