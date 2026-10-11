import type { CreationConfig, GameState, Housemate, LogEntry, LogKind, Phase, Tweet } from '../types';
import { AI_HOUSEMATES } from '../data/housemates';
import { PROFESSIONS } from '../data/profileOptions';
import { RANDOM_EVENTS, PARTY_EVENTS } from '../data/events';
import { MAX_ACTIONS_PER_DAY } from '../types';

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
let counter = 0;
export const uid = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));

const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export function phaseForDay(day: number): Phase {
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

// ---------------------------------------------------------------------------
// Log + tweet helpers
// ---------------------------------------------------------------------------
export function makeLog(week: number, day: number, text: string, kind: LogKind): LogEntry {
  return { id: uid('log'), week, day, text, kind };
}

export function makeTweet(text: string, handle: string, kind: Tweet['kind'] = 'fan'): Tweet {
  const likes = rnd(40, 4200);
  return {
    id: uid('tw'),
    handle,
    text,
    likes,
    time: 'just now',
    kind,
  };
}

// ---------------------------------------------------------------------------
// Character creation
// ---------------------------------------------------------------------------
export function createPlayer(config: CreationConfig): Housemate {
  const prof = PROFESSIONS.find((p) => p.id === config.profession);
  return {
    id: uid('player'),
    name: config.name,
    nickname: config.nickname,
    gender: config.gender,
    age: config.age,
    stateOfOrigin: config.stateOfOrigin,
    profession: config.profession,
    trait: config.trait,
    avatar: config.avatar,
    accentColor: config.accentColor,
    skinTone: config.skinTone,
    hairstyle: config.hairstyle,
    bio: 'The newest housemate, fresh off the bus and ready to play the game.',
    energy: 90,
    sanity: 85,
    hunger: 70,
    houseStanding: 55,
    fanbaseClout: 12000 + (prof?.cloutBonus ?? 0),
    bbCoins: 2000 + (prof?.bbCoinBonus ?? 0),
    strikes: 0,
    status: 'active',
    isHoH: false,
    isImmune: false,
    isNominated: false,
    isHuman: true,
    currentRoom: 'Lounge',
    relationships: {},
  };
}

function seedRelationships(housemates: Housemate[], playerId: string): void {
  const ids = [playerId, ...housemates.map((h) => h.id)];
  for (const h of housemates) {
    for (const id of ids) {
      if (id === h.id) continue;
      // Random starting affinity: a few allies, a few rivals.
      h.relationships[id] = rnd(-15, 35);
    }
  }
  // Player's relationships mirror a neutral start.
  // (Stored on the player object separately in initializeGame.)
}

export function initializeGame(config: CreationConfig): GameState {
  const player = createPlayer(config);
  const housemates: Housemate[] = AI_HOUSEMATES.map((h) => ({
    ...h,
    relationships: {},
    status: 'active',
    isHoH: false,
    isImmune: false,
    isNominated: false,
  }));

  seedRelationships(housemates, player.id);

  const playerRels: Record<string, number> = {};
  for (const h of housemates) playerRels[h.id] = rnd(-10, 30);
  player.relationships = playerRels;

  const state: GameState = {
    week: 1,
    day: 1,
    phase: 'hoh',
    player,
    housemates,
    tweets: [],
    log: [
      makeLog(
        1,
        1,
        `${player.nickname} stepped out of the bus and into the Biggie House. The game is officially on!`,
        'system',
      ),
    ],
    actionsLeft: MAX_ACTIONS_PER_DAY,
    nominees: [],
    evictedId: null,
    gameOver: null,
    phaseDone: false,
    onboardingDone: false,
  };

  state.tweets = [
    makeTweet(
      `${player.nickname} just entered the house! First impressions? 👀`,
      '@BBNaijaFans',
    ),
    makeTweet(
      `A ${player.profession.toLowerCase()} from ${player.stateOfOrigin}? Biggie cooked this season 🔥`,
      '@BiggieUpdate',
    ),
  ];

  return state;
}

// ---------------------------------------------------------------------------
// AI simulation
// ---------------------------------------------------------------------------
export function simulateAiDay(state: GameState): GameState {
  const housemates = state.housemates.map((h) => {
    if (h.status !== 'active') return h;
    const cloutGain = rnd(100, 700);
    return {
      ...h,
      fanbaseClout: h.fanbaseClout + cloutGain,
      houseStanding: clamp(h.houseStanding + rnd(-3, 3)),
      energy: clamp(h.energy + rnd(-10, 5)),
      sanity: clamp(h.sanity + rnd(-6, 6)),
      hunger: clamp(h.hunger + rnd(-8, 4)),
      currentRoom: h.currentRoom, // rooms shift handled by events
    };
  });
  return { ...state, housemates };
}

function maybeRandomEvent(state: GameState): GameState {
  if (Math.random() > 0.55) return state; // ~45% chance of an event per day
  const event = RANDOM_EVENTS[rnd(0, RANDOM_EVENTS.length - 1)];
  return fireEvent(state, event);
}

function fireEvent(state: GameState, event: { text: string; kind: 'drama' | 'romance' | 'game' | 'general'; apply: (p: Housemate) => Partial<Housemate>; tweet: { handle: string; text: string } }): GameState {
  const patch = event.apply(state.player);
  const player = { ...state.player, ...patch };
  const log = makeLog(state.week, state.day, event.text, event.kind);
  const tweet = makeTweet(event.tweet.text, event.tweet.handle);
  return {
    ...state,
    player,
    log: [...state.log, log].slice(-80),
    tweets: [tweet, ...state.tweets].slice(0, 40),
  };
}

// ---------------------------------------------------------------------------
// Day advancement
// ---------------------------------------------------------------------------
export function advanceDay(state: GameState): GameState {
  let day = state.day + 1;
  let week = state.week;
  if (day > 7) {
    day = 1;
    week += 1;
  }

  const phase = phaseForDay(day);

  let next: GameState = {
    ...state,
    day,
    week,
    phase,
    actionsLeft: MAX_ACTIONS_PER_DAY,
    phaseDone: phase === 'hoh' || phase === 'nominations' || phase === 'eviction' ? false : true,
  };

  // New week: reset HoH/immunity/nominations.
  if (day === 1) {
    next = {
      ...next,
      player: { ...next.player, isHoH: false, isImmune: false, isNominated: false },
      housemates: next.housemates.map((h) => ({
        ...h,
        isHoH: false,
        isImmune: false,
        isNominated: false,
      })),
      nominees: [],
    };
    next = {
      ...next,
      log: [
        ...next.log,
        makeLog(next.week, next.day, `Week ${week} begins. A new Head of House will be crowned today.`, 'system'),
      ].slice(-80),
    };
  }

  // Clear just-advanced flag so it doesn't re-trigger modals.
  next = simulateAiDay(next);
  next = decayPlayerNeeds(next);
  if (phase === 'daily') {
    next = maybeRandomEvent(next);
  } else if (phase === 'party') {
    next = fireEvent(next, PARTY_EVENTS[Math.floor(Math.random() * PARTY_EVENTS.length)]);
  }
  return next;
}

// A new day takes a toll: needs drop. Keep them topped up or the house (and
// the fans) will notice.
function decayPlayerNeeds(state: GameState): GameState {
  const p = state.player;
  const nextPlayer = {
    ...p,
    hunger: clamp(p.hunger - rnd(14, 22)),
    energy: clamp(p.energy - rnd(12, 20)),
    sanity: clamp(p.sanity - rnd(8, 14)),
  };

  let next: GameState = { ...state, player: nextPlayer };

  // Critical-need consequences
  if (nextPlayer.hunger <= 15) {
    next = {
      ...next,
      player: { ...nextPlayer, fanbaseClout: nextPlayer.fanbaseClout - 800 },
      log: [
        ...next.log,
        makeLog(state.week, state.day, `${p.nickname} is starving! The fans are worried and clout is slipping.`, 'system'),
      ].slice(-80),
    };
  }
  if (nextPlayer.energy <= 15) {
    next = {
      ...next,
      log: [
        ...next.log,
        makeLog(state.week, state.day, `${p.nickname} is running on fumes. Biggie suggests a power nap.`, 'system'),
      ].slice(-80),
    };
  }
  if (nextPlayer.sanity <= 15) {
    next = {
      ...next,
      player: { ...next.player, houseStanding: clamp(nextPlayer.houseStanding - 5) },
      log: [
        ...next.log,
        makeLog(state.week, state.day, `${p.nickname}'s head is not in the game. The house can feel the crack.`, 'drama'),
      ].slice(-80),
    };
  }
  return next;
}

// ---------------------------------------------------------------------------
// Head of House challenge
// ---------------------------------------------------------------------------
export function resolveHoH(state: GameState, playerCorrect: number, aiBest: number): GameState {
  const playerWon = playerCorrect >= aiBest;
  const player = {
    ...state.player,
    isHoH: playerWon,
    isImmune: playerWon,
    fanbaseClout: state.player.fanbaseClout + playerCorrect * 600,
    bbCoins: state.player.bbCoins + playerCorrect * 200,
  };

  let housemates = state.housemates.map((h) => ({ ...h, isHoH: false, isImmune: false }));

  let log: LogEntry;
  let tweet: Tweet;

  if (playerWon) {
    log = makeLog(state.week, state.day, `${player.nickname} crushed the HoH challenge (${playerCorrect}/${aiBest} correct) and claimed the crown!`, 'game');
    tweet = makeTweet(`${player.nickname} is the new Head of House! The HoH suite is theirs 👑🔥`, '@HoHWatch');
  } else {
    const winner = housemates.reduce((a, b) => (a.fanbaseClout > b.fanbaseClout ? a : b));
    housemates = housemates.map((h) => (h.id === winner.id ? { ...h, isHoH: true, isImmune: true } : h));
    log = makeLog(state.week, state.day, `${winner.nickname} won the HoH challenge and is now immune from eviction.`, 'game');
    tweet = makeTweet(`${winner.nickname} takes the HoH crown this week! Immunity secured 👑`, '@HoHWatch');
  }

  return {
    ...state,
    player,
    housemates,
    phaseDone: true,
    log: [...state.log, log].slice(-80),
    tweets: [tweet, ...state.tweets].slice(0, 40),
  };
}

// ---------------------------------------------------------------------------
// Nominations (Friday)
// ---------------------------------------------------------------------------
function aiNominate(voter: Housemate, candidates: Housemate[]): string[] {
  // Allies (affinity > 40) never nominate each other.
  const nonAllies = candidates.filter((c) => (voter.relationships[c.id] ?? 0) <= 40);
  const pool = nonAllies.length >= 2 ? nonAllies : candidates;
  const scored = pool
    .map((c) => ({
      id: c.id,
      score: 100 - (voter.relationships[c.id] ?? 0) * 1.5 + Math.random() * 40,
    }))
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 2).map((s) => s.id);
}

