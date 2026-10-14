import { create } from 'zustand';
import {
  cancelActive,
  clearQueue,
  createSimAvatar,
  enqueueInteraction,
  tickAvatar,
  type LevelUp,
} from './engine';
import { createClock, simMinutesFor } from './time';
import type { InteractionDef, SimAvatar, SimClock, SimSpeed } from './types';

// ---------------------------------------------------------------------------
// Live simulation store: the clock, the speed control, and every Sim's state.
// Kept separate from the game store so the turn-based show logic and the
// continuous life-sim never fight over the same fields.
// ---------------------------------------------------------------------------

export interface SimEvent {
  id: string;
  avatarId: string;
  nickname: string;
  emoji: string;
  text: string;
  kind: 'completed' | 'levelup' | 'started';
  at: number;
}

interface SimStoreState {
  clock: SimClock;
  speed: SimSpeed;
  /** Whether Sims act on their own when idle. */
  autonomyEnabled: boolean;
  avatars: Record<string, SimAvatar>;
  playerId: string | null;
  hohId: string | null;
  /** Rolling feed of what the house has been doing. */
  events: SimEvent[];
  /** Set when any Sim needs something urgent — drives the HUD nudge. */
  crisisCount: number;
  /** Extra per-avatar gate layered on top of the built-in one (life stages…). */
  extraGate: ((avatarId: string, def: InteractionDef) => boolean) | null;

  setSpeed: (speed: SimSpeed) => void;
  cycleSpeed: () => void;
  togglePause: () => void;
  setAutonomy: (on: boolean) => void;
  setPlayerId: (id: string | null) => void;
  setExtraGate: (gate: ((avatarId: string, def: InteractionDef) => boolean) | null) => void;
  setHohId: (id: string | null) => void;
  /** Create or replace a Sim. */
  upsertAvatar: (id: string, nickname: string, traits: string | string[]) => void;
  removeAvatar: (id: string) => void;
  /** Player order — runs now if idle, otherwise queues. */
  order: (avatarId: string, interactionId: string) => void;
  cancel: (avatarId: string) => void;
  clearQueueOf: (avatarId: string) => void;
  /** Advance the world by `realSeconds` of wall-clock time. */
  tick: (realSeconds: number) => void;
  reset: () => void;
}

const MAX_EVENTS = 40;

export function allowedForAvatar(avatar: SimAvatar, hohId: string | null) {
  return (def: InteractionDef) => def.room !== 'HoH Suite' || avatar.id === hohId;
}

export const useSimStore = create<SimStoreState>((set, get) => ({
  clock: createClock(),
  speed: 1,
  autonomyEnabled: true,
  avatars: {},
  playerId: null,
  hohId: null,
  events: [],
  crisisCount: 0,
  extraGate: null,

  setSpeed: (speed) => set({ speed }),
  cycleSpeed: () => set((s) => ({ speed: (((s.speed + 1) % 4) as SimSpeed) })),
  togglePause: () => set((s) => ({ speed: s.speed === 0 ? 1 : 0 })),
  setAutonomy: (on) => set({ autonomyEnabled: on }),
  setPlayerId: (id) => set({ playerId: id }),
  setExtraGate: (gate) => set({ extraGate: gate }),
  setHohId: (id) => set({ hohId: id }),

  upsertAvatar: (id, nickname, traits) =>
    set((s) => {
      if (s.avatars[id]) return s;
      return { avatars: { ...s.avatars, [id]: createSimAvatar(id, nickname, traits) } };
    }),

  removeAvatar: (id) =>
    set((s) => {
      if (!s.avatars[id]) return s;
      const next = { ...s.avatars };
      delete next[id];
      return { avatars: next };
    }),

  order: (avatarId, interactionId) =>
    set((s) => {
      const avatar = s.avatars[avatarId];
      if (!avatar) return s;
      return { avatars: { ...s.avatars, [avatarId]: enqueueInteraction(avatar, interactionId) } };
    }),

  cancel: (avatarId) =>
    set((s) => {
      const avatar = s.avatars[avatarId];
      if (!avatar) return s;
      return { avatars: { ...s.avatars, [avatarId]: cancelActive(avatar) } };
    }),

  clearQueueOf: (avatarId) =>
    set((s) => {
      const avatar = s.avatars[avatarId];
      if (!avatar) return s;
      return { avatars: { ...s.avatars, [avatarId]: clearQueue(avatar) } };
    }),

  tick: (realSeconds) => {
    const state = get();
    if (state.speed === 0 || realSeconds <= 0) return;

    const minutes = simMinutesFor(realSeconds, state.speed, state.clock);
    if (minutes <= 0) return;

    const now = state.clock.totalMinutes;
    const nextAvatars: Record<string, SimAvatar> = {};
    const newEvents: SimEvent[] = [];
    let crisisCount = 0;

    for (const avatar of Object.values(state.avatars)) {
      const baseGate = allowedForAvatar(avatar, state.hohId);
      const extra = state.extraGate;
      const result = tickAvatar(avatar, minutes, {
        now,
        autonomyEnabled: state.autonomyEnabled,
        allowed: (def) => baseGate(def) && (extra ? extra(avatar.id, def) : true),
      });
      nextAvatars[avatar.id] = result.avatar;

      const at = Math.round(now + minutes);
      if (result.completed) {
        newEvents.push({
          id: `${avatar.id}-c-${at}`,
          avatarId: avatar.id,
          nickname: avatar.nickname,
          emoji: result.completed.emoji,
          text: `${avatar.nickname} finished ${result.completed.label}.`,
          kind: 'completed',
          at,
        });
      }
      for (const levelUp of result.levelUps as LevelUp[]) {
        newEvents.push({
          id: `${avatar.id}-l-${levelUp.skill}-${at}`,
          avatarId: avatar.id,
          nickname: avatar.nickname,
          emoji: '⭐',
          text: `${avatar.nickname} reached ${levelUp.skill} level ${levelUp.level}!`,
          kind: 'levelup',
          at,
        });
      }
      for (const motive of Object.values(result.avatar.motives)) {
        if (motive < 20) {
          crisisCount++;
          break;
        }
      }
    }

    set((s) => ({
      avatars: nextAvatars,
      clock: { ...s.clock, totalMinutes: s.clock.totalMinutes + minutes },
      events: [...newEvents.reverse(), ...s.events].slice(0, MAX_EVENTS),
      crisisCount,
    }));
  },

  reset: () =>
    set({
      clock: createClock(),
      avatars: {},
      events: [],
      crisisCount: 0,
      playerId: null,
      hohId: null,
    }),
}));
