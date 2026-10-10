// Server-side shared house timeline: one authoritative week/day/phase per house,
// with collective HoH, nominations and eviction resolved on the server.

import { roster } from './houseManager';
import type { GameMember, House } from './types';

export function phaseForDay(day: number): string {
  switch (day) {
    case 1:
      return 'hoh';
    case 5:
      return 'nominations';
    case 6:
      return 'party';
    case 7:
      return 'eviction';
    default:
      return 'daily';
  }
}

function activeMembers(house: House): GameMember[] {
  return roster(house).filter((m) => m.status === 'active');
}

// Crown the Head of House from submitted ring-collection scores.
function resolveHoH(house: House): void {
  const scores = house.state.scores || {};
  let winnerId: string | null = null;
  let best = -1;
  for (const [id, s] of Object.entries(scores)) {
    if (s > best) {
      best = s;
      winnerId = id;
    }
  }
  const active = activeMembers(house);
  if (!winnerId && active.length) {
    winnerId = active[Math.floor(Math.random() * active.length)].id;
  }
  house.state.hohId = winnerId;
  for (const m of active) {
    m.isHoH = m.id === winnerId;
    m.isImmune = m.id === winnerId;
  }
}

// Tally live players' nominations + server-side AI votes to pick nominees.
function resolveNominations(house: House): void {
  const votes = house.state.votes || {};
  const tally: Record<string, number> = {};
  for (const picks of Object.values(votes)) {
    for (const id of picks) tally[id] = (tally[id] || 0) + 1;
  }

  const active = activeMembers(house);
  const immune = new Set(active.filter((m) => m.isHoH || m.isImmune).map((m) => m.id));

  // AI housemates each nominate 2 random non-immune targets (MVP strategy).
  for (const ai of house.aiMembers) {
    if (ai.status !== 'active') continue;
    const targets = active.filter((m) => m.id !== ai.id && !immune.has(m.id));
    for (let i = 0; i < 2 && i < targets.length; i++) {
      const t = targets[Math.floor(Math.random() * targets.length)];
      tally[t.id] = (tally[t.id] || 0) + 1;
    }
  }

  const ranked = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const nominees = ranked.slice(0, Math.min(3, ranked.length)).map(([id]) => id);
  house.state.nominees = nominees;
  for (const m of active) m.isNominated = nominees.includes(m.id);
}

// Evict the lowest-clout nominee (or resolve the finale when 2 remain).
function resolveEviction(house: House): void {
  const active = activeMembers(house);

  // Finale: two left standing — highest clout wins the house.
  if (active.length <= 2) {
    const winner = [...active].sort((a, b) => b.fanbaseClout - a.fanbaseClout)[0];
    house.state.finaleWinnerId = winner?.id ?? null;
    house.state.gameOver = true;
    return;
  }

  const nominees = active.filter((m) => house.state.nominees.includes(m.id));
  const pool = nominees.length ? nominees : active;
  const evicted = [...pool].sort((a, b) => a.fanbaseClout - b.fanbaseClout)[0];
  if (evicted) {
    evicted.status = 'evicted';
    evicted.isNominated = false;
    house.state.evictedId = evicted.id;
  }
}

// Resolve the phase we are leaving, then advance to the next day.
export function advanceHouse(house: House): House['state'] {
  const { state } = house;
  const leavingDay = state.day;

  if (leavingDay === 1) resolveHoH(house);
  else if (leavingDay === 5) resolveNominations(house);
  else if (leavingDay === 7) resolveEviction(house);

  if (!state.gameOver) {
    state.day += 1;
    if (state.day > 7) {
      state.day = 1;
      state.week += 1;
      // New week: clear HoH/immunity/nomination flags.
      for (const m of roster(house)) {
        m.isHoH = false;
        m.isImmune = false;
        m.isNominated = false;
      }
      state.nominees = [];
      state.hohId = null;
    }
    state.phase = phaseForDay(state.day);
    state.phaseDone = false;
  }

  // reset collected inputs for the new phase
  state.scores = {};
  state.votes = {};
  state.ready = new Set();

  return state;
}

export function publicState(house: House) {
  const s = house.state;
  return {
    week: s.week,
    day: s.day,
    phase: s.phase,
    phaseDone: s.phaseDone,
    hohId: s.hohId,
    nominees: s.nominees,
    evictedId: s.evictedId,
    finaleWinnerId: s.finaleWinnerId,
    gameOver: s.gameOver ?? false,
    roster: roster(house).map((m) => ({
      id: m.id,
      nickname: m.nickname,
      avatar: m.avatar,
      accentColor: m.accentColor,
      skinTone: m.skinTone,
      hairstyle: m.hairstyle,
      profession: m.profession,
      trait: m.trait,
      isHuman: m.isHuman,
      fanbaseClout: m.fanbaseClout,
      bbCoins: m.bbCoins,
      strikes: m.strikes,
      status: m.status,
      isHoH: m.isHoH,
      isImmune: m.isImmune,
      isNominated: m.isNominated,
      currentRoom: m.currentRoom,
    })),
  };
}