export function resolveNominations(state: GameState, playerPicks: string[]): GameState {
  const player = { ...state.player, isNominated: false };
  const ai = state.housemates.filter((h) => h.status === 'active');
  const immune = new Set([player.isHoH ? player.id : '', ...ai.filter((h) => h.isHoH || h.isImmune).map((h) => h.id)]);

  const tally: Record<string, number> = {};
  // The player's read carries weight (2 votes each).
  for (const id of playerPicks) tally[id] = (tally[id] ?? 0) + 2;

  for (const voter of ai) {
    const candidates = ai
      .filter((c) => c.id !== voter.id && !immune.has(c.id))
      .concat(player.id !== voter.id && !immune.has(player.id) ? [player] : []);
    for (const id of aiNominate(voter, candidates)) {
      tally[id] = (tally[id] ?? 0) + 1;
    }
  }

  const ranked = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const topCount = ranked[1] ? ranked[1][1] : 0;
  const nomineeIds = ranked.filter(([, v]) => v > 0 && v >= topCount).map(([id]) => id).slice(0, 3);

  const playerNominated = nomineeIds.includes(player.id);
  const housemates = state.housemates.map((h) => ({
    ...h,
    isNominated: nomineeIds.includes(h.id),
  }));

  const names = nomineeIds
    .map((id) => (id === player.id ? player.nickname : ai.find((h) => h.id === id)?.nickname ?? '?'))
    .join(', ');

  const log = makeLog(
    state.week,
    state.day,
    `Nomination results are in: ${names} face possible eviction this Sunday.`,
    'game',
  );

  return {
    ...state,
    player: { ...player, isNominated: playerNominated },
    housemates,
    nominees: nomineeIds,
    phaseDone: true,
    log: [...state.log, log].slice(-80),
    tweets: [makeTweet(`It's official: ${names} are up for eviction. Who goes home? 😱`, '@EvictionWatch'), ...state.tweets].slice(0, 40),
  };
}

