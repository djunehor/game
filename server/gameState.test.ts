import { createHouse, assignToHouse } from '../server/houseManager';
import { advanceHouse, phaseForDay, publicState } from '../server/gameState';

let pass = 0;
let fail = 0;
function assert(cond, label) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ ${label}`); }
}

function member(i, clout = 12000) {
  return { id: `p-${i}`, nickname: `P${i}`, avatar: '😎', accentColor: '#e63946', skinTone: '#8d5524', hairstyle: 'lowcut', profession: 'Musician & Vibe Machine', trait: 'Strategic Schemer', isHuman: true, fanbaseClout: clout, bbCoins: 2000, strikes: 0, status: 'active', isHoH: false, isImmune: false, isNominated: false, currentRoom: 'Lounge' };
}

console.log('→ phase mapping');
assert(phaseForDay(1) === 'hoh', 'day 1 = hoh');
assert(phaseForDay(5) === 'nominations', 'day 5 = nominations');
assert(phaseForDay(6) === 'party', 'day 6 = party');
assert(phaseForDay(7) === 'eviction', 'day 7 = eviction');
assert(phaseForDay(3) === 'daily', 'day 3 = daily');

console.log('→ HoH resolution (Monday)');
const house = createHouse('Test House');
house.state.scores = { 'p-1': 6, 'p-2': 4, 'p-3': 2 };
// manually add members (house is standalone for this test)
house.members.set('p-1', member(1));
house.members.set('p-2', member(2));
house.members.set('p-3', member(3));
// backfill AI to 20
const { backfillAi } = await import('../server/houseManager');
backfillAi(house);

advanceHouse(house); // resolves HoH from day 1, advances to day 2
assert(house.state.hohId === 'p-1', 'highest scorer (p-1) crowned HoH');
assert(house.members.get('p-1').isHoH === true, 'p-1 flagged HoH');
assert(house.state.day === 2 && house.state.phase === 'daily', 'advanced to Tuesday daily');

console.log('→ nominations resolution (Friday)');
// fast-forward to Friday
for (let d = 2; d < 5; d++) advanceHouse(house);
assert(house.state.day === 5, 'reached Friday');
house.state.votes = { 'p-1': ['p-2', 'p-3'], 'p-2': ['p-3', 'ai-...'], 'p-3': ['p-2', 'p-1'] };
advanceHouse(house); // resolves nominations, advances to Saturday
assert(house.state.nominees.length >= 2, 'nominees determined');
assert(house.state.day === 6 && house.state.phase === 'party', 'advanced to Saturday party');

console.log('→ eviction resolution (Sunday)');
advanceHouse(house); // Saturday -> Sunday
assert(house.state.day === 7 && house.state.phase === 'eviction', 'reached Sunday');
advanceHouse(house); // resolves eviction, advances to next week day 1
const evicted = [...house.members.values(), ...house.aiMembers].find((m) => m.status === 'evicted');
assert(evicted !== undefined || house.state.gameOver, 'someone was evicted (or finale)');
assert(house.state.day === 1 && house.state.week === 2, 'rolled into week 2');

console.log('→ public state shape');
const ps = publicState(house);
assert(ps.week === 2 && ps.day === 1 && ps.phase === 'hoh', 'public state reflects week 2 day 1 hoh');
assert(ps.roster.length === 20, 'public roster totals 20');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
