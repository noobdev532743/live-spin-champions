export type ActionType = "follow" | "share" | "gift" | "like";

export interface ViewerEvent {
  id: string;
  username: string;
  action: ActionType;
  avatarUrl?: string; // viewer profile pic
  targetId?: string;
  giftValue?: number;
  ts: number;
}

export interface Avatar {
  id: string;
  name: string;
  owner: string; // viewer who "owns" / customized it
  sprite: string;
  team?: "pink" | "blue";
  x: number;
  y: number;
  vx: number;
  vy: number;
  spin: number; // current spin rate (rad/s) -> health proxy
  maxSpin: number;
  shield: number; // 0..100
  hp: number; // 0..100 (when 0, eliminated)
  radius: number;
  combo: number;
  lastHitTs: number;
  invincibleUntil: number;
  alive: boolean;
  destroyedAt?: number;
  effects: Effect[];
}

export interface Effect {
  id: string;
  kind: "boost" | "attack" | "shield" | "mega" | "combo";
  until: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  ts: number;
}

export interface Spark {
  id: string;
  x: number;
  y: number;
  ts: number;
  ttl: number; // ms
  intensity: number; // 0..1, scales size
  kind: "puff" | "spike";
}

export interface ViewerStat {
  username: string;
  follows: number;
  shares: number;
  gifts: number;
  likes: number;
  score: number;
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  radius: number;
  kind: "spike" | "bumper";
  bornAt: number;
  ttl: number;
}

export interface MiniChallenge {
  id: string;
  label: string;
  goal: number;
  progress: number;
  type: ActionType;
  reward: string;
  endsAt: number;
}

export interface GameState {
  status: "lobby" | "running" | "ended";
  startedAt: number;
  endsAt: number;
  duration: number;
  avatars: Avatar[];
  obstacles: Obstacle[];
  floats: FloatingText[];
  sparks: Spark[];
  events: ViewerEvent[];
  stats: Record<string, ViewerStat>;
  destroyed: { id: string; name: string; killedAt: number }[];
  challenge?: MiniChallenge;
  winner?: Avatar;
  settings: {
    spinMul: number;    // 0.3..2 — scales movement speed
    bounceMul: number;  // 0.2..2 — scales collision impulse
  };
  tiktokUsername?: string;
}
