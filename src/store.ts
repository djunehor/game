import { create } from 'zustand';
import { TOP_5_PRIZES, type CreationConfig, type GameState, type Gender, type Housemate, type Profession, type Room, type Trait } from './types';
import {
  advanceDay,
  initializeGame,
  makeLog,
  makeTweet,
  resolveEviction,
  resolveHoH,
  resolveNominations,
} from './engine/game';
import { applyAction, ROOM_ACTIONS } from './engine/actions';
import { clearGame, loadGame, saveGame } from './engine/storage';
import { DIALOGUE_OPTIONS } from './data/dialogue';
import { SPONSOR_TASKS } from './data/sponsorTasks';
import { STORE_ITEMS } from './data/storeItems';
import { sound } from './engine/sound';
import { multiplayer, type RosterMember } from './engine/multiplayer';
import { useNet } from './engine/net';
import { useAuth } from './engine/auth';
import { useEconomyStore } from './world/economyStore';

interface GameStore {
  state: GameState | null;
  startGame: (config: CreationConfig) => void;
  doAction: (key: string) => void;
  setRoom: (room: Room) => void;
  interactWithHousemate: (
    targetId: string,
    optionId: string
  ) => { playerReply: string; targetReply: string } | null;
  doSponsorTask: () => void;
  buyItem: (itemId: string) => void;
  completeOnboarding: () => void;
  connectToHouse: () => void;
  applyServerRoster: (roster: RosterMember[], houseName: string, selfId: string) => void;
  applyServerState: (shared: any) => void;
  submitHoH: (correct: number) => void;
  submitNominations: (picks: string[]) => void;
  revealEviction: () => void;
  nextDay: () => void;
  resetGame: () => void;
}

function persist(state: GameState | null) {
  if (state) {
    saveGame(state);
    // Persist full progress (clout, coins, strikes, needs, relationships) to the
    // account so it survives across devices, sessions and house changes.
    multiplayer.sendState(state.player.id, {
      fanbaseClout: state.player.fanbaseClout,
      bbCoins: state.player.bbCoins,
      strikes: state.player.strikes,
      energy: state.player.energy,
      sanity: state.player.sanity,
      hunger: state.player.hunger,
      houseStanding: state.player.houseStanding,
      relationships: state.player.relationships,
    });
  }
}

function getInitialState(): GameState | null {
  const saved = loadGame();
  if (saved) return saved;
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo')) {
    const demo = initializeGame({
      name: 'Ebuka Star',
      nickname: 'E-Star',
      gender: 'M',
      age: 27,
      stateOfOrigin: 'Lagos',
      profession: 'Musician & Vibe Machine',
      trait: 'Pepper Dem',
      avatar: '😎',
      accentColor: '#e63946',
      skinTone: '#8d5524',
      hairstyle: 'lowcut',
    });
    demo.phase = 'daily';
    demo.phaseDone = true;
    demo.day = 2;
    return demo;
  }
  return null;
}

