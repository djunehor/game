import assert from 'node:assert';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { advanceHouse } from '../server/gameState';
import type { GameMember, House, HouseState } from '../server/types';
import { TOP_5_PRIZES } from '../src/types';
import { useGame } from '../src/store';
import { useNet } from '../src/engine/net';
import { initializeGame, resolveEviction } from '../src/engine/game';
import { useEconomyStore } from '../src/world/economyStore';
import { GameOverModal } from '../src/components/GameOverModal';

console.log('--- Testing Finale & Top 5 Prizes Resolution Logic ---');

// Verify prize constants
assert.strictEqual(TOP_5_PRIZES[1], 100_000_000, '1st place must be ₦100M');
assert.strictEqual(TOP_5_PRIZES[2], 30_000_000, '2nd place must be ₦30M');
assert.strictEqual(TOP_5_PRIZES[3], 15_000_000, '3rd place must be ₦15M');
assert.strictEqual(TOP_5_PRIZES[4], 10_000_000, '4th place must be ₦10M');
assert.strictEqual(TOP_5_PRIZES[5], 5_000_000, '5th place must be ₦5M');
console.log('✓ Prize tiers 1 through 5 match approved configuration');

// 1. Server-side Finale Test (1st and 2nd place)
{
  const p1: GameMember = {
    id: 'p-champ',
    nickname: 'Champ',
    avatar: '😎',
    accentColor: '#e63946',
    skinTone: '#c98a5b',
    hairstyle: 'lowcut',
    profession: 'Tech Sis / Tech Bro',
    trait: 'Strategic Schemer',
    gender: 'M',
    age: 26,
    stateOfOrigin: 'Lagos',
    fanbaseClout: 50000,
    bbCoins: 5000,
    strikes: 0,
    status: 'active',
    isHoH: false,
    isImmune: false,
    isNominated: false,
    isHuman: true,
    currentRoom: 'Lounge',
    x: 0,
    z: 0,
  };

  const p2: GameMember = {
    id: 'p-rival',
    nickname: 'Rival',
    avatar: '💃🏾',
    accentColor: '#4361ee',
    skinTone: '#8d5524',
    hairstyle: 'braids',
    profession: 'Fashion Designer',
    trait: 'Pepper Dem',
    gender: 'F',
    age: 25,
    stateOfOrigin: 'Anambra',
    fanbaseClout: 30000,
    bbCoins: 3000,
    strikes: 0,
    status: 'active',
    isHoH: false,
    isImmune: false,
    isNominated: false,
    isHuman: false,
    currentRoom: 'Lounge',
    x: 0,
    z: 0,
  };

  const house: House = {
    id: 'h-1',
    name: 'Test House',
    members: new Map([[p1.id, p1]]),
    aiMembers: [p2],
    seed: 12345,
    state: {
      week: 8,
      day: 7,
      phase: 'eviction',
      phaseDone: false,
      hohId: null,
      nominees: [p1.id, p2.id],
      evictedId: null,
      finaleWinnerId: null,
      finalRanks: {},
      gameOver: false,
      scores: {},
      votes: {},
      ready: new Set(),
      log: [],
      tweets: [],
    } as HouseState,
  };

  advanceHouse(house);

  assert.strictEqual(house.state.gameOver, true, 'Server house should mark gameOver = true');
  assert.strictEqual(house.state.phase, 'gameover', 'Server house phase should be gameover');
  assert.strictEqual(house.state.phaseDone, true, 'Server house phaseDone should be true');
  assert.strictEqual(house.state.finaleWinnerId, 'p-champ', 'Champ has higher clout and must be finaleWinnerId');
  assert.strictEqual(house.state.finalRanks?.['p-champ']?.rank, 1, 'Champ must be rank 1');
  assert.strictEqual(house.state.finalRanks?.['p-champ']?.prize, 100_000_000, 'Champ prize must be ₦100M');
  assert.strictEqual(house.state.finalRanks?.['p-rival']?.rank, 2, 'Rival must be rank 2 (runner-up)');
  assert.strictEqual(house.state.finalRanks?.['p-rival']?.prize, 30_000_000, 'Rival prize must be ₦30M');
  console.log('✓ Server-side finale resolution correctly assigned 1st place (₦100M) and 2nd place (₦30M)');
}

// 2. Server-side Top 5 Eviction Test (3rd, 4th, 5th place)
{
  const makeMember = (id: string, clout: number): GameMember => ({
    id,
    nickname: id,
    avatar: '😎',
    accentColor: '#e63946',
    skinTone: '#c98a5b',
    hairstyle: 'lowcut',
    profession: 'Tech Sis / Tech Bro',
    trait: 'Strategic Schemer',
    gender: 'M',
    age: 26,
    stateOfOrigin: 'Lagos',
    fanbaseClout: clout,
    bbCoins: 5000,
    strikes: 0,
    status: 'active',
    isHoH: false,
    isImmune: false,
    isNominated: false,
    isHuman: id === 'player',
    currentRoom: 'Lounge',
  });

  const ai1 = makeMember('ai-1', 40000);
  const ai2 = makeMember('ai-2', 30000);
  const ai3 = makeMember('ai-3', 25000);
  const ai4 = makeMember('ai-4', 20000);
  const ai5 = makeMember('ai-5', 10000); // lowest clout, evicted at active=5 -> 5th place!

  const house5: House = {
    id: 'h-top5',
    name: 'Top 5 House',
    members: new Map([[ai1.id, ai1]]),
    aiMembers: [ai2, ai3, ai4, ai5],
    seed: 555,
    state: {
      week: 6,
      day: 7,
      phase: 'eviction',
      phaseDone: false,
      hohId: null,
      nominees: [ai4.id, ai5.id],
      evictedId: null,
      finaleWinnerId: null,
      finalRanks: {},
      gameOver: false,
      scores: {},
      votes: {},
      ready: new Set(),
      log: [],
      tweets: [],
    } as HouseState,
  };

  advanceHouse(house5);

  assert.strictEqual(house5.state.evictedId, 'ai-5', 'Lowest clout nominee ai-5 must be evicted');
  assert.strictEqual(house5.state.finalRanks?.['ai-5']?.rank, 5, 'ai-5 was evicted when 5 active remained -> 5th place');
  assert.strictEqual(house5.state.finalRanks?.['ai-5']?.prize, 5_000_000, '5th place prize must be ₦5,000,000');
  console.log('✓ Server-side 5th place eviction assigned rank 5 and ₦5M prize');
}

