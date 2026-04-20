import { create } from "zustand";
import type { GameState, ViewerEvent, Avatar } from "./types";
import { initialState, applyEvent, step, startGame, createAvatar, profilePicFor } from "./engine";

interface GameStore {
  state: GameState;
  queue: ViewerEvent[];
  enqueue: (ev: ViewerEvent) => void;
  start: () => void;
  reset: () => void;
  tick: (dt: number) => void;
}

// Start with 2 "house" champions so the arena isn't empty before viewers join
function initialAvatars(): Avatar[] {
  return [
    createAvatar({ name: "host_pink", owner: "host_pink", sprite: profilePicFor("host_pink"), angle: 0 }),
    createAvatar({ name: "host_mint", owner: "host_mint", sprite: profilePicFor("host_mint"), angle: Math.PI }),
  ];
}

export const useGame = create<GameStore>((set, get) => ({
  state: initialState(initialAvatars()),
  queue: [],
  enqueue: (ev) => set((s) => ({ queue: [...s.queue, ev] })),
  start: () =>
    set((s) => {
      const ns = { ...s.state };
      startGame(ns);
      return { state: ns };
    }),
  reset: () => set(() => ({ state: initialState(initialAvatars()), queue: [] })),
  tick: (dt) => {
    const { state, queue } = get();
    for (const ev of queue) applyEvent(state, ev);
    step(state, dt);
    set({ state: { ...state }, queue: [] });
  },
}));