export const useGame = create<GameStore>((set, get) => ({
  state: getInitialState(),

  startGame: (config) => {
    clearGame();
    const state = initializeGame(config);
    // Tie the player to their authenticated account identity (for reconnect resume).
    const auth = useAuth.getState();
    if (auth.playerId) state.player.id = auth.playerId;

    // Restore saved progress (clout, needs, relationships) from the account.
    if (auth.playerState) {
      const ps = auth.playerState;
      state.player = {
        ...state.player,
        fanbaseClout: ps.fanbaseClout,
        bbCoins: ps.bbCoins,
        strikes: ps.strikes,
        energy: ps.energy,
        sanity: ps.sanity,
        hunger: ps.hunger,
        houseStanding: ps.houseStanding,
        relationships: ps.relationships,
      };
    }

    auth.setProfile(config);
    persist(state);
    set({ state });

    // Persist the avatar to the account (fire-and-forget).
    if (auth.token) {
      multiplayer.saveProfile(auth.token, state.player.id, config).catch(() => {});
    }
  },

  doAction: (key) => {
    const s = get().state;
    if (!s) return;
    if (s.actionsLeft <= 0) return;
    if (s.gameOver) return;

    const action = ROOM_ACTIONS.find((a) => a.key === key);
    if (!action) return;
    if (action.requiresHoH && !s.player.isHoH) return;

    // Too exhausted to do anything except rest.
    if (s.player.energy < 15 && key !== 'power_nap') {
      sound.playBiggieBuzzer();
      return;
    }

    const { player, logText, tweetText, tweetHandle } = applyAction(s.player, action);

    let next: GameState = {
      ...s,
      player,
      actionsLeft: s.actionsLeft - 1,
      log: [...s.log, makeLog(s.week, s.day, logText, 'general')].slice(-80),
    };

    if (tweetText && tweetHandle) {
      next.tweets = [makeTweet(tweetText, tweetHandle), ...next.tweets].slice(0, 40);
    }

    // "gist" strengthens relationships with the active house.
    if (key === 'gist') {
      const rel = { ...player.relationships };
      for (const h of next.housemates) {
        if (h.status === 'active') rel[h.id] = Math.min(100, (rel[h.id] ?? 0) + 6);
      }
      next.player = { ...next.player, relationships: rel };
    }

    // Strikes => disqualification
    if (next.player.strikes >= 3 && next.player.status === 'active') {
      next = {
        ...next,
        player: { ...next.player, status: 'disqualified' },
        phase: 'gameover',
        phaseDone: true,
        gameOver: {
          won: false,
          reason: `${next.player.nickname} was disqualified after 3 strikes. Biggie does not play.`,
        },
        log: [
          ...next.log,
          makeLog(next.week, next.day, `${next.player.nickname} hit 3 strikes and was disqualified!`, 'eviction'),
        ].slice(-80),
      };
    }

    persist(next);
    set({ state: next });
  },

  setRoom: (room) => {
    const s = get().state;
    if (!s) return;
    const next: GameState = { ...s, player: { ...s.player, currentRoom: room } };
    persist(next);
    set({ state: next });
  },

  interactWithHousemate: (targetId, optionId) => {
    const s = get().state;
    if (!s) return null;
    const target = s.housemates.find((h) => h.id === targetId);
    const option = DIALOGUE_OPTIONS.find((o) => o.id === optionId);
    if (!target || !option) return null;

    const res = option.effect(s.player, target);
    const cost = option.costEnergy ?? 10;
    const nextEnergy = Math.max(0, s.player.energy - cost);
    const currentAffinity = s.player.relationships[target.id] ?? 0;
    const newAffinity = Math.max(-100, Math.min(100, currentAffinity + res.affinityChange));

    const nextRelationships = { ...s.player.relationships, [target.id]: newAffinity };
    const nextPlayer = {
      ...s.player,
      energy: nextEnergy,
      fanbaseClout: s.player.fanbaseClout + res.cloutGain,
      houseStanding: Math.max(0, Math.min(100, s.player.houseStanding + res.standingChange)),
      relationships: nextRelationships,
    };

    const nextHousemates = s.housemates.map((h) => {
      if (h.id === target.id) {
        return {
          ...h,
          relationships: { ...h.relationships, [s.player.id]: newAffinity },
        };
      }
      return h;
    });

    const logKind = option.id === 'confront' ? 'drama' : option.id === 'flirt' ? 'romance' : 'general';
    const nextLogs = [
      ...s.log,
      makeLog(s.week, s.day, `${res.playerReply} ${res.targetReply}`, logKind),
    ].slice(-80);

    const nextTweets = res.tweet
      ? [makeTweet(res.tweet.text, res.tweet.handle), ...s.tweets].slice(0, 40)
      : s.tweets;

    if (option.id === 'confront') {
      sound.playDramaHit();
    } else {
      sound.playRewardChime();
    }

    const nextState: GameState = {
      ...s,
      player: nextPlayer,
      housemates: nextHousemates,
      log: nextLogs,
      tweets: nextTweets,
    };

    persist(nextState);
    set({ state: nextState });

    return {
      playerReply: res.playerReply,
      targetReply: res.targetReply,
    };
  },

  completeOnboarding: () => {
    const s = get().state;
    if (!s) return;
    const next: GameState = { ...s, onboardingDone: true };
    persist(next);
    set({ state: next });
  },

  connectToHouse: () => {
    const s = get().state;
    if (!s || s.gameOver) return;
    const p = s.player;
    multiplayer.connect({
      join: {
        id: p.id,
        nickname: p.nickname,
        avatar: p.avatar,
        accentColor: p.accentColor,
        skinTone: p.skinTone,
        hairstyle: p.hairstyle,
        profession: p.profession,
        trait: p.trait,
        gender: p.gender,
        age: p.age,
        stateOfOrigin: p.stateOfOrigin,
        fanbaseClout: p.fanbaseClout,
        bbCoins: p.bbCoins,
      },
      onWelcome: (roster, houseName, selfId) => get().applyServerRoster(roster, houseName, selfId),
      onState: (sharedState) => get().applyServerState(sharedState),
    });
  },

  applyServerRoster: (roster, houseName, selfId) => {
    const s = get().state;
    if (!s) return;
    const housemates: Housemate[] = roster
      .filter((m) => m.id !== selfId)
      .map((m) => toHousemate(m));
    const next: GameState = {
      ...s,
      housemates,
      log: [
        ...s.log,
        makeLog(s.week, s.day, `You joined ${houseName} with ${roster.filter((m) => m.isHuman).length} live housemates and ${roster.filter((m) => !m.isHuman).length} AI housemates.`, 'system'),
      ].slice(-80),
    };
    persist(next);
    set({ state: next });
  },

  applyServerState: (shared: any) => {
    const s = get().state;
    if (!s || !shared) return;
    const selfId = useNet.getState().selfId ?? s.player.id;
    const roster: RosterMember[] = shared.roster ?? [];

    const housemates = roster
      .filter((m: RosterMember) => m.id !== selfId)
      .map((m: RosterMember) => toHousemate(m));

    const me = roster.find((m: RosterMember) => m.id === selfId);
    const player = me
      ? {
          ...s.player,
          isHoH: me.isHoH,
          isImmune: me.isImmune,
          isNominated: me.isNominated,
          status: (me.status as Housemate['status']) || 'active',
          fanbaseClout: me.fanbaseClout ?? s.player.fanbaseClout,
          strikes: me.strikes ?? s.player.strikes,
        }
      : s.player;

    let gameOver = s.gameOver;
    let log = s.log;

    if (shared.evictedId && shared.evictedId !== s.evictedId && shared.evictedId !== selfId) {
      const name = roster.find((m: RosterMember) => m.id === shared.evictedId)?.nickname ?? 'A housemate';
      log = [...log, makeLog(shared.week, shared.day, `${name} was evicted from the Biggie House.`, 'eviction')].slice(-80);
    }

    const myRankInfo = shared.finalRanks?.[selfId];
    if (myRankInfo) {
      const won = myRankInfo.rank === 1;
      const rank = myRankInfo.rank;
      const prize = myRankInfo.prize;
      console.log(`[client:applyServerState] Player ranked: #${rank}, prize: ₦${prize}`);
      gameOver = {
        won,
        rank,
        prize,
        reason: won
          ? `${player.nickname} won the finale and the ₦100,000,000 grand prize!`
          : `${player.nickname} finished in ${rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`} place and won ₦${prize.toLocaleString()}!`,
      };
      if (prize > 0) {
        useEconomyStore.getState().earn(prize, `BBNaija ${won ? '1st Place Winner' : `${rank}th Place`} Cash Prize`);
      }
    } else if (shared.finaleWinnerId) {
      const won = shared.finaleWinnerId === selfId;
      const rank = won ? 1 : 2;
      const prize = TOP_5_PRIZES[rank] ?? 0;
      console.log(`[client:applyServerState] Finale winner resolved: ${shared.finaleWinnerId}, self: ${selfId}, won: ${won}, prize: ₦${prize}`);
      gameOver = {
        won,
        rank,
        prize,
        reason:
          won
            ? `${player.nickname} won the finale and the ₦100,000,000 grand prize!`
            : `${player.nickname} finished in 2nd place (1st runner-up) and won ₦${prize.toLocaleString()}!`,
      };
      if (prize > 0) {
        useEconomyStore.getState().earn(prize, `BBNaija ${won ? '1st Place Winner' : '2nd Place Runner-Up'} Cash Prize`);
      }
    } else if (shared.gameOver && player.status === 'evicted') {
      gameOver = {
        won: false,
        reason: `${player.nickname} was evicted from the Biggie House.`,
      };
    }

    const nextPhase: GameState['phase'] = gameOver ? 'gameover' : ((shared.phase as GameState['phase']) ?? s.phase);
    const nextPhaseDone = gameOver ? true : (shared.phaseDone ?? s.phaseDone);

    const next: GameState = {
      ...s,
      week: shared.week ?? s.week,
      day: shared.day ?? s.day,
      phase: nextPhase,
      phaseDone: nextPhaseDone,
      nominees: shared.nominees ?? s.nominees,
      evictedId: shared.evictedId ?? s.evictedId,
      housemates,
      player,
      gameOver,
      log,
    };
    persist(next);
    set({ state: next });
  },

  submitHoH: (correct) => {
    const s = get().state;
    if (!s) return;
    if (useNet.getState().connected) {
      multiplayer.sendHoHScore(correct);
      const next: GameState = { ...s, phaseDone: true };
      sound.playRewardChime();
      persist(next);
      set({ state: next });
      return;
    }
    // Offline: resolve locally.
    const aiBest = Math.floor(Math.random() * 3) + 2;
    const next = resolveHoH(s, correct, aiBest);
    if (next.player.isHoH) sound.playRewardChime();
    else sound.playBiggieBuzzer();
    persist(next);
    set({ state: next });
  },

  doSponsorTask: () => {
    const s = get().state;
    if (!s) return;
    if (s.actionsLeft <= 0 || s.gameOver) return;
    if (s.phase !== 'daily' && s.phase !== 'party') return;
    if (s.player.energy < 15) {
      sound.playBiggieBuzzer();
      return;
    }

    const task = SPONSOR_TASKS[Math.floor(Math.random() * SPONSOR_TASKS.length)];
    const player = {
      ...s.player,
      bbCoins: s.player.bbCoins + task.rewardCoins,
      fanbaseClout: s.player.fanbaseClout + task.rewardClout,
      energy: Math.max(0, s.player.energy - task.costEnergy),
    };

    const next: GameState = {
      ...s,
      player,
      actionsLeft: s.actionsLeft - 1,
      log: [
        ...s.log,
        makeLog(s.week, s.day, `${s.player.nickname} completed the ${task.brand} sponsor task! +₦${task.rewardCoins.toLocaleString()}.`, 'game'),
      ].slice(-80),
      tweets: [makeTweet(`${s.player.nickname} just CRUSHED the ${task.brand} task. Brand ambassador energy! 💼✨`, '@BrandWatch'), ...s.tweets].slice(0, 40),
    };

    sound.playRewardChime();
    persist(next);
    set({ state: next });
  },

  buyItem: (itemId) => {
    const s = get().state;
    if (!s) return;
    const item = STORE_ITEMS.find((i) => i.id === itemId);
    if (!item) return;
    if (s.player.bbCoins < item.cost) {
      sound.playBiggieBuzzer();
      return;
    }

    let player = { ...s.player, bbCoins: s.player.bbCoins - item.cost };
    switch (item.id) {
      case 'luxury-treat':
        player = { ...player, energy: Math.min(100, player.energy + 30), hunger: Math.min(100, player.hunger + 30) };
        break;
      case 'spa-day':
        player = { ...player, sanity: Math.min(100, player.sanity + 40), energy: Math.min(100, player.energy + 15) };
        break;
      case 'fan-boost':
        player = { ...player, fanbaseClout: player.fanbaseClout + 2500 };
        break;
      case 'immunity-token':
        player = { ...player, isImmune: true };
        break;
    }

    const next: GameState = {
      ...s,
      player,
      log: [...s.log, makeLog(s.week, s.day, `${s.player.nickname} bought ${item.name} from Biggie's Store.`, 'system')].slice(-80),
    };

    sound.playRewardChime();
    persist(next);
    set({ state: next });
  },

  submitNominations: (picks) => {
    const s = get().state;
    if (!s) return;
    if (useNet.getState().connected) {
      multiplayer.sendNominations(picks);
      const next: GameState = { ...s, phaseDone: true };
      persist(next);
      set({ state: next });
      return;
    }
    const next = resolveNominations(s, picks);
    persist(next);
    set({ state: next });
  },

  revealEviction: () => {
    const s = get().state;
    if (!s) return;
    if (useNet.getState().connected) {
      // Server resolves the shared eviction and advances the house.
      multiplayer.sendAdvance();
      return;
    }
    const next = resolveEviction(s);
    if (next.gameOver?.prize && next.gameOver.prize > 0) {
      useEconomyStore.getState().earn(next.gameOver.prize, `BBNaija ${next.gameOver.won ? '1st Place Winner' : `${next.gameOver.rank}th Place`} Cash Prize`);
    }
    sound.playDramaHit();
    persist(next);
    set({ state: next });
  },

  nextDay: () => {
    const s = get().state;
    if (!s) return;
    if (s.gameOver) return;
    if (useNet.getState().connected) {
      // Shared timeline: advance the whole house on the server.
      multiplayer.sendAdvance();
      return;
    }
    const next = advanceDay(s);
    if (next.phase === 'eviction') sound.playDramaHit();
    persist(next);
    set({ state: next });
  },

  resetGame: () => {
    clearGame();
    set({ state: null });
  },
}));

