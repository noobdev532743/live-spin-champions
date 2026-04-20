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
  setDurationMinutes: (mins: number) => void;
  setSpinMul: (v: number) => void;
  setBounceMul: (v: number) => void;
  setTiktokUsername: (u: string) => void;
}

// Start with 2 "house" champions so the arena isn't empty before viewers join
function initialAvatars(): Avatar[] {
  return [
    createAvatar({ name: "host_pink", owner: "host_pink", sprite: profilePicFor("host_pink"), angle: 0 }),
    createAvatar({ name: "host_mint", owner: "host_mint", sprite: profilePicFor("host_mint"), angle: Math.PI }),
  ];
}

function loadSettings() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("spinstars-settings");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveSettings(s: GameState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("spinstars-settings", JSON.stringify({
      duration: s.duration,
      settings: s.settings,
      tiktokUsername: s.tiktokUsername,
    }));
  } catch { /* ignore */ }
}

function makeInitial(): GameState {
  const s = initialState(initialAvatars());
  const saved = loadSettings();
  if (saved) {
    if (typeof saved.duration === "number") s.duration = saved.duration;
    if (saved.settings) s.settings = { ...s.settings, ...saved.settings };
    if (typeof saved.tiktokUsername === "string") s.tiktokUsername = saved.tiktokUsername;
  }
  return s;
}

export const useGame = create<GameStore>((set, get) => ({
  state: makeInitial(),
  queue: [],
  enqueue: (ev) => set((s) => ({ queue: [...s.queue, ev] })),
  start: () =>
    set((s) => {
      const ns = { ...s.state };
      startGame(ns);
      return { state: ns };
    }),
  reset: () => set((s) => {
    const ns = initialState(initialAvatars());
    // preserve user settings across resets
    ns.duration = s.state.duration;
    ns.settings = { ...s.state.settings };
    ns.tiktokUsername = s.state.tiktokUsername;
    return { state: ns, queue: [] };
  }),
  tick: (dt) => {
    const { state, queue } = get();
    for (const ev of queue) applyEvent(state, ev);
    step(state, dt);
    set({ state: { ...state }, queue: [] });
  },
  setDurationMinutes: (mins) => set((s) => {
    const ns = { ...s.state, duration: Math.max(30_000, Math.round(mins * 60_000)) };
    saveSettings(ns);
    return { state: ns };
  }),
  setSpinMul: (v) => set((s) => {
    const ns = { ...s.state, settings: { ...s.state.settings, spinMul: v } };
    saveSettings(ns);
    return { state: ns };
  }),
  setBounceMul: (v) => set((s) => {
    const ns = { ...s.state, settings: { ...s.state.settings, bounceMul: v } };
    saveSettings(ns);
    return { state: ns };
  }),
  setTiktokUsername: (u) => set((s) => {
    const ns = { ...s.state, tiktokUsername: u };
    saveSettings(ns);
    return { state: ns };
  }),
}));
