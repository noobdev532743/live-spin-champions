import { create } from "zustand";
import type { GameState, ViewerEvent, Avatar } from "./types";
import { initialState, applyEvent, step, startGame, createAvatar } from "./engine";
import topMint from "@/assets/top-mint.png";
import topPink from "@/assets/top-pink.png";
import topBlue from "@/assets/top-blue.png";
import topCoral from "@/assets/top-coral.png";

const SPRITES = [topMint, topPink, topBlue, topCoral];
const NAMES = ["Mochi", "Pudding", "Bobo", "Pixie", "Niko", "Sushi", "Cocoa", "Yuzu"];

interface GameStore {
  state: GameState;
  queue: ViewerEvent[];
  enqueue: (ev: ViewerEvent) => void;
  start: () => void;
  reset: (count?: number) => void;
  tick: (dt: number) => void;
  addAvatar: (name: string, owner: string) => void;
}

function buildAvatars(count = 4): Avatar[] {
  return Array.from({ length: count }).map((_, i) =>
    createAvatar({
      name: NAMES[i % NAMES.length],
      sprite: SPRITES[i % SPRITES.length],
      angle: (i / count) * Math.PI * 2,
    }),
  );
}

export const useGame = create<GameStore>((set, get) => ({
  state: initialState(buildAvatars(4)),
  queue: [],
  enqueue: (ev) => set((s) => ({ queue: [...s.queue, ev] })),
  start: () => set((s) => {
    const ns = { ...s.state };
    startGame(ns);
    return { state: ns };
  }),
  reset: (count = 4) => set(() => ({ state: initialState(buildAvatars(count)), queue: [] })),
  tick: (dt) => {
    const { state, queue } = get();
    for (const ev of queue) applyEvent(state, ev);
    step(state, dt);
    set({ state: { ...state }, queue: [] });
  },
  addAvatar: (name, owner) => set((s) => {
    if (s.state.status !== "lobby") return s;
    const sprite = SPRITES[s.state.avatars.length % SPRITES.length];
    const av = createAvatar({ name, owner, sprite, angle: Math.random() * Math.PI * 2 });
    s.state.avatars.push(av);
    return { state: { ...s.state } };
  }),
}));