function toHousemate(m: RosterMember): Housemate {
  const anyM = m as any;
  return {
    id: m.id,
    name: m.nickname,
    nickname: m.nickname,
    gender: (m.gender as Gender) || 'F',
    age: m.age ?? 25,
    stateOfOrigin: m.stateOfOrigin ?? 'Lagos',
    profession: (m.profession as Profession) || 'Musician & Vibe Machine',
    trait: (m.trait as Trait) || 'Strategic Schemer',
    avatar: m.avatar ?? '😎',
    accentColor: m.accentColor ?? '#e63946',
    skinTone: m.skinTone,
    hairstyle: (m.hairstyle as Housemate['hairstyle']) ?? 'lowcut',
    bio: anyM.bio ?? '',
    energy: anyM.energy ?? 85,
    sanity: anyM.sanity ?? 85,
    hunger: anyM.hunger ?? 70,
    houseStanding: anyM.houseStanding ?? 55,
    fanbaseClout: m.fanbaseClout ?? 12000,
    bbCoins: m.bbCoins ?? 2000,
    strikes: m.strikes ?? 0,
    status: (m.status as Housemate['status']) || 'active',
    isHoH: !!m.isHoH,
    isImmune: !!m.isImmune,
    isNominated: !!m.isNominated,
    isHuman: !!m.isHuman,
    currentRoom: (m.currentRoom as Room) || 'Lounge',
    relationships: {},
  };
}
