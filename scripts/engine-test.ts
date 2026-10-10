// Engine unit test: exercises the pure game logic without a browser.
// Run with: npx tsx scripts/engine-test.ts
import {
  advanceDay,
  initializeGame,
  resolveEviction,
  resolveHoH,
  resolveNominations,
} from '../src/engine/game';
import { applyAction, ROOM_ACTIONS } from '../src/engine/actions';
import type { CreationConfig } from '../src/types';

let pass = 0;
let fail = 0;

function assert(cond: boolean, label: string) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.error(`  ✗ ${label}`);
  }
}

const config: CreationConfig = {
  name: 'Test Player',
  nickname: 'Testy',
  gender: 'F',
  age: 25,
  stateOfOrigin: 'Lagos',
  profession: 'Musician & Vibe Machine',
  trait: 'Strategic Schemer',
  avatar: '😎',
  accentColor: '#e63946',
};

console.log('→ initializeGame');
let state = initializeGame(config);
assert(state.phase === 'hoh', 'starts in HoH phase');
assert(state.week === 1 && state.day === 1, 'starts week 1 day 1');
assert(state.housemates.length === 8, '8 AI housemates');
assert(state.player.fanbaseClout > 12000, 'player got profession clout bonus');
assert(Object.keys(state.player.relationships).length === 8, 'player has relationships with all 8 AIs');

console.log('→ resolveHoH (player wins)');
state = resolveHoH(state, 6, 4);
assert(state.player.isHoH === true, 'player wins HoH with higher score');
assert(state.player.isImmune === true, 'player is immune');

console.log('→ advanceDay into daily');
state = advanceDay(state);
assert(state.day === 2 && state.phase === 'daily', 'advances to Tuesday daily');
assert(state.actionsLeft === 3, '3 actions available');
assert(state.player.isHoH === true, 'HoH persists through week');

console.log('→ actions');
const action = ROOM_ACTIONS.find((a) => a.key === 'cook_jollof')!;
const res = applyAction(state.player, action);
assert(res.player.hunger > state.player.hunger, 'cook_jollof raises hunger');
assert(res.player.fanbaseClout > state.player.fanbaseClout, 'cook_jollof raises clout');
assert(res.logText.length > 0, 'action produces log text');

console.log('→ reach nominations (Friday)');
for (let i = 2; i < 5; i++) state = advanceDay(state);
assert(state.day === 5 && state.phase === 'nominations', 'reaches Friday nominations');

console.log('→ resolveNominations');
const picks = [state.housemates[0].id, state.housemates[1].id];
state = resolveNominations(state, picks);
assert(state.nominees.length >= 2, 'at least 2 nominees');
assert(
  state.housemates.filter((h) => h.isNominated).every((h) => h.status === 'active'),
  'all nominees are active',
);

console.log('→ reach eviction (Sunday)');
state = advanceDay(state); // Saturday party
assert(state.day === 6 && state.phase === 'party', 'Saturday is party');
state = advanceDay(state); // Sunday eviction
assert(state.day === 7 && state.phase === 'eviction', 'Sunday is eviction');

console.log('→ resolveEviction');
const beforeCount = state.housemates.filter((h) => h.status === 'active').length;
state = resolveEviction(state);
const afterCount = state.housemates.filter((h) => h.status === 'active').length;
assert(afterCount === beforeCount - 1 || state.gameOver !== null, 'one housemate evicted (or game over)');
assert(state.evictedId !== null || state.gameOver !== null, 'eviction resolved');

console.log('→ simulate a full season to termination');
let sim = initializeGame(config);
let guard = 0;
while (sim.gameOver === null && guard < 200) {
  guard++;
  if (sim.phase === 'hoh') {
    if (!sim.phaseDone) sim = resolveHoH(sim, 5, 4);
    else sim = advanceDay(sim);
  } else if (sim.phase === 'nominations') {
    if (!sim.phaseDone) {
      const eligible = sim.housemates.filter((h) => h.status === 'active' && !h.isHoH && !h.isImmune);
      sim = resolveNominations(sim, eligible.slice(0, 2).map((h) => h.id));
    } else sim = advanceDay(sim);
  } else if (sim.phase === 'eviction') {
    if (!sim.phaseDone) sim = resolveEviction(sim);
    else sim = advanceDay(sim);
  } else {
    sim = advanceDay(sim);
  }
}
assert(guard < 200, 'season terminates without infinite loop');
assert(sim.gameOver !== null, 'reached a terminal state');
console.log(`    (season ended after ${guard} steps: ${sim.gameOver?.won ? 'WON' : 'LOST'} — ${sim.gameOver?.reason})`);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
console.log('✅ All engine tests passed');