// 3. Client-side Offline Eviction in Top 5 (e.g. Player evicted in 3rd place)
{
  const localGame = initializeGame({
    name: 'Player',
    nickname: 'Player',
    gender: 'M',
    age: 26,
    stateOfOrigin: 'Lagos',
    profession: 'Tech Sis / Tech Bro',
    trait: 'Strategic Schemer',
    avatar: '😎',
    accentColor: '#e63946',
    skinTone: '#c98a5b',
    hairstyle: 'lowcut',
  });

  // Keep only 2 AI active + player = 3 active housemates!
  localGame.housemates = localGame.housemates.slice(0, 2);
  localGame.player.fanbaseClout = 5000; // lower than AI
  localGame.housemates[0].fanbaseClout = 20000;
  localGame.housemates[1].fanbaseClout = 30000;
  localGame.player.isNominated = true;

  const result = resolveEviction(localGame);
  assert.strictEqual(result.gameOver?.won, false);
  assert.strictEqual(result.gameOver?.rank, 3, 'Player must be rank 3 (3rd place)');
  assert.strictEqual(result.gameOver?.prize, 15_000_000, 'Player in 3rd place must receive ₦15M');
  console.log('✓ Offline game logic awards 3rd place and ₦15M prize to player');
}

// 4. Client-side UI Rendering Test for all Top 5 placements
{
  const localGame = initializeGame({
    name: 'Champion',
    nickname: 'Champ',
    gender: 'M',
    age: 26,
    stateOfOrigin: 'Lagos',
    profession: 'Tech Sis / Tech Bro',
    trait: 'Strategic Schemer',
    avatar: '😎',
    accentColor: '#e63946',
    skinTone: '#c98a5b',
    hairstyle: 'lowcut',
  });

  // Test 1st Place UI
  localGame.gameOver = { won: true, rank: 1, prize: 100_000_000, reason: 'Champ won the grand prize!' };
  const html1 = renderToString(React.createElement(GameOverModal, { state: localGame }));
  assert(html1.includes('1st Place 🏆'), 'Must display 1st Place badge');
  assert(html1.includes('₦100M'), 'Must display ₦100M prize');
  assert(html1.includes('100,000,000') && html1.includes('prize money is yours!'), 'Must display prize announcement');

  // Test 2nd Place UI
  localGame.gameOver = { won: false, rank: 2, prize: 30_000_000, reason: 'Champ finished in 2nd place!' };
  const html2 = renderToString(React.createElement(GameOverModal, { state: localGame }));
  assert(html2.includes('2nd Place 🥈'), 'Must display 2nd Place badge');
  assert(html2.includes('₦30M'), 'Must display ₦30M prize');
  assert(html2.includes('30,000,000') && html2.includes('prize money is yours!'), 'Must display prize announcement');

  // Test 3rd Place UI
  localGame.gameOver = { won: false, rank: 3, prize: 15_000_000, reason: 'Champ finished in 3rd place!' };
  const html3 = renderToString(React.createElement(GameOverModal, { state: localGame }));
  assert(html3.includes('3rd Place 🥉'), 'Must display 3rd Place badge');
  assert(html3.includes('₦15M'), 'Must display ₦15M prize');

  // Test 4th Place UI
  localGame.gameOver = { won: false, rank: 4, prize: 10_000_000, reason: 'Champ finished in 4th place!' };
  const html4 = renderToString(React.createElement(GameOverModal, { state: localGame }));
  assert(html4.includes('4th Place 🎖️'), 'Must display 4th Place badge');
  assert(html4.includes('₦10M'), 'Must display ₦10M prize');

  // Test 5th Place UI
  localGame.gameOver = { won: false, rank: 5, prize: 5_000_000, reason: 'Champ finished in 5th place!' };
  const html5 = renderToString(React.createElement(GameOverModal, { state: localGame }));
  assert(html5.includes('5th Place ⭐'), 'Must display 5th Place badge');
  assert(html5.includes('₦5M'), 'Must display ₦5M prize');

  // Test Non-Top-5 (Evicted earlier) UI
  localGame.gameOver = { won: false, rank: 8, prize: 0, reason: 'Champ was evicted in week 2.' };
  const html0 = renderToString(React.createElement(GameOverModal, { state: localGame }));
  assert(html0.includes('Evicted 🚪'), 'Must display Evicted badge');
  assert(html0.includes('₦0'), 'Must display ₦0 prize');
  console.log('✓ GameOverModal renders all placements (1st, 2nd, 3rd, 4th, 5th, and evicted) with accurate badges and cash amounts');
}

console.log('All finale and Top 5 prize tests passed successfully!');