// ---------------------------------------------------------------------------
// Eviction (Sunday) + finale
// ---------------------------------------------------------------------------
export function resolveEviction(state: GameState): GameState {
  const activeAi = state.housemates.filter((h) => h.status === 'active');
  const totalActive = activeAi.length + (state.player.status === 'active' ? 1 : 0);

  // Finale: only two left standing.
  if (totalActive <= 2) {
    return resolveFinale(state);
  }

  // Build the pool of nominees (player + AI).
  const candidates: { id: string; isPlayer: boolean; clout: number; nickname: string }[] = [];
  if (state.player.isNominated) {
    candidates.push({ id: state.player.id, isPlayer: true, clout: state.player.fanbaseClout, nickname: state.player.nickname });
  }
  for (const h of activeAi) {
    if (h.isNominated) candidates.push({ id: h.id, isPlayer: false, clout: h.fanbaseClout, nickname: h.nickname });
  }

  // Fallback: if nobody was flagged, pick the lowest-clout active housemate.
  if (candidates.length === 0) {
    const lowest = [...activeAi].sort((a, b) => a.fanbaseClout - b.fanbaseClout)[0];
    if (lowest) candidates.push({ id: lowest.id, isPlayer: false, clout: lowest.fanbaseClout, nickname: lowest.nickname });
  }

  const evicted = candidates.sort((a, b) => a.clout - b.clout)[0];

  if (evicted.isPlayer) {
    return {
      ...state,
      player: { ...state.player, status: 'evicted' },
      evictedId: state.player.id,
      phase: 'gameover',
      phaseDone: true,
      gameOver: { won: false, reason: `${state.player.nickname} was evicted from the Biggie House.` },
      log: [...state.log, makeLog(state.week, state.day, `${state.player.nickname} was evicted! The journey ends here.`, 'eviction')].slice(-80),
    };
  }

  const housemates = state.housemates.map((h) =>
    h.id === evicted.id ? { ...h, status: 'evicted' as const, isNominated: false } : h,
  );

  return {
    ...state,
    housemates,
    evictedId: evicted.id,
    phaseDone: true,
    log: [...state.log, makeLog(state.week, state.day, `${evicted.nickname} was evicted from the Biggie House.`, 'eviction')].slice(-80),
    tweets: [makeTweet(`${evicted.nickname} has been evicted! The house is shook 😭`, '@EvictionWatch'), ...state.tweets].slice(0, 40),
  };
}

function resolveFinale(state: GameState): GameState {
  const rival = state.housemates.find((h) => h.status === 'active');
  const playerClout = state.player.fanbaseClout;
  const rivalClout = rival?.fanbaseClout ?? 0;
  const won = playerClout >= rivalClout;

  return {
    ...state,
    phase: 'gameover',
    phaseDone: true,
    gameOver: won
      ? { won: true, reason: `${state.player.nickname} survived to the finale and won the ₦100,000,000 grand prize!` }
      : { won: false, reason: `${rival?.nickname ?? 'A housemate'} won the finale vote. So close!` },
    log: [
      ...state.log,
      makeLog(state.week, state.day, won ? 'FINALE: You won Big Brother Naija! ₦100M is yours! 🏆' : `FINALE: ${rival?.nickname} took the crown.`, 'eviction'),
    ].slice(-80),
  };
}
