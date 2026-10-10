import { serializeHouses, deserializeHouses } from '../server/persist';
import { createHouse, assignToHouse } from '../server/houseManager';

let pass = 0;
let fail = 0;
function assert(cond, label) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ ${label}`); }
}

function member(i) {
  return { id: `p-${i}`, nickname: `P${i}`, avatar: '😎', accentColor: '#e63946', fanbaseClout: 12000 + i, status: 'active', isHoH: false, isImmune: false, isNominated: false, isHuman: true, currentRoom: 'Lounge', __ws: { fake: 'socket' } };
}

console.log('→ serialize/deserialize round-trip');
const houses = [createHouse('House 1')];
assignToHouse(houses, member(1));
assignToHouse(houses, member(2));
const house = houses[0];
house.state.scores = { 'p-1': 6 };
house.state.votes = { 'p-1': ['p-2'] };
house.state.ready = new Set(['p-1', 'p-2']);
house.state.day = 4;
house.state.week = 3;

const serialized = serializeHouses(houses);
assert(!JSON.stringify(serialized).includes('__ws'), 'WebSocket refs stripped from serialized output');
assert(Array.isArray(serialized[0].state.ready), 'ready Set converted to array');

const restored = deserializeHouses(serialized);
assert(restored.length === 1, 'one house restored');
assert(restored[0].members.size === 2, 'members restored as a Map');
assert(restored[0].members.get('p-1').nickname === 'P1', 'member data intact');
assert(restored[0].aiMembers.length === 18, 'AI backfill restored (2 live + 18 AI)');
assert(restored[0].state.week === 3 && restored[0].state.day === 4, 'week/day preserved');
assert(restored[0].state.ready instanceof Set && restored[0].state.ready.has('p-1'), 'ready restored as a Set');
assert(restored[0].state.scores['p-1'] === 6, 'scores preserved');

console.log('→ empty / missing data deserializes safely');
assert(deserializeHouses(null).length === 0, 'null -> empty array');
assert(deserializeHouses(undefined).length === 0, 'undefined -> empty array');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
